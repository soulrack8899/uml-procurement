import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import logging

# Configure diagnostic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")
from datetime import datetime
from sqlmodel import Session, select, SQLModel
from models import (
    engine, create_db_and_tables, ProcurementRequest, LineItem, 
    FileMetadata, AuditLog, StatusEnum, UserRole, Company, 
    CompanySettings, PettyCash, PettyCashStatus, User, TenantAccess
)
from services.po_generator import generate_po_pdf
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import timedelta

# Security Contexts
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60 # 30 days for demo

import hashlib

def get_password_hash(password):
    # Pre-hash with SHA-256 to bypass Bcrypt 72-byte limit and handle long passwords/env-vars safely
    pre_hash = hashlib.sha256(password.strip().encode()).hexdigest()
    return pwd_context.hash(pre_hash)

def verify_password(plain_password, hashed_password):
    # Ensure current input is pre-hashed the same way before verification
    pre_hash = hashlib.sha256(plain_password.strip().encode()).hexdigest()
    try:
        return pwd_context.verify(pre_hash, hashed_password)
    except Exception as e:
        logger.error(f"VERIFICATION ERROR: {str(e)}")
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Schema for incoming request data
class LineItemCreate(BaseModel):
    description: str
    quantity: int
    uom: str
    unit_price: float
    total_price: float

class RequestCreate(BaseModel):
    title: Optional[str] = "Untitled Procurement"
    vendor_name: Optional[str] = "Unknown Vendor"
    vendor_id: Optional[str] = "V-NEW"
    total_amount: float
    items: List[LineItemCreate]
    quotation_url: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    name: str
    email: str
    phone_number: Optional[str] = None
    password: str = "password123"
    company_id: Optional[int] = None
    role: UserRole = UserRole.REQUESTER

app = FastAPI(title="UMLAB SaaS Master API")

# Dynamic CORS Handling with Fallback
allow_origin_regex = r"https://.*\.vercel\.app|https://.*\.railway\.app|https://procusure\.vercel\.app|http://localhost:.*"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://uml-procurement-internal.vercel.app", "https://procusure.vercel.app"],
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.middleware("http")
async def force_cors_headers(request: Request, call_next):
    """Fallback middleware to ensure CORS headers are present even for OPTIONS or Errors"""
    if request.method == "OPTIONS":
        # Handle Preflights manually if the standard middleware missed it
        origin = request.headers.get("Origin")
        return JSONResponse(
            status_code=200,
            content="OK",
            headers={
                "Access-Control-Allow-Origin": origin if origin else "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true"
            }
        )
    
    response = await call_next(request)
    # Ensure response has CORS headers before leaving the server
    origin = request.headers.get("Origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.get("/")
def read_root():
    return {"status": "ok", "service": "ProcuSure SaaS Master API", "timestamp": datetime.utcnow().isoformat()}

@app.get("/debug/code")
def check_server_code():
    """Diagnostic to see what hashing logic is actually LIVE on the server"""
    import inspect
    try:
        h_src = inspect.getsource(get_password_hash)
        v_src = inspect.getsource(verify_password)
        return {
            "hashing_logic": h_src,
            "verification_logic": v_src,
            "env_master_email": os.getenv("MASTER_ADMIN_EMAIL", "NOT_SET")[:5] + "...",
            "env_master_pass_len": len(os.getenv("MASTER_ADMIN_PASSWORD", ""))
        }
    except Exception as e:
        return {"error": str(e)}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    error_detail = traceback.format_exc()
    print(f"CRITICAL ERROR: {error_detail}")
    
    # Ensure unhandled errors return valid CORS headers to prevent "Missing Header" errors in browser
    origin = request.headers.get("Origin")
    # If the origin is missing or not allowed, fallback to a safe default if needed, 
    # but for error responses we want to be as permissive as possible to allow the frontend to see the error.
    
    headers = {
        "Access-Control-Allow-Origin": origin if origin else "*",
        "Access-Control-Allow-Credentials": "true" if origin else "false",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*"
    }
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "exception": str(exc), "traceback": error_detail if os.getenv("DEBUG") else None},
        headers=headers
    )

@app.on_event("startup")
def on_startup():
    """Initializes database and performs mission-critical seeding"""
    logger.info("INITIATING MISSION-CRITICAL DATABASE BOOTSTRAP...")
    try:
        # Force table registration by checking metadata
        discovered_tables = list(SQLModel.metadata.tables.keys())
        logger.info(f"DISCOVERED SCHEMAS IN METADATA: {discovered_tables}")
        
        # FATAL: If this fails, the app must not start
        create_db_and_tables()
        logger.info("DATABASE TABLES CREATED/VERIFIED SUCCESSFULLY.")
        
        # Safe Migration Wrapper - ensures columns exist without crashing if they already do
        from sqlalchemy import text
        with Session(engine) as session:
            migrations = [
                "ALTER TABLE procurementrequest ADD COLUMN status VARCHAR DEFAULT 'DRAFT'",
                "ALTER TABLE procurementrequest ADD COLUMN quotation_url VARCHAR",
                "ALTER TABLE user ADD COLUMN email VARCHAR",
                "ALTER TABLE user ADD COLUMN password VARCHAR DEFAULT 'password123'",
                "ALTER TABLE user ADD COLUMN approval_status VARCHAR DEFAULT 'APPROVED'",
                "ALTER TABLE user ADD COLUMN global_role VARCHAR DEFAULT 'REQUESTER'",
                "ALTER TABLE user ADD COLUMN is_temporary_password BOOLEAN DEFAULT 0",
                "ALTER TABLE user ADD COLUMN phone_number VARCHAR",
                "ALTER TABLE pettycash ADD COLUMN description VARCHAR DEFAULT 'Petty Cash Claim'"
            ]
            for m in migrations:
                try:
                    session.execute(text(m))
                    session.commit()
                except Exception:
                    session.rollback() # Logic: Column likely already exists
            
            # Safe Bootstrap - only seeds if the standard company doesn't exist
            try:
                statement = select(Company).where(Company.name == "UMLAB Sarawak")
                if not session.exec(statement).first():
                    # Seed Companies
                    umlab = Company(name="UMLAB Sarawak", domain="umlab.sarawak.my")
                    merakai = Company(name="Merakai Indah Sdn Bhd", domain="merakai.indah.my")
                    quantum = Company(name="Quantum Sense Sdn Bhd", domain="quantumsense.my")
                    session.add_all([umlab, merakai, quantum])
                    session.commit()
                    
                    # Refresh to get IDs
                    session.refresh(umlab)
                    session.refresh(merakai)
                    session.refresh(quantum)
                    
                    # Default settings
                    session.add(CompanySettings(company_id=umlab.id, approval_threshold=5000.0))
                    session.add(CompanySettings(company_id=merakai.id, approval_threshold=10000.0))
                    session.add(CompanySettings(company_id=quantum.id, approval_threshold=15000.0))
                    session.commit()
                
                # Master Admin
                master_email = os.getenv("MASTER_ADMIN_EMAIL", "pomodorotechco@gmail.com").lower().strip()
                master_pass = os.getenv("MASTER_ADMIN_PASSWORD", "pomodorotechco123")
                
                pomodoro = session.exec(select(User).where(User.email == master_email)).first()
                if not pomodoro:
                    logger.info(f"PROVISIONING NEW MASTER AUTHORITY: {master_email}")
                    pomodoro = User(
                        name="Global Systems Admin", 
                        email=master_email, 
                        password=get_password_hash(master_pass),
                        global_role=UserRole.GLOBAL_ADMIN,
                        approval_status="APPROVED",
                        is_temporary_password=False
                    )
                    session.add(pomodoro)
                else:
                    logger.info(f"SYNCHRONIZING EXISTING MASTER AUTHORITY: {master_email}")
                    pomodoro.password = get_password_hash(master_pass)
                    pomodoro.approval_status = "APPROVED"
                    pomodoro.global_role = UserRole.GLOBAL_ADMIN
                    session.add(pomodoro)
                
                session.commit()
                logger.info(f"BOOTSTRAP COMPLETE: Master {master_email} is now ACTIVE.")
            except Exception as e:
                session.rollback()
                logger.error(f"SEEDING ERROR (NON-FATAL): {str(e)}")
                
    except Exception as e:
        import traceback
        logger.error("FATAL DATABASE STARTUP ERROR. CRASHING TO PREVENT ZOMBIE STATE.")
        traceback.print_exc()
        raise e

# Dependency for DB Session
def get_session():
    with Session(engine) as session:
        yield session

@app.get("/debug/sync-master")
def force_sync_master(session: Session = Depends(get_session)):
    """Emergency trigger to force-sync and re-hash Master Admin credentials"""
    master_email = os.getenv("MASTER_ADMIN_EMAIL", "pomodorotechco@gmail.com").lower().strip()
    master_pass = os.getenv("MASTER_ADMIN_PASSWORD", "pomodorotechco123")
    
    user = session.exec(select(User).where(User.email == master_email)).first()
    if not user:
        user = User(
            name="Global Systems Admin",
            email=master_email,
            password=get_password_hash(master_pass),
            global_role=UserRole.GLOBAL_ADMIN,
            approval_status="APPROVED",
            is_temporary_password=False
        )
        session.add(user)
        msg = f"Master User CREATED and HASHED: {master_email}"
    else:
        user.password = get_password_hash(master_pass)
        user.global_role = UserRole.GLOBAL_ADMIN
        user.approval_status = "APPROVED"
        session.add(user)
        msg = f"Master User UPDATED and RE-HASHED: {master_email}"
    
    session.commit()
    return {"status": "SUCCESS", "message": msg, "target_email": master_email}

# --- Strict Multi-Tenant Authorization with JWT & Entity-Specific Roles ---
def get_active_session_context(
    request: Request,
    x_company_id: Optional[int] = Header(None), 
    session: Session = Depends(get_session)
):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
         raise HTTPException(status_code=401, detail="Unauthorized: Missing or invalid token.")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials.")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=403, detail="Forbidden: User not found.")

    company = session.get(Company, x_company_id) if x_company_id else None

    # Global Admin bypasses tenant checks
    if user.global_role == UserRole.GLOBAL_ADMIN:
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

    @staticmethod
    def get_role_capabilities(role: UserRole, threshold: float):
        """Standardized capability and limit map for UI adaptation"""
        capabilities = {
            UserRole.GLOBAL_ADMIN: {
                "label": "System Master",
                "limit": "Unlimited",
                "permissions": ["all_access", "provision_admins", "provision_entities"]
            },
            UserRole.ADMIN: {
                "label": "Entity Admin",
                "limit": "Unlimited (Override)",
                "permissions": ["manage_users", "manage_settings", "override_approvals"]
            },
            UserRole.DIRECTOR: {
                "label": "Executive Director",
                "limit": "Unlimited",
                "permissions": ["final_approval", "high_value_auth"]
            },
            UserRole.MANAGER: {
                "label": "Operational Manager",
                "limit": f"RM {threshold:,.2f}",
                "permissions": ["standard_approval"]
            },
            UserRole.FINANCE: {
                "label": "Finance Officer",
                "limit": "N/A",
                "permissions": ["po_issuance", "payment_disbursement"]
            },
            UserRole.REQUESTER: {
                "label": "Requester",
                "limit": "RM 0.00",
                "permissions": ["create_requests"]
            }
        }
        return capabilities.get(role, {"label": "Unknown", "limit": "0.00", "permissions": []})


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
def whoami(context: dict = Depends(get_active_session_context), session: Session = Depends(get_session)):
    """Surfaces contextual role and capability limits for UI adaptation"""
    settings = session.exec(select(CompanySettings).where(
        CompanySettings.company_id == context['company'].id
    )).first() if context['company'] else None
    
    threshold = settings.approval_threshold if settings else 5000.0
    capabilities = ApprovalEngine.get_role_capabilities(context['active_role'], threshold)
    
    return {
        "user_id": context['user'].id,
        "user_name": context['user'].name,
        "company_id": context['company'].id if context['company'] else None,
        "company_name": context['company'].name if context['company'] else "ProcuSure SaaS Hub",
        "active_role": context['active_role'],
        "global_role": context['user'].global_role,
        "role_info": capabilities,
        "governance": {
            "threshold": threshold,
            "currency": "RM"
        }
    }

@app.post("/session/register")
def register_user(user_data: UserCreate, session: Session = Depends(get_session)):
    # Check if user already exists
    existing = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Identity ID already registered in ecosystem cluster.")
    
    # Create new identity in PENDING status
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        phone_number=user_data.phone_number,
        password=get_password_hash(user_data.password), # Use secure hashing
        global_role=UserRole.REQUESTER,
        approval_status="PENDING",
        is_temporary_password=True
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    # Map to company if provided
    if user_data.company_id:
        company = session.get(Company, user_data.company_id)
        if company:
            session.add(TenantAccess(user_id=new_user.id, company_id=company.id, role=UserRole.REQUESTER))
            session.commit()
        else:
            raise HTTPException(status_code=404, detail="Entity target not found.")
            
    return {"status": "SUCCESS", "user_id": new_user.id, "message": "Identity registered. Pending governance authorization."}

@app.post("/session/login")
def login(request: LoginRequest, session: Session = Depends(get_session)):
    """Simple login with status and temporary password validation"""
    email_clean = request.email.lower().strip()
    user = session.exec(select(User).where(User.email == email_clean)).first()
    
    # AUTO-PROVISIONING: If this is the master email and it's missing, create it immediately
    master_email = os.getenv("MASTER_ADMIN_EMAIL", "pomodorotechco@gmail.com").lower().strip()
    if not user and email_clean == master_email:
        logger.info(f"AUTO-PROVISIONING MASTER ADMIN: {master_email}")
        master_pass = os.getenv("MASTER_ADMIN_PASSWORD", "pomodorotechco123")
        user = User(
            name="Global Systems Admin",
            email=master_email,
            password=get_password_hash(master_pass),
            global_role=UserRole.GLOBAL_ADMIN,
            approval_status="APPROVED",
            is_temporary_password=False
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    
    if not user:
        logger.warning(f"LOGIN FAILURE: Identity {email_clean} not found.")
        raise HTTPException(
            status_code=401, 
            detail=f"Identity {email_clean} not found. Register a new identity to continue."
        )
        
    if not verify_password(request.password, user.password):
        logger.warning(f"LOGIN FAILURE: Password Mismatch for {email_clean}")
        # Identify if it's the master user having issues
        if email_clean == os.getenv("MASTER_ADMIN_EMAIL", "pomodorotechco@gmail.com").lower().strip():
             logger.info("MASTER AUTH ATTEMPT: Comparing against hash prefix " + user.password[:8])
        raise HTTPException(status_code=401, detail="Invalid identity credentials. Check password or sync via /debug/sync-master")
    
    if user.approval_status != "APPROVED":
        logger.warning(f"LOGIN REJECTION: Identity {email_clean} is {user.approval_status}")
        raise HTTPException(status_code=403, detail=f"Access Denied: Your account status is {user.approval_status}. Contact your Administrator.")
    
    # Find their primary company for context
    primary_access = session.exec(select(TenantAccess).where(TenantAccess.user_id == user.id)).first()
    
    # Generate Bearer Token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "user_name": user.name,
        "active_company_id": primary_access.company_id if primary_access else None,
        "role": user.global_role,
        "is_temporary_password": user.is_temporary_password
    }

class PasswordChangeRequest(BaseModel):
    new_password: str

@app.post("/session/change-password")
def change_password(
    data: PasswordChangeRequest, 
    context: dict = Depends(get_active_session_context), 
    session: Session = Depends(get_session)
):
    user = context['user']
    user.password = get_password_hash(data.new_password)
    user.is_temporary_password = False
    session.add(user)
    session.commit()
    return {"status": "SUCCESS", "message": "Identity security key updated in cluster."}

@app.get("/users/", response_model=List[User])
def list_users(
    context: dict = Depends(get_active_session_context), 
    session: Session = Depends(get_session)
):
    """Lists users based on hierarchy: GLOBAL_ADMIN sees all, ADMIN sees company only."""
    if context['active_role'] == UserRole.GLOBAL_ADMIN:
        return session.exec(select(User)).all()
    
    if context['active_role'] == UserRole.ADMIN:
        # Get all users who have access to the same company
        company_id = context['company'].id
        user_ids_in_company = session.exec(select(TenantAccess.user_id).where(TenantAccess.company_id == company_id)).all()
        return session.exec(select(User).where(User.id.in_(user_ids_in_company))).all()
    
    raise HTTPException(status_code=403, detail="Unauthorized to view user directory.")

@app.patch("/users/{user_id}")
def update_user_status(
    user_id: int, 
    update_data: dict, 
    context: dict = Depends(get_active_session_context), 
    session: Session = Depends(get_session)
):
    """Updates user status or resets password with hierarchical checks."""
    user_to_update = session.get(User, user_id)
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 1. Permission Logic
    requester_role = context['active_role']
    
    # GLOBAL_ADMIN can update anyone
    if requester_role != UserRole.GLOBAL_ADMIN:
        # ADMIN can only update users in their company
        company_id = context['company'].id
        access = session.exec(select(TenantAccess).where(
            TenantAccess.user_id == user_id, 
            TenantAccess.company_id == company_id
        )).first()
        
        if not access:
            raise HTTPException(status_code=403, detail="Permission Denied: User is not in your organization.")
        
        # COMPANY_ADMIN cannot update higher roles (though in this model all users in company have roles)
        # Prevent COMPANY_ADMIN from modifying GLOBAL_ADMIN or other COMPANY_ADMINs if needed (here we just allow company wide)

    # 2. Apply Updates
    for key, value in update_data.items():
        if hasattr(user_to_update, key):
            # Special case for password hashing during reset
            if key == "password":
                value = get_password_hash(value)
            setattr(user_to_update, key, value)
    
    session.add(user_to_update)
    session.commit()
    session.refresh(user_to_update)
    return user_to_update

@app.post("/requests/", response_model=ProcurementRequest)
def create_request(
    data: RequestCreate, 
    context: dict = Depends(get_active_session_context), 
    session: Session = Depends(get_session)
):
    if not context['company']:
        raise HTTPException(status_code=400, detail="Missing company context for request.")
    
    # Map the schema to the actual model
    new_request = ProcurementRequest(
        title=data.title,
        vendor_name=data.vendor_name,
        vendor_id=data.vendor_id,
        total_amount=data.total_amount,
        company_id=context['company'].id,
        created_by=context['user'].id,
        quotation_url=data.quotation_url,
        items=[LineItem(**item.dict(), request_id=None) for item in data.items]
    )
    
    session.add(new_request)
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        import traceback
        error_msg = traceback.format_exc()
        print(f"CRITICAL ERROR in create_request: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Database commit failed: {str(e)}")
    
    session.refresh(new_request)
    return new_request

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    """Simple file upload to a local folder for PoC"""
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    
    # Clean filename
    safe_name = file.filename.replace(" ", "_")
    file_path = os.path.join(upload_dir, safe_name)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # We return the absolute URL for the frontend to use
    return {"url": f"/uploads/{safe_name}", "filename": safe_name}

# Serve uploads directory
from fastapi.staticfiles import StaticFiles
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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

@app.patch("/requests/{request_id}", response_model=ProcurementRequest)
def update_request(
    request_id: int,
    request_update: dict,
    context: dict = Depends(get_active_session_context),
    session: Session = Depends(get_session)
):
    """Updates procurement request details (e.g. adding quotation after creation)"""
    req = session.exec(select(ProcurementRequest).where(
        ProcurementRequest.id == request_id, 
        ProcurementRequest.company_id == context['company'].id
    )).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Request not found or unauthorized")
    
    # Permission: Creator, Admin, or higher roles can update
    # For now, let's just check if they are in the same company (which context already did)
    
    for key, value in request_update.items():
        if hasattr(req, key):
            setattr(req, key, value)
            
    session.add(req)
    session.commit()
    session.refresh(req)
    
    # Audit log for the update
    log = AuditLog(
        company_id=context['company'].id,
        request_id=request_id,
        action="UPDATE",
        from_status=req.status,
        to_status=req.status,
        user_name=context['user'].name,
        user_role=context['active_role'],
        notes=f"Updated fields: {', '.join(request_update.keys())}"
    )
    session.add(log)
    session.commit()
    
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
    context: dict = Depends(get_active_session_context),
    session: Session = Depends(get_session)
):
    """Provisions a new enterprise tenant and default settings"""
    if context['active_role'] != UserRole.GLOBAL_ADMIN:
        raise HTTPException(status_code=403, detail="Authorized Global Admin clearance required for entity provisioning.")
        
    session.add(company)
    session.commit()
    session.refresh(company)
    
    # Initialize default settings
    settings = CompanySettings(company_id=company.id)
    session.add(settings)
    
    # Map the CREATING user as an ADMIN for the new company by default
    session.add(TenantAccess(user_id=context['user'].id, company_id=company.id, role=UserRole.ADMIN))
    
    session.commit()
    session.refresh(company)
    return company

@app.post("/users/onboard")
def onboard_user(
    data: UserCreate, 
    context: dict = Depends(get_active_session_context),
    session: Session = Depends(get_session)
):
    """
    Adds a new internal identity. 
    GOVERNANCE RULES:
    1. GLOBAL_ADMIN cannot be registered via API (reserved for system owners/Karl).
    2. Only GLOBAL_ADMIN can provision new COMPANY_ADMIN or DIRECTOR roles across any entity.
    3. COMPANY_ADMIN can only onboard REQUESTER, MANAGER, or FINANCE within their own entity.
    """
    requester_role = context['active_role']
    
    # 1. Protect GLOBAL_ADMIN role
    if data.role == UserRole.GLOBAL_ADMIN:
         raise HTTPException(status_code=403, detail="The Global Admin role is immutable and restricted to system owners.")

    # 2. Restrict high-privilege/executive role assignment
    if data.role in [UserRole.ADMIN, UserRole.DIRECTOR]:
        if requester_role != UserRole.GLOBAL_ADMIN:
            raise HTTPException(
                status_code=403, 
                detail=f"Authorization Failure: Only Global Admin can provision {data.role} roles."
            )
    
    # 3. Standard permission check
    if requester_role not in [UserRole.GLOBAL_ADMIN, UserRole.ADMIN]:
         raise HTTPException(status_code=403, detail="Unauthorized for identity provisioning.")

    # 4. Scope Enforcement: Company Admins cannot register users for other companies
    target_company_id = data.company_id if data.company_id else context['company'].id if context['company'] else None
    if requester_role == UserRole.ADMIN and data.company_id and data.company_id != context['company'].id:
         raise HTTPException(
             status_code=403, 
             detail="Authorization Failure: Entity Admins can only onboard users for their own organization."
         )

    # Proceed with creation
    new_user = User(
        name=data.name, 
        email=data.email, 
        password=get_password_hash(data.password),
        is_temporary_password=True,
        approval_status="APPROVED"
    )
    session.add(new_user)
    try:
        session.commit()
    except Exception:
        session.rollback()
        raise HTTPException(status_code=400, detail="Identity creation failed (Identity might already exist).")
        
    session.refresh(new_user)
    
    if target_company_id:
        session.add(TenantAccess(user_id=new_user.id, company_id=target_company_id, role=data.role))
        session.commit()
        
    return {"status": "User Provisioned", "id": new_user.id, "active_entity_id": target_company_id}

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

@app.post("/petty-cash/", response_model=PettyCash)
def create_petty_cash(
    pc: PettyCash, 
    context: dict = Depends(get_active_session_context), 
    session: Session = Depends(get_session)
):
    pc.company_id = context['company'].id
    pc.requester_id = context['user'].id
    session.add(pc)
    session.commit()
    session.refresh(pc)
    return pc

@app.post("/petty-cash/{pc_id}/approve")
def approve_pc(pc_id: int, context: dict = Depends(get_active_session_context), session: Session = Depends(get_session)):
    pc = session.exec(select(PettyCash).where(PettyCash.id == pc_id, PettyCash.company_id == context['company'].id)).first()
    if not pc:
        raise HTTPException(status_code=404, detail="Petty Cash entry not found.")
    if context['active_role'] not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Managerial clearance required.")
    pc.status = PettyCashStatus.APPROVED
    session.add(pc)
    session.commit()
    return {"status": pc.status}

@app.post("/petty-cash/{pc_id}/disburse")
def disburse_pc(pc_id: int, context: dict = Depends(get_active_session_context), session: Session = Depends(get_session)):
    pc = session.exec(select(PettyCash).where(PettyCash.id == pc_id, PettyCash.company_id == context['company'].id)).first()
    if not pc:
        raise HTTPException(status_code=404, detail="Petty Cash entry not found.")
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
    # Use Railway provided PORT or fallback to 8080
    port = int(os.getenv("PORT", 8080))
    logger.info(f"STARTING SERVER ON PORT {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
