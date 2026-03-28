import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
from sqlmodel import Session, select
from models import (
    engine, create_db_and_tables, ProcurementRequest, LineItem, 
    FileMetadata, AuditLog, StatusEnum, UserRole, Company, 
    CompanySettings, PettyCash, PettyCashStatus
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
    # Bootstrap default company if none exists
    with Session(engine) as session:
        statement = select(Company).where(Company.name == "UMLAB Sarawak")
        results = session.exec(statement)
        if not results.first():
             new_company = Company(name="UMLAB Sarawak", domain="umlab.sarawak.my")
             session.add(new_company)
             session.commit()
             session.refresh(new_company)
             settings = CompanySettings(company_id=new_company.id, approval_threshold=5000.0)
             session.add(settings)
             session.commit()

# Dependency for DB Session
def get_session():
    with Session(engine) as session:
        yield session

# Dependency for Multi-Tenant Isolation
def get_current_company(x_company_id: int = Header(...), session: Session = Depends(get_session)):
    company = session.get(Company, x_company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company Context Invalid")
    return company

# --- Core Business Logic Helpers ---
def can_transition(current: StatusEnum, target: StatusEnum, total_amount: float, threshold: float) -> bool:
    """Strict State Machine Logic with Dynamic Threshold"""
    flow = [
        StatusEnum.DRAFT,
        StatusEnum.PENDING_MANAGER,
        StatusEnum.PENDING_DIRECTOR if total_amount > threshold else None,
        StatusEnum.APPROVED,
        StatusEnum.PO_ISSUED,
        StatusEnum.PAYMENT_PENDING,
        StatusEnum.PAID
    ]
    clean_flow = [s for s in flow if s]
    try:
        curr_idx = clean_flow.index(current)
        target_idx = clean_flow.index(target)
        return target_idx == curr_idx + 1
    except ValueError:
        return False

# --- Admin/Onboarding Endpoints ---

@app.post("/companies/", response_model=Company)
def create_company(company: Company, session: Session = Depends(get_session)):
    session.add(company)
    session.commit()
    session.refresh(company)
    # Default settings
    settings = CompanySettings(company_id=company.id, approval_threshold=5000.0)
    session.add(settings)
    session.commit()
    return company

@app.get("/companies/", response_model=List[Company])
def list_companies(session: Session = Depends(get_session)):
    return session.exec(select(Company)).all()

@app.get("/companies/{cid}/settings", response_model=CompanySettings)
def get_settings(cid: int, session: Session = Depends(get_session)):
    statement = select(CompanySettings).where(CompanySettings.company_id == cid)
    return session.exec(statement).one()

@app.patch("/companies/{cid}/settings")
def update_settings(cid: int, threshold: float, session: Session = Depends(get_session)):
    statement = select(CompanySettings).where(CompanySettings.company_id == cid)
    settings = session.exec(statement).one()
    settings.approval_threshold = threshold
    session.add(settings)
    session.commit()
    return {"message": "Settings updated", "new_threshold": threshold}

# --- Procurement Endpoints (Tenant Aware) ---

@app.post("/requests/", response_model=ProcurementRequest)
def create_request(
    request: ProcurementRequest, 
    company: Company = Depends(get_current_company), 
    session: Session = Depends(get_session)
):
    request.company_id = company.id
    session.add(request)
    session.commit()
    session.refresh(request)
    
    log = AuditLog(
        company_id=company.id,
        request_id=request.id,
        action="CREATED",
        to_status=StatusEnum.DRAFT,
        user_name="System",
        user_role=UserRole.REQUESTER,
        notes="Request initialized in Draft state."
    )
    session.add(log)
    session.commit()
    return request

@app.get("/requests/", response_model=List[ProcurementRequest])
def list_requests(
    company: Company = Depends(get_current_company), 
    session: Session = Depends(get_session)
):
    # Filter by current tenant ID
    statement = select(ProcurementRequest).where(ProcurementRequest.company_id == company.id)
    return session.exec(statement).all()

@app.get("/requests/{request_id}", response_model=ProcurementRequest)
def get_request(
    request_id: int, 
    company: Company = Depends(get_current_company), 
    session: Session = Depends(get_session)
):
    statement = select(ProcurementRequest).where(
        ProcurementRequest.id == request_id, 
        ProcurementRequest.company_id == company.id
    )
    request = session.exec(statement).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found in this company context")
    return request

@app.post("/requests/{request_id}/transition")
def transition_status(
    request_id: int, 
    target_status: StatusEnum, 
    user_name: str, 
    user_role: UserRole,
    company: Company = Depends(get_current_company),
    session: Session = Depends(get_session)
):
    statement = select(ProcurementRequest).where(
        ProcurementRequest.id == request_id, 
        ProcurementRequest.company_id == company.id
    )
    request = session.exec(statement).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request context mismatch")
    
    # Fetch Dynamic Threshold
    statement_settings = select(CompanySettings).where(CompanySettings.company_id == company.id)
    settings = session.exec(statement_settings).one()
    threshold = settings.approval_threshold

    # 1. State Machine Check
    if not can_transition(request.status, target_status, request.total_amount, threshold):
        raise HTTPException(status_code=400, detail=f"Invalid transition from {request.status} to {target_status}")

    # 2. Logic Check (Role Mapping)
    role_map = {
        StatusEnum.PENDING_MANAGER: UserRole.REQUESTER,
        StatusEnum.PENDING_DIRECTOR: UserRole.MANAGER,
        StatusEnum.APPROVED: UserRole.DIRECTOR if request.total_amount > threshold else UserRole.MANAGER,
        StatusEnum.PO_ISSUED: UserRole.FINANCE,
        StatusEnum.PAYMENT_PENDING: UserRole.FINANCE,
        StatusEnum.PAID: UserRole.FINANCE
    }
    
    if user_role != role_map.get(target_status):
         raise HTTPException(status_code=403, detail=f"User role {user_role} unauthorized for {target_status}")

    # Update Status
    old_status = request.status
    request.status = target_status
    request.updated_at = datetime.utcnow()
    
    log = AuditLog(
        company_id=company.id,
        request_id=request_id,
        action="STATUS_CHANGE",
        from_status=old_status,
        to_status=target_status,
        user_name=user_name,
        user_role=user_role,
        notes=f"Authorized transition to {target_status} under tenant policy."
    )
    session.add(log)
    session.add(request)
    session.commit()
    
    if target_status == StatusEnum.APPROVED:
        os.makedirs(f"storage/{company.id}/pos", exist_ok=True)
        po_path = f"storage/{company.id}/pos/PO_{request_id}.pdf"
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
        session.add(AuditLog(
            company_id=company.id,
            request_id=request_id,
            action="AUTO_GENERATION",
            from_status=StatusEnum.APPROVED,
            to_status=StatusEnum.PO_ISSUED,
            user_name="Finance Bot",
            user_role=UserRole.FINANCE,
            notes="Purchase Order automatically generated."
        ))
        session.commit()
    return {"message": "Success", "new_status": request.status}

# --- Petty Cash Endpoints ---

@app.post("/petty-cash/", response_model=PettyCash)
def create_petty_cash(
    pc: PettyCash, 
    company: Company = Depends(get_current_company), 
    session: Session = Depends(get_session)
):
    pc.company_id = company.id
    session.add(pc)
    session.commit()
    session.refresh(pc)
    return pc

@app.get("/petty-cash/", response_model=List[PettyCash])
def list_petty_cash(
    company: Company = Depends(get_current_company), 
    session: Session = Depends(get_session)
):
    statement = select(PettyCash).where(PettyCash.company_id == company.id)
    return session.exec(statement).all()

@app.post("/petty-cash/{pc_id}/disburse")
def disburse_petty_cash(
    pc_id: int, 
    user_name: str, 
    company: Company = Depends(get_current_company), 
    session: Session = Depends(get_session)
):
    statement = select(PettyCash).where(
        PettyCash.id == pc_id, 
        PettyCash.company_id == company.id
    )
    pc = session.exec(statement).first()
    if not pc:
        raise HTTPException(status_code=404, detail="Petty cash record mismatch")
    
    pc.status = PettyCashStatus.DISBURSED
    pc.disbursed_at = datetime.utcnow()
    pc.disbursed_by = user_name
    session.add(pc)
    session.commit()
    return {"message": "Cash disbursed", "disbursed_by": user_name, "timestamp": pc.disbursed_at}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
