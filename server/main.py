import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
from sqlmodel import Session, select
from models import (
    engine, create_db_and_tables, ProcurementRequest, LineItem, 
    FileMetadata, AuditLog, StatusEnum, UserRole, Company, 
    CompanySettings, PettyCash, PettyCashStatus, User, UserTenant
)
from services.po_generator import generate_po_pdf

app = FastAPI(title="UMLAB SaaS Procurement API")

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
    # Bootstrap default company and admin user on startup if none exists
    with Session(engine) as session:
        statement = select(Company).where(Company.name == "UMLAB Sarawak")
        results = session.exec(statement)
        if not results.first():
             # Creating Company
             new_company = Company(name="UMLAB Sarawak", domain="umlab.sarawak.my")
             session.add(new_company)
             session.commit()
             session.refresh(new_company)
             
             # Setting up Default Governance
             settings = CompanySettings(company_id=new_company.id, approval_threshold=5000.0)
             session.add(settings)
             
             # Creating Global Admin
             admin_user = User(name="Karlos Albert", role=UserRole.ADMIN)
             session.add(admin_user)
             session.commit()
             session.refresh(admin_user)
             
             # Mapping Admin to Tenant
             mapping = UserTenant(user_id=admin_user.id, company_id=new_company.id)
             session.add(mapping)
             session.commit()

# Dependency for DB Session
def get_session():
    with Session(engine) as session:
        yield session

# --- Strict Multi-Tenant Isolation Middleware ---
def get_current_tenant(
    x_company_id: int = Header(...), 
    x_user_id: int = Header(...), 
    session: Session = Depends(get_session)
):
    """Verifies User-to-Tenant Mapping for isolated data access"""
    mapping = session.exec(select(UserTenant).where(
        UserTenant.company_id == x_company_id,
        UserTenant.user_id == x_user_id
    )).first()
    
    if not mapping:
        raise HTTPException(status_code=403, detail="Forbidden: User is not authorized to access this tenant.")
    
    company = session.get(Company, x_company_id)
    user = session.get(User, x_user_id)
    return {"company": company, "user": user}

# --- Approval Engine Service ---
class ApprovalEngine:
    @staticmethod
    def get_next_status(current_status: StatusEnum, amount: float, threshold: float) -> Optional[StatusEnum]:
        """Calculates the dynamic approval gate based on tenant threshold policy"""
        if current_status == StatusEnum.DRAFT:
            return StatusEnum.SUBMITTED
        
        if current_status == StatusEnum.SUBMITTED:
            return StatusEnum.PENDING_MANAGER
        
        if current_status == StatusEnum.PENDING_MANAGER:
            # Dynamic Threshold Gate
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

# --- Procurement Endpoints (SaaS Refined) ---

@app.post("/requests/", response_model=ProcurementRequest)
def create_request(
    request: ProcurementRequest, 
    context: dict = Depends(get_current_tenant), 
    session: Session = Depends(get_session)
):
    request.company_id = context['company'].id
    session.add(request)
    session.commit()
    session.refresh(request)
    
    # Audit log
    log = AuditLog(
        company_id=context['company'].id,
        request_id=request.id,
        action="CREATED",
        to_status=StatusEnum.DRAFT,
        user_name=context['user'].name,
        user_role=context['user'].role,
        notes="Procurement request initiated in local tenant space."
    )
    session.add(log)
    session.commit()
    return request

@app.get("/requests/", response_model=List[ProcurementRequest])
def list_requests(
    context: dict = Depends(get_current_tenant), 
    session: Session = Depends(get_session)
):
    return session.exec(select(ProcurementRequest).where(
        ProcurementRequest.company_id == context['company'].id
    )).all()

@app.post("/requests/{request_id}/transition")
def transition_status(
    request_id: int, 
    context: dict = Depends(get_current_tenant),
    session: Session = Depends(get_session)
):
    request = session.exec(select(ProcurementRequest).where(
        ProcurementRequest.id == request_id, 
        ProcurementRequest.company_id == context['company'].id
    )).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found in isolated tenant context.")
    
    # Fetch Dynamic Policy
    settings = session.exec(select(CompanySettings).where(
        CompanySettings.company_id == context['company'].id
    )).one()
    
    target_status = ApprovalEngine.get_next_status(request.status, request.total_amount, settings.approval_threshold)
    if not target_status:
         raise HTTPException(status_code=400, detail="Invalid status flow sequence.")

    # Status Update
    old_status = request.status
    request.status = target_status
    request.updated_at = datetime.utcnow()
    
    # Audit Log
    log = AuditLog(
        company_id=context['company'].id,
        request_id=request_id,
        action="STATUS_TRANSITION",
        from_status=old_status,
        to_status=target_status,
        user_name=context['user'].name,
        user_role=context['user'].role,
        notes=f"Authorized transition under governance threshold RM {settings.approval_threshold}."
    )
    
    session.add(log)
    session.add(request)
    session.commit()

    # Post-transition Automation: PO Issuance
    if target_status == StatusEnum.APPROVED:
         # Auto-generation logic...
         os.makedirs(f"storage/{context['company'].id}/pos", exist_ok=True)
         po_path = f"storage/{context['company'].id}/pos/PO_{request_id}.pdf"
         request_dict = request.dict()
         request_dict['items'] = [i.dict() for i in request.items]
         generate_po_pdf(request_dict, po_path)
         
         po_file = FileMetadata(
            filename=f"PO_{request_id}.pdf",
            file_type="PO",
            file_path=po_path,
            request_id=request_id
         )
         session.add(po_file)
         request.status = StatusEnum.PO_ISSUED
         session.commit()

    return {"message": "Success", "next_status": request.status}

# --- Petty Cash Logic (SaaS Workflow) ---

@app.post("/petty-cash/", response_model=PettyCash)
def create_petty_cash(
    pc: PettyCash, 
    context: dict = Depends(get_current_tenant), 
    session: Session = Depends(get_session)
) -> PettyCash:
    pc.company_id = context['company'].id
    pc.requester_id = context['user'].id
    pc.status = PettyCashStatus.SUBMITTED
    session.add(pc)
    session.commit()
    session.refresh(pc)
    return pc

@app.get("/petty-cash/", response_model=List[PettyCash])
def list_petty_cash(
    context: dict = Depends(get_current_tenant), 
    session: Session = Depends(get_session)
):
    return session.exec(select(PettyCash).where(
        PettyCash.company_id == context['company'].id
    )).all()

@app.post("/petty-cash/{pc_id}/approve")
def approve_petty_cash(
    pc_id: int, 
    context: dict = Depends(get_current_tenant), 
    session: Session = Depends(get_session)
):
    pc = session.exec(select(PettyCash).where(
        PettyCash.id == pc_id, 
        PettyCash.company_id == context['company'].id
    )).first()
    
    if not pc:
        raise HTTPException(status_code=404, detail="Cash record not found.")
    
    pc.status = PettyCashStatus.APPROVED
    session.add(pc)
    session.commit()
    return {"status": pc.status}

@app.post("/petty-cash/{pc_id}/disburse")
def disburse_petty_cash(
    pc_id: int, 
    context: dict = Depends(get_current_tenant), 
    session: Session = Depends(get_session)
):
    pc = session.exec(select(PettyCash).where(
        PettyCash.id == pc_id, 
        PettyCash.company_id == context['company'].id
    )).first()
    
    if not pc:
        raise HTTPException(status_code=404, detail="Cash record not found.")
    
    pc.status = PettyCashStatus.DISBURSED
    pc.disbursed_at = datetime.utcnow()
    pc.disbursed_by_id = context['user'].id
    session.add(pc)
    session.commit()
    return {"status": pc.status, "timestamp": pc.disbursed_at}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
