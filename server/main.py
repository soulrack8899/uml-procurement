import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
from sqlmodel import Session, select
from models import (
    engine, create_db_and_tables, ProcurementRequest, LineItem, 
    FileMetadata, AuditLog, StatusEnum, UserRole, Company, 
    CompanySettings, PettyCash, PettyCashStatus, User, TenantAccess
)
from services.po_generator import generate_po_pdf

app = FastAPI(title="UMLAB SaaS Master API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    # Bootstrap default companies and multi-role user on startup
    with Session(engine) as session:
        statement = select(Company).where(Company.name == "UMLAB Sarawak")
        results = session.exec(statement)
        if not results.first():
             # Company A
             umlab = Company(name="UMLAB Sarawak", domain="umlab.sarawak.my")
             session.add(umlab)
             
             # Company B
             alfa = Company(name="Alfa Mount", domain="alfamount.my")
             session.add(alfa)
             session.commit()
             session.refresh(umlab)
             session.refresh(alfa)
             
             # Default settings
             session.add(CompanySettings(company_id=umlab.id, approval_threshold=5000.0))
             session.add(CompanySettings(company_id=alfa.id, approval_threshold=10000.0))
             
             # Global Admin User
             karlos = User(name="Karlos Albert", global_role=UserRole.ADMIN)
             session.add(karlos)
             session.commit()
             session.refresh(karlos)
             
             # Mapping DIFFERENT ROLES for DIFFERENT COMPANIES
             # Manager in UMLAB
             session.add(TenantAccess(user_id=karlos.id, company_id=umlab.id, role=UserRole.MANAGER))
             # Finance in Alfa Mount
             session.add(TenantAccess(user_id=karlos.id, company_id=alfa.id, role=UserRole.FINANCE))
             session.commit()

# Dependency for DB Session
def get_session():
    with Session(engine) as session:
        yield session

# --- Strict Multi-Tenant Authorization with Entity-Specific Roles ---
def get_active_session_context(
    x_company_id: int = Header(...), 
    x_user_id: int = Header(...), 
    session: Session = Depends(get_session)
):
    """
    Verifies TenantAccess mapping.
    Extracts the specific ROLE assigned to this user within THIS company.
    """
    access = session.exec(select(TenantAccess).where(
        TenantAccess.company_id == x_company_id,
        TenantAccess.user_id == x_user_id
    )).first()
    
    if not access:
        raise HTTPException(status_code=403, detail="Forbidden: No access record for this user in this entity.")
    
    company = session.get(Company, x_company_id)
    user = session.get(User, x_user_id)
    
    return {
        "company": company,
        "user": user,
        "active_role": access.role  # Entity-specific role permissions
    }

# --- Refined Approval Engine with Role Verification ---
class ApprovalEngine:
    @staticmethod
    def can_authorize_transition(current_role: UserRole, target_status: StatusEnum, amount: float, threshold: float) -> bool:
        """Enforces entity-specific role permissions for status transitions"""
        if target_status == StatusEnum.SUBMITTED:
             return current_role == UserRole.REQUESTER or current_role == UserRole.ADMIN
        
        if target_status == StatusEnum.PENDING_MANAGER:
             return current_role == UserRole.REQUESTER or current_role == UserRole.ADMIN
        
        if target_status == StatusEnum.PENDING_DIRECTOR:
             return current_role == UserRole.MANAGER or current_role == UserRole.ADMIN
             
        if target_status == StatusEnum.APPROVED:
             if amount > threshold:
                  return current_role == UserRole.DIRECTOR or current_role == UserRole.ADMIN
             return current_role == UserRole.MANAGER or current_role == UserRole.ADMIN
        
        if target_status in [StatusEnum.PO_ISSUED, StatusEnum.PAYMENT_PENDING, StatusEnum.PAID]:
             return current_role == UserRole.FINANCE or current_role == UserRole.ADMIN
             
        return False

    @staticmethod
    def get_next_status(current_status: StatusEnum, amount: float, threshold: float) -> Optional[StatusEnum]:
        if current_status == StatusEnum.DRAFT:
            return StatusEnum.SUBMITTED
        if current_status == StatusEnum.SUBMITTED:
            return StatusEnum.PENDING_MANAGER
        if current_status == StatusEnum.PENDING_MANAGER:
            return StatusEnum.PENDING_DIRECTOR if amount > threshold else StatusEnum.APPROVED
        if current_status == StatusEnum.PENDING_DIRECTOR:
            return StatusEnum.APPROVED
        if current_status == StatusEnum.APPROVED:
            return StatusEnum.PO_ISSUED
        if current_status == StatusEnum.PO_ISSUED:
            return StatusEnum.PAYMENT_PENDING
        if current_status == StatusEnum.PAYMENT_PENDING:
            return StatusEnum.PAID
        return None

# --- Tenant Aware Endpoints ---

@app.get("/session/whoami")
def whoami(context: dict = Depends(get_active_session_context)):
    """Surfaces contextual role for UI adaptation"""
    return {
        "user_name": context['user'].name,
        "company_name": context['company'].name,
        "active_role": context['active_role']
    }

@app.post("/requests/", response_model=ProcurementRequest)
def create_request(
    request: ProcurementRequest, 
    context: dict = Depends(get_active_session_context), 
    session: Session = Depends(get_session)
):
    request.company_id = context['company'].id
    session.add(request)
    session.commit()
    session.refresh(request)
    return request

@app.get("/requests/", response_model=List[ProcurementRequest])
def list_requests(
    context: dict = Depends(get_active_session_context), 
    session: Session = Depends(get_session)
):
    return session.exec(select(ProcurementRequest).where(
        ProcurementRequest.company_id == context['company'].id
    )).all()

@app.get("/requests/{request_id}", response_model=ProcurementRequest)
def get_request(
    request_id: int, 
    context: dict = Depends(get_active_session_context), 
    session: Session = Depends(get_session)
):
    req = session.exec(select(ProcurementRequest).where(
        ProcurementRequest.id == request_id, 
        ProcurementRequest.company_id == context['company'].id
    )).first()
    if not req:
        raise HTTPException(status_code=404, detail="Unauthorized/Not Found")
    return req

@app.post("/requests/{request_id}/transition")
def transition_status(
    request_id: int, 
    context: dict = Depends(get_active_session_context),
    session: Session = Depends(get_session)
):
    request = session.exec(select(ProcurementRequest).where(
        ProcurementRequest.id == request_id, 
        ProcurementRequest.company_id == context['company'].id
    )).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request context mismatch")
    
    settings = session.exec(select(CompanySettings).where(
        CompanySettings.company_id == context['company'].id
    )).one()
    
    target_status = ApprovalEngine.get_next_status(request.status, request.total_amount, settings.approval_threshold)
    if not target_status:
         raise HTTPException(status_code=400, detail="Terminal or invalid flow")

    # ROLE VERIFICATION for specific entity context
    if not ApprovalEngine.can_authorize_transition(context['active_role'], target_status, request.total_amount, settings.approval_threshold):
         raise HTTPException(status_code=403, detail=f"User as {context['active_role']} unauthorized for next sequence {target_status} in {context['company'].name}")

    old_status = request.status
    request.status = target_status
    request.updated_at = datetime.utcnow()
    
    log = AuditLog(
        company_id=context['company'].id,
        request_id=request_id,
        action="TRANSITION",
        from_status=old_status,
        to_status=target_status,
        user_name=context['user'].name,
        user_role=context['active_role'],
        notes=f"Authorized under {context['company'].name} governance policy."
    )
    session.add(log)
    session.add(request)
    session.commit()
    
    if target_status == StatusEnum.APPROVED:
         request.status = StatusEnum.PO_ISSUED
         session.commit()

    return {"status": request.status}

# --- Companies ---

@app.get("/companies/", response_model=List[Company])
def list_companies(session: Session = Depends(get_session)):
    return session.exec(select(Company)).all()

# --- Petty Cash (Contextual Role Check) ---

@app.get("/petty-cash/", response_model=List[PettyCash])
def list_petty_cash(context: dict = Depends(get_active_session_context), session: Session = Depends(get_session)):
    return session.exec(select(PettyCash).where(PettyCash.company_id == context['company'].id)).all()

@app.post("/petty-cash/{pc_id}/approve")
def approve_pc(pc_id: int, context: dict = Depends(get_active_session_context), session: Session = Depends(get_session)):
    pc = session.exec(select(PettyCash).where(PettyCash.id == pc_id, PettyCash.company_id == context['company'].id)).first()
    if context['active_role'] not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Managerial clearance required.")
    pc.status = PettyCashStatus.APPROVED
    session.add(pc)
    session.commit()
    return {"status": pc.status}

@app.post("/petty-cash/{pc_id}/disburse")
def disburse_pc(pc_id: int, context: dict = Depends(get_active_session_context), session: Session = Depends(get_session)):
    pc = session.exec(select(PettyCash).where(PettyCash.id == pc_id, PettyCash.company_id == context['company'].id)).first()
    if context['active_role'] not in [UserRole.FINANCE, UserRole.ADMIN]:
         raise HTTPException(status_code=403, detail="Finance/Admin authorization required for cash payout.")
    pc.status = PettyCashStatus.DISBURSED
    pc.disbursed_at = datetime.utcnow()
    pc.disbursed_by_id = context['user'].id
    session.add(pc)
    session.commit()
    return {"status": pc.status}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
