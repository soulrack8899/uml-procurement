import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
from sqlmodel import Session, select
from models import (
    engine, create_db_and_tables, ProcurementRequest, LineItem, 
    FileMetadata, AuditLog, StatusEnum, UserRole
)
from services.po_generator import generate_po_pdf

app = FastAPI(title="UMLAB Procurement API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production (Vercel URL)
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Dependency for DB Session
def get_session():
    with Session(engine) as session:
        yield session

# --- Core Business Logic Helpers ---
def can_transition(current: StatusEnum, target: StatusEnum, total_amount: float) -> bool:
    """Strict State Machine Logic"""
    flow = [
        StatusEnum.DRAFT,
        StatusEnum.PENDING_MANAGER,
        StatusEnum.PENDING_DIRECTOR if total_amount > 5000 else None,
        StatusEnum.APPROVED,
        StatusEnum.PO_ISSUED,
        StatusEnum.PAYMENT_PENDING,
        StatusEnum.PAID
    ]
    # Filter out None from the flow
    clean_flow = [s for s in flow if s]
    
    try:
        curr_idx = clean_flow.index(current)
        target_idx = clean_flow.index(target)
        return target_idx == curr_idx + 1
    except ValueError:
        return False

# --- Endpoints ---

@app.post("/requests/", response_model=ProcurementRequest)
def create_request(request: ProcurementRequest, session: Session = Depends(get_session)):
    session.add(request)
    session.commit()
    session.refresh(request)
    
    # Initial Audit Log
    log = AuditLog(
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
def list_requests(session: Session = Depends(get_session)):
    return session.exec(select(ProcurementRequest)).all()

@app.get("/requests/{request_id}", response_model=ProcurementRequest)
def get_request(request_id: int, session: Session = Depends(get_session)):
    request = session.get(ProcurementRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request

@app.post("/requests/{request_id}/transition")
def transition_status(
    request_id: int, 
    target_status: StatusEnum, 
    user_name: str, 
    user_role: UserRole,
    session: Session = Depends(get_session)
):
    request = session.get(ProcurementRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # 1. Check Threshold Logic for Director Approval
    if not can_transition(request.status, target_status, request.total_amount):
        raise HTTPException(status_code=400, detail=f"Invalid transition from {request.status} to {target_status}")

    # 2. Enforce Role Requirements
    role_map = {
        StatusEnum.PENDING_MANAGER: UserRole.REQUESTER, # Initiating approval
        StatusEnum.PENDING_DIRECTOR: UserRole.MANAGER,   # Manager approving to Director
        StatusEnum.APPROVED: UserRole.DIRECTOR if request.total_amount > 5000 else UserRole.MANAGER,
        StatusEnum.PO_ISSUED: UserRole.FINANCE,
        StatusEnum.PAYMENT_PENDING: UserRole.FINANCE,
        StatusEnum.PAID: UserRole.FINANCE
    }
    
    if user_role != role_map.get(target_status):
         raise HTTPException(status_code=403, detail=f"User role {user_role} cannot authorize transition to {target_status}")

    # 3. File Integrity: Lockdown Payment Request until PO_ISSUED
    if target_status == StatusEnum.PAYMENT_PENDING:
        po_exists = any(f.file_type == 'PO' for f in request.files)
        if not po_exists:
             raise HTTPException(status_code=400, detail="Cannot initiate Payment Request: Record must have status PO_ISSUED with an attached PO file.")

    # Update Status
    old_status = request.status
    request.status = target_status
    request.updated_at = datetime.utcnow()
    
    # Log Change
    log = AuditLog(
        request_id=request_id,
        action="STATUS_CHANGE",
        from_status=old_status,
        to_status=target_status,
        user_name=user_name,
        user_role=user_role,
        notes=f"Status transitioned from {old_status} to {target_status}."
    )
    session.add(log)
    session.add(request)
    session.commit()
    
    # 4. Auto-generate PO if status is APPROVED
    if target_status == StatusEnum.APPROVED:
        os.makedirs("storage/pos", exist_ok=True)
        po_path = f"storage/pos/PO_{request_id}.pdf"
        
        # Prepare data for PDF
        request_dict = request.dict()
        request_dict['items'] = [i.dict() for i in request.items]
        
        generate_po_pdf(request_dict, po_path)
        
        # Auto-attach PO Metadata
        po_file = FileMetadata(
            filename=f"PO_{request_id}.pdf",
            file_type="PO",
            file_path=po_path,
            request_id=request_id
        )
        session.add(po_file)
        
        # Move state to PO_ISSUED automatically
        request.status = StatusEnum.PO_ISSUED
        session.add(AuditLog(
            request_id=request_id,
            action="AUTO_GENERATION",
            from_status=StatusEnum.APPROVED,
            to_status=StatusEnum.PO_ISSUED,
            user_name="Finance Bot",
            user_role=UserRole.FINANCE,
            notes="Purchase Order automatically generated and issued."
        ))
        session.commit()
        
    return {"message": "Success", "new_status": request.status}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
