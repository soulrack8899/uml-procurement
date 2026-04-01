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
    User, TenantAccess
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
            umlab = b_session.exec(select(Company).where(Company.name == "UMLAB Sarawak")).first()
            if not umlab:
                umlab = Company(name="UMLAB Sarawak", domain="umlab.sarawak.my")
                merakai = Company(name="Merakai Indah Sdn Bhd", domain="merakai.indah.my")
                b_session.add_all([umlab, merakai])
                b_session.commit()
                b_session.refresh(umlab)
                b_session.refresh(merakai)
                b_session.add(CompanySettings(company_id=umlab.id, approval_threshold=5000.0))
                b_session.add(CompanySettings(company_id=merakai.id, approval_threshold=10000.0))
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
        return {"company": company, "user": user, "active_role": UserRole.GLOBAL_ADMIN}

    if not company: raise HTTPException(status_code=404, detail="Entity not found")
    access = b_session.exec(select(TenantAccess).where(TenantAccess.company_id == x_company_id, TenantAccess.user_id == user.id)).first()
    if not access: raise HTTPException(status_code=403, detail="No access to this entity")
    
    return {"company": company, "user": user, "active_role": access.role}

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
        "active_company_id": primary_access.company_id if primary_access else None,
        "role": user.global_role
    }

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
    new_req = ProcurementRequest(**data.dict(exclude={'items'}), company_id=context['company'].id, created_by=context['user'].id)
    new_req.items = [LineItem(**item.dict()) for item in data.items]
    b_session.add(new_req)
    b_session.commit()
    b_session.refresh(new_req)
    return new_req

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

@app.get("/users/", response_model=List[dict])
def list_users(context: dict = Depends(get_active_session_context), auth_session: Session = Depends(get_auth_session), b_session: Session = Depends(get_business_session)):
    if context['active_role'] != UserRole.GLOBAL_ADMIN: raise HTTPException(status_code=403)
    users = auth_session.exec(select(User)).all()
    # Map users for the management view
    result = []
    for u in users:
        tenants = b_session.exec(select(TenantAccess).where(TenantAccess.user_id == u.id)).all()
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "global_role": str(u.global_role.value if hasattr(u.global_role, 'value') else u.global_role),
            "approval_status": u.approval_status,
            "is_temporary_password": u.is_temporary_password,
            "companies": len(tenants)
        })
    return result

@app.patch("/users/{user_id}")
def update_user_account(user_id: int, data: dict, context: dict = Depends(get_active_session_context), auth_session: Session = Depends(get_auth_session)):
    if context['active_role'] != UserRole.GLOBAL_ADMIN: raise HTTPException(status_code=403)
    user = auth_session.get(User, user_id)
    if not user: raise HTTPException(status_code=404)
    
    was_pending = user.approval_status != "APPROVED"
    
    if "approval_status" in data: user.approval_status = data["approval_status"]
    if "is_temporary_password" in data: user.is_temporary_password = data["is_temporary_password"]
    
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
        auth_session.refresh(user)
        send_approval_email(user.email, user.name, password=data.password)
    
    target_co = data.company_id or (context['company'].id if context['company'] else None)
    if target_co:
        b_session.add(TenantAccess(user_id=user.id, company_id=target_co, role=data.role))
        b_session.commit()
    
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
