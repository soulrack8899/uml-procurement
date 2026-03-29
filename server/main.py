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

# Enable CORS for React frontend (Vercel) and local development
origins = [
    "https://uml-procurement-internal.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "https://uml-procurement-internal-production.up.railway.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins + ["*"],
    allow_credentials=False, # Set to True once we use cookies/auth headers
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # This handler helps us catch unhandled 500s and ensures they still have CORS headers
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "exception": str(exc)},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("Origin", "*"),
            "Access-Control-Allow-Credentials": "false",
        }
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
             karlos = User(name="Karlos Albert", global_role=UserRole.GLOBAL_ADMIN)
             session.add(karlos)
             
             # Case C: Johor Partner
             johor = User(name="Johor Partner")
             session.add(johor)
             
             session.commit()
             session.refresh(karlos)
             session.refresh(johor)
             
             # Mapping DIFFERENT ROLES for DIFFERENT COMPANIES
             # Manager in UMLAB
             session.add(TenantAccess(user_id=karlos.id, company_id=umlab.id, role=UserRole.MANAGER))
             # Finance in Alfa Mount
             session.add(TenantAccess(user_id=karlos.id, company_id=alfa.id, role=UserRole.FINANCE))
             
             # Case C: Assign Johor Partner ONLY to UMLAB Sarawak as Director
             session.add(TenantAccess(user_id=johor.id, company_id=umlab.id, role=UserRole.DIRECTOR))
             
             # Case A: Alfa Mount pending request for RM 10,000
             request_a = ProcurementRequest(
                 company_id=alfa.id,
                 created_by=karlos.id,
                 title="Enterprise Server Rack",
                 vendor_name="Dell Emc",
                 vendor_id="V-103",
                 total_amount=10000.0,
                 status=StatusEnum.PENDING_DIRECTOR
             )
             session.add(request_a)
             
             # Case B: UMLAB Sarawak petty cash request for RM 150 Ready for disbursement
             petty_b = PettyCash(
                 company_id=umlab.id,
                 requester_id=karlos.id,
                 amount=150.0,
                 receipt_url="PC-0012",
                 status=PettyCashStatus.APPROVED
             )
             session.add(petty_b)
             
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
    user = session.get(User, x_user_id)
    if not user:
        raise HTTPException(status_code=403, detail="Forbidden: User not found.")

    company = session.get(Company, x_company_id) if x_company_id else None

    # Global Admin bypasses tenant checks, but still needs a company for company-specific actions
    if user.global_role == UserRole.GLOBAL_ADMIN:
        if x_company_id and not company:
             raise HTTPException(status_code=404, detail=f"Company {x_company_id} not found.")
             
        return {
            "company": company,
            "user": user,
            "active_role": UserRole.GLOBAL_ADMIN
        }

    if not company:
        raise HTTPException(status_code=404, detail=f"Company {x_company_id} not found.")

    access = session.exec(select(TenantAccess).where(
        TenantAccess.company_id == x_company_id,
        TenantAccess.user_id == x_user_id
    )).first()
    
    if not access:
        raise HTTPException(status_code=403, detail="Forbidden: No access record for this user in this entity.")
    
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

# --- Global Registry (Tenant Discovery) ---

@app.get("/companies/", response_model=List[Company])
def list_companies(session: Session = Depends(get_session)):
    """Fetches all companies for the global context switcher"""
    return session.exec(select(Company)).all()

@app.get("/vendors/")
def list_vendors(context: dict = Depends(get_active_session_context), session: Session = Depends(get_session)):
    """Fetches unique vendors currently active in the tenant context"""
    requests = session.exec(select(ProcurementRequest).where(
        ProcurementRequest.company_id == context['company'].id
    )).all()
    
    unique_vendors = {}
    for r in requests:
        if r.vendor_id not in unique_vendors:
            unique_vendors[r.vendor_id] = {
                "id": r.vendor_id,
                "name": r.vendor_name,
                "total_volume": 0
            }
        unique_vendors[r.vendor_id]["total_volume"] += r.total_amount
        
    return list(unique_vendors.values())

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
    if not context['company']:
        raise HTTPException(status_code=400, detail="Missing company context for request.")
        
    request.company_id = context['company'].id
    request.created_by = context['user'].id
    session.add(request)
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Database commit failed: {str(e)}")
    session.refresh(request)
    return request

@app.get("/requests/", response_model=List[ProcurementRequest])
def list_requests(
    context: dict = Depends(get_active_session_context), 
    session: Session = Depends(get_session)
):
    if context['active_role'] == UserRole.GLOBAL_ADMIN:
        return session.exec(select(ProcurementRequest)).all()
    
    # Otherwise, filter by the active company ID (which handles DIRECTOR and others)
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

@app.post("/companies/onboard", response_model=Company)
def onboard_company(
    company: Company, 
    session: Session = Depends(get_session)
):
    """Provisions a new enterprise tenant and default settings"""
    session.add(company)
    session.commit()
    session.refresh(company)
    
    # Initialize default settings
    settings = CompanySettings(company_id=company.id)
    session.add(settings)
    
    # Map the current user as an ADMIN for the new company by default (mocking current user 1)
    session.add(TenantAccess(user_id=1, company_id=company.id, role=UserRole.ADMIN))
    
    session.commit()
    session.refresh(company)
    return company

@app.patch("/companies/{company_id}", response_model=Company)
def update_company(
    company_id: int,
    company_update: dict,
    session: Session = Depends(get_session)
):
    """Updates company profile metadata including logo_url"""
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    for key, value in company_update.items():
        if hasattr(company, key):
            setattr(company, key, value)
            
    session.add(company)
    session.commit()
    session.refresh(company)
    return company

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
    if context['active_role'] not in [UserRole.FINANCE, UserRole.ADMIN, UserRole.MANAGER]:
         raise HTTPException(status_code=403, detail="Finance/Admin/Manager authorization required for cash payout.")
    pc.status = PettyCashStatus.DISBURSED
    pc.disbursed_at = datetime.utcnow()
    pc.disbursed_by_id = context['user'].id
    session.add(pc)
    session.commit()
    return {"status": pc.status}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
