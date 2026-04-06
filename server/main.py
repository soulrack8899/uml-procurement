import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure diagnostic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")
from datetime import datetime
from sqlmodel import Session, select, SQLModel
from models import (
    auth_engine, procurement_engine, create_db_and_tables, 
    ProcurementRequest, LineItem, FileMetadata, AuditLog, StatusEnum, 
    UserRole, Company, CompanySettings, PettyCash, PettyCashStatus, 
    User, TenantAccess, Vendor
)
from services.po_generator import generate_po_pdf
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import timedelta
import hashlib

# Security Contexts
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60 # 30 days for demo

def get_password_hash(password):
    pre_hash = hashlib.sha256(password.strip().encode()).hexdigest()
    return pwd_context.hash(pre_hash)

def verify_password(plain_password, hashed_password):
    if not hashed_password: return False
    clean_pass = plain_password.strip()
    pre_hash = hashlib.sha256(clean_pass.encode()).hexdigest()
    try:
        if pwd_context.verify(pre_hash, hashed_password): return True
    except: pass
    try:
        if pwd_context.verify(clean_pass, hashed_password): return True
    except: pass
    return clean_pass == hashed_password

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def send_approval_email(to_email: str, name: str, password: Optional[str] = None):
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", "noreply@procusure.com")
    frontend_url = os.getenv("FRONTEND_URL", "https://procusure.vercel.app")
    
    subject = "Your ProcuSure Account is Ready!"
    body = f"<p>Hello {name},</p><p>Your account on ProcuSure has been successfully verified.</p>"
    if password:
        body += f"<p>Your temporary password is: <strong>{password}</strong></p><p>Please change your password upon your first login.</p>"
    body += f"<p><a href='{frontend_url}/login'>Click here to Login</a></p>"

    if not smtp_server or not smtp_username:
        logger.info(f"--- MOCK EMAIL DELIVERED TO {to_email} ---")
        logger.info(f"Subject: {subject}")
        logger.info(f"Content: {body}")
        logger.info(f"--- END MOCK EMAIL ---")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_from
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

# --- Schemas ---
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
    comments: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    phone_number: Optional[str] = None
    company_id: int
    password: str

class UserCreate(BaseModel):
    name: str
    email: str
    phone_number: Optional[str] = None
    password: str = "password123"
    company_id: Optional[int] = None
    role: UserRole = UserRole.REQUESTER
    roles: Optional[List[UserRole]] = None


app = FastAPI(title="UMLAB SaaS Master API")

# Middleware
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
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin")
        return JSONResponse(status_code=200, content="OK", headers={
            "Access-Control-Allow-Origin": origin or "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true"
        })
    response = await call_next(request)
    origin = request.headers.get("Origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# --- Session Dependencies ---
def get_auth_session():
    with Session(auth_engine) as session: yield session

def get_business_session():
    with Session(procurement_engine) as session: yield session

@app.on_event("startup")
def on_startup():
    logger.info("INITIATING DUAL-DATABASE BOOTSTRAP...")
    create_db_and_tables()
    
    # Seeding Logic
    from sqlalchemy import text
    with Session(auth_engine) as a_session, Session(procurement_engine) as b_session:
        # 1. Seed Companies in Business DB
        try:
            company_count = len(b_session.exec(select(Company)).all())
            if company_count == 0:
                logger.info("SEEDING INITIAL COMPANIES...")
                umlab = Company(name="UMLAB Sarawak", domain="umlab.sarawak.my")
                merakai = Company(name="Merakai Indah Sdn Bhd", domain="merakai.indah.my")
                b_session.add_all([umlab, merakai])
                b_session.commit()
                b_session.refresh(umlab)
                b_session.refresh(merakai)
                b_session.add(CompanySettings(company_id=umlab.id, approval_threshold=5000.0))
                b_session.add(CompanySettings(company_id=merakai.id, approval_threshold=10000.0))
                
                # Seed Vendors for UMLAB
                b_session.add_all([
                    Vendor(
                        name="Borneo Scientific Supplies", 
                        vendor_type="Lab Equipment", 
                        location="Kuching, Sarawak", 
                        address="Lot 123, Jalan Demak Laut",
                        city="Kuching",
                        state="Sarawak",
                        postal_code="93050",
                        contact="+60 82-442 331", 
                        rating=4.8, 
                        company_id=umlab.id,
                        comments="Main supplier for laboratory glassware."
                    ),
                    Vendor(
                        name="Thermo Fisher Scientific", 
                        vendor_type="Reagent Kits", 
                        location="Kuala Lumpur", 
                        address="No. 1, Jalan Pelukis U1/46, Temasya Industrial Park",
                        city="Shah Alam",
                        state="Selangor",
                        postal_code="40150",
                        contact="+60 3-8948 2000", 
                        rating=4.9, 
                        company_id=umlab.id,
                        comments="Global partner for biological reagents."
                    ),
                    Vendor(
                        name="Shimadzu Asia Pacific", 
                        vendor_type="Spectrometer Systems", 
                        location="Singapore", 
                        address="79 Science Park Dr",
                        city="Singapore",
                        state="Singapore",
                        postal_code="118264",
                        country="Singapore",
                        contact="+65 6778 6280", 
                        rating=4.7, 
                        company_id=umlab.id,
                        comments="High-end analytical instruments."
                    ),
                ])
                b_session.commit()
        except: b_session.rollback()

        # 2. Seed Master Admin in Auth DB
        master_email = (os.getenv("MASTER_ADMIN_EMAIL") or "pomodorotechco@gmail.com").lower().strip()
        master_pass = os.getenv("MASTER_ADMIN_PASSWORD") or "pomodorotechco123"
        master = a_session.exec(select(User).where(User.email == master_email)).first()
        if not master:
            master = User(name="Global Admin", email=master_email, password=get_password_hash(master_pass), global_role=UserRole.GLOBAL_ADMIN, approval_status="APPROVED", is_temporary_password=False)
            a_session.add(master)
        else:
            master.password = get_password_hash(master_pass)
            master.global_role = UserRole.GLOBAL_ADMIN
            a_session.add(master)
        a_session.commit()

        # 3. Seed UMLAB Company Admin
        umlab = b_session.exec(select(Company).where(Company.name == "UMLAB Sarawak")).first()
        if umlab:
             u_email = "umlabsarawak@yahoo.com"
             u_admin = a_session.exec(select(User).where(User.email == u_email)).first()
             if not u_admin:
                  u_admin = User(name="UMLAB Admin", email=u_email, password=get_password_hash("password123"), global_role=UserRole.REQUESTER, approval_status="APPROVED", is_temporary_password=False)
                  a_session.add(u_admin)
                  a_session.commit()
                  a_session.refresh(u_admin)
             
             # Bridge link in Business DB
             access = b_session.exec(select(TenantAccess).where(TenantAccess.user_id == u_admin.id, TenantAccess.company_id == umlab.id)).first()
             if not access:
                  b_session.add(TenantAccess(user_id=u_admin.id, company_id=umlab.id, role=UserRole.ADMIN))
             else:
                  access.role = UserRole.ADMIN
                  b_session.add(access)
             b_session.commit()

ROLE_PRIORITY = {
    UserRole.GLOBAL_ADMIN: 100,
    UserRole.ADMIN: 50,
    UserRole.DIRECTOR: 40,
    UserRole.FINANCE: 30,
    UserRole.MANAGER: 20,
    UserRole.REQUESTER: 10,
}

# --- Auth Dependency ---
def get_active_session_context(
    request: Request,
    x_company_id: Optional[int] = Header(None), 
    auth_session: Session = Depends(get_auth_session),
    b_session: Session = Depends(get_business_session)
):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
         raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except: raise HTTPException(status_code=401, detail="Invalid token")

    user = auth_session.get(User, user_id)
    if not user: raise HTTPException(status_code=403, detail="User not found")

    company = b_session.get(Company, x_company_id) if x_company_id else None
    
    if user.global_role == UserRole.GLOBAL_ADMIN:
        return {"company": company, "user": user, "active_role": UserRole.GLOBAL_ADMIN, "active_roles": [UserRole.GLOBAL_ADMIN]}

    if not company: raise HTTPException(status_code=404, detail="Entity not found")
    
    access_list = b_session.exec(select(TenantAccess).where(TenantAccess.company_id == x_company_id, TenantAccess.user_id == user.id)).all()
    if not access_list: raise HTTPException(status_code=403, detail="No access to this entity")
    
    roles = [a.role for a in access_list]
    # Pick highest role as 'active_role' for single-role logic
    primary_role = max(roles, key=lambda r: ROLE_PRIORITY.get(r, 0))
    
    return {"company": company, "user": user, "active_role": primary_role, "active_roles": roles}


# --- Endpoints ---

@app.get("/")
def read_root(): return {"status": "ok", "service": "ProcuSure Multi-DB API"}

@app.post("/session/register")
def register_user(data: RegisterRequest, auth_session: Session = Depends(get_auth_session), b_session: Session = Depends(get_business_session)):
    email_clean = data.email.lower().strip()
    existing_user = auth_session.exec(select(User).where(User.email == email_clean)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already registered")
        
    new_user = User(
        name=data.name, 
        email=email_clean, 
        phone_number=data.phone_number,
        password=get_password_hash(data.password), 
        approval_status="PENDING", 
        is_temporary_password=False
    )
    auth_session.add(new_user)
    auth_session.commit()
    auth_session.refresh(new_user)
    
    b_session.add(TenantAccess(user_id=new_user.id, company_id=data.company_id, role=UserRole.REQUESTER))
    b_session.commit()
    
    return {"status": "SUCCESS", "user_id": new_user.id}

@app.post("/session/login")
def login(request: LoginRequest, auth_session: Session = Depends(get_auth_session), b_session: Session = Depends(get_business_session)):
    email_clean = request.email.lower().strip()
    user = auth_session.exec(select(User).where(User.email == email_clean)).first()
    
    if not user: raise HTTPException(status_code=401, detail="Account not found")
    if not verify_password(request.password, user.password): raise HTTPException(status_code=401, detail="Invalid credentials")
    
    primary_access = b_session.exec(select(TenantAccess).where(TenantAccess.user_id == user.id)).first()
    token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "user_id": user.id, 
        "user_name": user.name,
        "is_temporary_password": user.is_temporary_password,
        "active_company_id": primary_access.company_id if primary_access else None,
        "role": user.global_role
    }

class PasswordChangeRequest(BaseModel):
    new_password: str

@app.post("/session/change-password")
def change_password(data: PasswordChangeRequest, context: dict = Depends(get_active_session_context), auth_session: Session = Depends(get_auth_session)):
    user = context['user']
    user.password = get_password_hash(data.new_password)
    user.is_temporary_password = False
    auth_session.add(user)
    auth_session.commit()
    return {"status": "SUCCESS"}

@app.get("/session/whoami")
def whoami(context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    settings = b_session.exec(select(CompanySettings).where(CompanySettings.company_id == context['company'].id)).first() if context['company'] else None
    threshold = settings.approval_threshold if settings else 5000.0
    return {
        "user_id": context['user'].id, "user_name": context['user'].name,
        "company_id": context['company'].id if context['company'] else None,
        "company_name": context['company'].name if context['company'] else "Global Context",
        "active_role": context['active_role'], "global_role": context['user'].global_role,
        "policy": {"threshold": threshold, "currency": "RM"}
    }

@app.get("/requests/", response_model=List[ProcurementRequest])
def list_requests(context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    if context['active_role'] == UserRole.GLOBAL_ADMIN:
        return b_session.exec(select(ProcurementRequest)).all()
    return b_session.exec(select(ProcurementRequest).where(ProcurementRequest.company_id == context['company'].id)).all()

@app.post("/requests/", response_model=ProcurementRequest)
def create_request(data: RequestCreate, context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    new_req = ProcurementRequest(**data.dict(exclude={'items'}), company_id=context['company'].id, created_by=context['user'].id, status=StatusEnum.SUBMITTED)
    new_req.items = [LineItem(**item.dict()) for item in data.items]
    b_session.add(new_req)
    b_session.commit()
    b_session.refresh(new_req)
    
    # Audit log
    b_session.add(AuditLog(
        company_id=context['company'].id,
        request_id=new_req.id,
        action="Request Created & Submitted",
        to_status=StatusEnum.SUBMITTED,
        user_name=context['user'].name,
        user_role=context['active_role']
    ))
    b_session.commit()
    return new_req

@app.get("/requests/{request_id}", response_model=ProcurementRequest)
def get_request(request_id: int, context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    req = b_session.get(ProcurementRequest, request_id)
    if not req: raise HTTPException(status_code=404)
    if context['active_role'] != UserRole.GLOBAL_ADMIN and req.company_id != context['company'].id:
        raise HTTPException(status_code=403)
    return req

@app.get("/requests/{request_id}/audit", response_model=List[AuditLog])
def get_audit_logs(request_id: int, context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    return b_session.exec(select(AuditLog).where(AuditLog.request_id == request_id)).all()

@app.post("/requests/{request_id}/transition")
def transition_request(request_id: int, context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    req = b_session.get(ProcurementRequest, request_id)
    if not req: raise HTTPException(status_code=404)
    
    old_status = req.status
    settings = b_session.exec(select(CompanySettings).where(CompanySettings.company_id == req.company_id)).first()
    threshold = settings.approval_threshold if settings else 5000.0
    
    # Workflow Transitions
    if req.status == StatusEnum.SUBMITTED:
        if req.total_amount > threshold:
            req.status = StatusEnum.PENDING_DIRECTOR
        else:
            req.status = StatusEnum.PENDING_MANAGER
    
    elif req.status == StatusEnum.PENDING_MANAGER:
        # Assuming manager approved
        if req.total_amount > threshold:
            req.status = StatusEnum.PENDING_DIRECTOR
        else:
            req.status = StatusEnum.APPROVED
            
    elif req.status == StatusEnum.PENDING_DIRECTOR:
        req.status = StatusEnum.APPROVED
        
    elif req.status == StatusEnum.APPROVED:
        req.status = StatusEnum.PO_ISSUED
        
    elif req.status == StatusEnum.PO_ISSUED:
        req.status = StatusEnum.PAYMENT_PENDING
        
    elif req.status == StatusEnum.PAYMENT_PENDING:
        req.status = StatusEnum.PAID

    b_session.add(req)
    # Log the transition
    b_session.add(AuditLog(
        company_id=req.company_id,
        request_id=req.id,
        action="Transition Workflow",
        from_status=old_status,
        to_status=req.status,
        user_name=context['user'].name,
        user_role=context['active_role']
    ))
    b_session.commit()
    return {"status": "ok", "new_status": req.status}

@app.get("/requests/{request_id}/generate-po")
def get_po_report(request_id: int, context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    req = b_session.get(ProcurementRequest, request_id)
    if not req: raise HTTPException(status_code=404)
    
    # Export to dict for po_generator
    req_dict = {
        "id": req.id,
        "vendor_name": req.vendor_name,
        "vendor_id": req.vendor_id,
        "total_amount": req.total_amount,
        "items": [{"description": i.description, "quantity": i.quantity, "unit_price": i.unit_price, "total_price": i.total_price} for i in req.items]
    }
    
    out_dir = "uploads/pos"
    if not os.path.exists(out_dir): os.makedirs(out_dir)
    file_path = os.path.join(out_dir, f"PO_{request_id}.pdf")
    generate_po_pdf(req_dict, file_path)
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path, filename=f"PO_{request_id}.pdf")

@app.get("/companies/", response_model=List[Company])
def list_companies(b_session: Session = Depends(get_business_session)):
    # Simpler version for now to unblock frontend: return all companies
    # The frontend uses this to populate the tenant switcher
    return b_session.exec(select(Company)).all()

@app.post("/companies/onboard")
def onboard_company(company: Company, context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session), auth_session: Session = Depends(get_auth_session)):
    if context['active_role'] != UserRole.GLOBAL_ADMIN: raise HTTPException(status_code=403)
    
    # Save Company
    b_session.add(company)
    b_session.commit()
    b_session.refresh(company)
    
    # 1. Provision Primary Admin User in Auth DB
    admin_email = (company.email_address or "contact@example.com").lower().strip()
    existing_user = auth_session.exec(select(User).where(User.email == admin_email)).first()
    
    if not existing_user:
        new_admin = User(
            name=company.contact_person or "Primary Admin",
            email=admin_email,
            password=get_password_hash("password123"), # Default password for security
            approval_status="APPROVED",
            is_temporary_password=True
        )
        auth_session.add(new_admin)
        auth_session.commit()
        auth_session.refresh(new_admin)
        admin_id = new_admin.id
    else:
        admin_id = existing_user.id
        
    # 2. Grant Access (Link User to Company as ADMIN)
    b_session.add(TenantAccess(user_id=admin_id, company_id=company.id, role=UserRole.ADMIN))
    
    # 3. Grant Master Admin Visibility 
    b_session.add(TenantAccess(user_id=context['user'].id, company_id=company.id, role=UserRole.ADMIN))
    
    # 4. Initialize Settings
    b_session.add(CompanySettings(company_id=company.id))
    b_session.commit()
    
    return {
        "id": company.id,
        "name": company.name,
        "primary_admin": admin_email
    }

@app.get("/companies/{company_id}/settings", response_model=CompanySettings)
def get_company_settings(company_id: int, context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    # Simple check: context['company'].id should match company_id or user is GLOBAL_ADMIN
    if context['active_role'] != UserRole.GLOBAL_ADMIN and context['company'].id != company_id:
        raise HTTPException(status_code=403, detail="Access denied to this company settings")
    
    settings = b_session.exec(select(CompanySettings).where(CompanySettings.company_id == company_id)).first()
    if not settings:
        # Auto-initialize if missing
        settings = CompanySettings(company_id=company_id)
        b_session.add(settings)
        b_session.commit()
        b_session.refresh(settings)
    return settings

@app.get("/companies/", response_model=List[Company])
def list_companies(context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    """Fetch all companies for Global Admins, or just the current company for others."""
    if context['active_role'] == UserRole.GLOBAL_ADMIN:
        return b_session.exec(select(Company)).all()
    
    # Non-global admins only see their associated company
    if context['company']:
        return [context['company']]
    
    return []

@app.patch("/companies/{company_id}/settings")
def update_company_settings(company_id: int, threshold: float, context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    if context['active_role'] not in [UserRole.GLOBAL_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    if context['active_role'] != UserRole.GLOBAL_ADMIN and context['company'].id != company_id:
        raise HTTPException(status_code=403, detail="Access denied to this company settings")

    settings = b_session.exec(select(CompanySettings).where(CompanySettings.company_id == company_id)).first()
    if not settings:
        settings = CompanySettings(company_id=company_id)
    
    settings.approval_threshold = threshold
    b_session.add(settings)
    b_session.commit()
    return {"status": "SUCCESS"}

@app.get("/users/", response_model=List[dict])
def list_users(context: dict = Depends(get_active_session_context), auth_session: Session = Depends(get_auth_session), b_session: Session = Depends(get_business_session)):
    if context['active_role'] not in [UserRole.GLOBAL_ADMIN, UserRole.ADMIN]: raise HTTPException(status_code=403)
    
    # Check if user is Global Admin by checking the string value of their active role
    is_global_admin = str(context['active_role']) == str(UserRole.GLOBAL_ADMIN.value) or context['active_role'] == UserRole.GLOBAL_ADMIN
    
    if is_global_admin:
        users = auth_session.exec(select(User)).all()
    else:
        # Get only users in THIS company
        cid = context['company'].id if context['company'] else None
        if not cid:
             return [] # Non-admins see nothing if no company context
        company_access = b_session.exec(select(TenantAccess).where(TenantAccess.company_id == cid)).all()
        target_user_ids = [a.user_id for a in company_access]
        users = auth_session.exec(select(User).where(User.id.in_(target_user_ids))).all()

    result = []
    for u in users:
        tenants = b_session.exec(select(TenantAccess).where(TenantAccess.user_id == u.id)).all()
        
        # Determine local and global roles
        role_label = "No Access"
        if context['company']:
            local_roles = [t.role for t in tenants if t.company_id == context['company'].id]
            if local_roles:
                role_label = ", ".join([r.value if hasattr(r, 'value') else str(r) for r in local_roles])
            elif str(u.global_role) == str(UserRole.GLOBAL_ADMIN.value) or u.global_role == UserRole.GLOBAL_ADMIN:
                role_label = "GLOBAL ADMIN"
        elif str(u.global_role) == str(UserRole.GLOBAL_ADMIN.value) or u.global_role == UserRole.GLOBAL_ADMIN:
            role_label = "GLOBAL ADMIN"
        else:
            # Global Context view
            role_label = u.global_role.value if hasattr(u.global_role, 'value') else str(u.global_role)

        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "global_role": role_label,
            "roles": [r.value if hasattr(r, 'value') else str(r) for r in [t.role for t in tenants if (context['company'] and t.company_id == context['company'].id) or not context['company']]],
            "approval_status": u.approval_status,
            "is_temporary_password": u.is_temporary_password,
            "companies": len(set([t.company_id for t in tenants]))
        })
    return result


@app.patch("/users/{user_id}")
def update_user_account(user_id: int, data: dict, context: dict = Depends(get_active_session_context), auth_session: Session = Depends(get_auth_session), b_session: Session = Depends(get_business_session)):
    if context['active_role'] not in [UserRole.GLOBAL_ADMIN, UserRole.ADMIN]: raise HTTPException(status_code=403)
    
    user = auth_session.get(User, user_id)
    if not user: raise HTTPException(status_code=404)
    
    # Permission Guard for Company Admin
    if context['active_role'] == UserRole.ADMIN:
        # Check if target is in the same company
        access = b_session.exec(select(TenantAccess).where(TenantAccess.user_id == user_id, TenantAccess.company_id == context['company'].id)).first()
        if not access: raise HTTPException(status_code=403, detail="User not part of your organization")
        # Cannot modify Global Admins
        if user.global_role == UserRole.GLOBAL_ADMIN: raise HTTPException(status_code=403, detail="Insufficient permission")

    
    was_pending = user.approval_status != "APPROVED"
    
    if "approval_status" in data: user.approval_status = data["approval_status"]
    if "is_temporary_password" in data: user.is_temporary_password = data["is_temporary_password"]
    if "password" in data:
        user.password = get_password_hash(data["password"])
        user.is_temporary_password = True
    
    # Handle Role Updates (supports single 'role' or list 'roles')
    new_roles = data.get("roles") or ([data.get("role")] if data.get("role") else [])
    if new_roles:
        if context['company']:
            # Cleanup existing entries for this user in this company
            stmt = select(TenantAccess).where(TenantAccess.user_id == user_id, TenantAccess.company_id == context['company'].id)
            existing = b_session.exec(stmt).all()
            for ex in existing: b_session.delete(ex)
            b_session.commit()
            
            # Add new role(s)
            for r in new_roles:
                b_session.add(TenantAccess(user_id=user_id, company_id=context['company'].id, role=r))
            b_session.commit()

        # Update global_role to highest assigned role
        highest = max(new_roles, key=lambda r: ROLE_PRIORITY.get(r, 0))
        if user.global_role != UserRole.GLOBAL_ADMIN:
             user.global_role = highest


    
    auth_session.add(user)
    auth_session.commit()
    
    if was_pending and user.approval_status == "APPROVED":
        send_approval_email(user.email, user.name)
        
    return {"status": "ok"}

@app.post("/users/onboard")
def onboard_user(data: UserCreate, context: dict = Depends(get_active_session_context), auth_session: Session = Depends(get_auth_session), b_session: Session = Depends(get_business_session)):
    if context['active_role'] not in [UserRole.GLOBAL_ADMIN, UserRole.ADMIN]: raise HTTPException(status_code=403)
    
    email_clean = data.email.lower().strip()
    user = auth_session.exec(select(User).where(User.email == email_clean)).first()
    if not user:
        user = User(name=data.name, email=email_clean, password=get_password_hash(data.password), approval_status="APPROVED", is_temporary_password=True, phone_number=data.phone_number)
        auth_session.add(user)
        auth_session.commit()
    else:
        # Update existing user
        user.password = get_password_hash(data.password)
        user.is_temporary_password = True
        user.name = data.name
        user.approval_status = "APPROVED"
        auth_session.add(user)
        auth_session.commit()
    
    auth_session.refresh(user)
    send_approval_email(user.email, user.name, password=data.password)
    
    target_co = data.company_id or (context['company'].id if context['company'] else None)
    if target_co:
        # Determine roles (list vs single fallback)
        roles_to_assign = data.roles if data.roles else [data.role]
        
        # Cleanup existing roles first
        stmt = select(TenantAccess).where(TenantAccess.user_id == user.id, TenantAccess.company_id == target_co)
        existing = b_session.exec(stmt).all()
        for ex in existing: b_session.delete(ex)
        b_session.commit()
        
        for r in roles_to_assign:
            b_session.add(TenantAccess(user_id=user.id, company_id=target_co, role=r))
        
        b_session.commit()

        # Update global_role to highest assigned role
        highest_role = max(roles_to_assign, key=lambda r: ROLE_PRIORITY.get(r, 0))
        if user.global_role != UserRole.GLOBAL_ADMIN:
            user.global_role = highest_role
            auth_session.add(user)
            auth_session.commit()
    
    return {"status": "SUCCESS", "user_id": user.id}




@app.get("/petty-cash/", response_model=List[PettyCash])
def list_petty_cash(context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    return b_session.exec(select(PettyCash).where(PettyCash.company_id == context['company'].id)).all()

@app.post("/petty-cash/", response_model=PettyCash)
def create_petty_cash(pc: PettyCash, context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    pc.company_id = context['company'].id
    pc.requester_id = context['user'].id
    b_session.add(pc)
    b_session.commit()
    b_session.refresh(pc)
    return pc

@app.get("/vendors/", response_model=List[Vendor])
def list_vendors(context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    return b_session.exec(select(Vendor).where(Vendor.company_id == context['company'].id)).all()

@app.post("/vendors/", response_model=Vendor)
def create_vendor(v: Vendor, context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    v.company_id = context['company'].id
    b_session.add(v)
    b_session.commit()
    b_session.refresh(v)
    
    # Audit log
    b_session.add(AuditLog(
        company_id=context['company'].id,
        action=f"New Vendor Registered: {v.name}",
        user_name=context['user'].name,
        user_role=context['active_role']
    ))
    b_session.commit()
    return v

# --- Dashboard & Intelligence Endpoints ---

@app.get("/dashboard/stats")
def get_dashboard_stats(context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    """Aggregated statistics for the dashboard dashboard widgets."""
    cid = context['company'].id if context['company'] else None
    if not cid and context['active_role'] != UserRole.GLOBAL_ADMIN:
        return {"pending": 0, "completed": 0, "total_spend": 0, "vendors": 0, "claims": 0}

    # Base Queries
    req_query = select(ProcurementRequest)
    pc_query = select(PettyCash)
    v_query = select(Vendor)

    if cid:
        req_query = req_query.where(ProcurementRequest.company_id == cid)
        pc_query = pc_query.where(PettyCash.company_id == cid)
        v_query = v_query.where(Vendor.company_id == cid)

    requests = b_session.exec(req_query).all()
    claims = b_session.exec(pc_query).all()
    vendors = b_session.exec(v_query).all()

    # Calculations
    pending = len([r for r in requests if "PENDING" in r.status.value])
    completed = len([r for r in requests if r.status in [StatusEnum.APPROVED, StatusEnum.PO_ISSUED, StatusEnum.PAID]])
    total_spend = sum([r.total_amount for r in requests if r.status in [StatusEnum.APPROVED, StatusEnum.PO_ISSUED, StatusEnum.PAID]])
    
    return {
        "pending": pending,
        "completed": completed,
        "total_spend": total_spend,
        "vendors": len(vendors),
        "claims": len(claims),
        "threshold": 5000.0 # Standard threshold for display
    }

@app.get("/audit/recent", response_model=List[AuditLog])
def get_recent_audit_logs(limit: int = 20, context: dict = Depends(get_active_session_context), b_session: Session = Depends(get_business_session)):
    """Fetch the latest audit logs for the activity feed."""
    query = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
    if context['active_role'] != UserRole.GLOBAL_ADMIN:
        query = query.where(AuditLog.company_id == context['company'].id)
    
    return b_session.exec(query).all()

# --- Static File Serving ---
from fastapi.staticfiles import StaticFiles
if not os.path.exists("uploads"): os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    safe_name = file.filename.replace(" ", "_")
    path = os.path.join("uploads", safe_name)
    with open(path, "wb") as b: b.write(await file.read())
    return {"url": f"/uploads/{safe_name}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
