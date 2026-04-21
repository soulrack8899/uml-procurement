import os
import hashlib
from datetime import datetime
from sqlmodel import Session, select, create_engine, SQLModel
from passlib.context import CryptContext

# --- CONFIGURATION (BETA ONBOARDING DATA) ---
TENANT_NAME = "UMLAB Sarawak"
TENANT_EMAIL = "admin@umlab.com"
TENANT_PETTY_CASH_LIMIT = 5000.0
ADMIN_NAME = "Karlos Albert"
ADMIN_EMAIL = "karlos@umlab.com"
ADMIN_PASSWORD = "changeme123"
USERS = [
    {"name": "Tester One", "email": "tester1@umlab.com", "password": "test1234", "role": "STAFF"},
]

# --- REUSED LOGIC FROM main.py ---
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    # Match the hashing logic from main.py precisely
    pre_hash = hashlib.sha256(password.strip().encode()).hexdigest()
    return pwd_context.hash(pre_hash)

# --- DATABASE SETUP ---
# Ensure we are pointing to the correct files relative to the server folder
BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "server")

import sys
sys.path.append(BASE_DIR)

auth_db_path = os.path.join(BASE_DIR, "auth.db")
procu_db_path = os.path.join(BASE_DIR, "procurement.db")

auth_engine = create_engine(f"sqlite:///{auth_db_path}")
procu_engine = create_engine(f"sqlite:///{procu_db_path}")

# Import models locally to avoid path issues with existing imports in models.py
# (Actually, we can just use the classes if we're sure the schema matches)
from models import User, Company, TenantAccess, UserRole

def provision():
    results = []
    
    with Session(procu_engine) as p_session:
        # 1. Company Provisioning
        company = p_session.exec(select(Company).where(Company.name == TENANT_NAME)).first()
        if not company:
            company = Company(
                name=TENANT_NAME,
                email_address=TENANT_EMAIL,
                petty_cash_limit=TENANT_PETTY_CASH_LIMIT
            )
            p_session.add(company)
            p_session.commit()
            p_session.refresh(company)
            results.append(f"[OK] Company: {TENANT_NAME} (ID: {company.id})")
        else:
            results.append(f"[SKIP] Company: {TENANT_NAME} already exists (ID: {company.id})")

        with Session(auth_engine) as a_session:
            # 2. Admin User Provisioning
            admin = a_session.exec(select(User).where(User.email == ADMIN_EMAIL)).first()
            if not admin:
                admin = User(
                    name=ADMIN_NAME,
                    email=ADMIN_EMAIL,
                    password=get_password_hash(ADMIN_PASSWORD),
                    global_role=UserRole.ADMIN,
                    approval_status="APPROVED",
                    is_temporary_password=False
                )
                a_session.add(admin)
                a_session.commit()
                a_session.refresh(admin)
                
                # Link to company
                link = TenantAccess(user_id=admin.id, company_id=company.id, role=UserRole.ADMIN)
                p_session.add(link)
                p_session.commit()
                results.append(f"[OK] Admin: {ADMIN_NAME} <{ADMIN_EMAIL}> (ID: {admin.id})")
            else:
                results.append(f"[SKIP] Admin: {ADMIN_NAME} already exists (ID: {admin.id})")

            # 3. Staff Users Provisioning
            for u in USERS:
                user_exists = a_session.exec(select(User).where(User.email == u['email'])).first()
                if not user_exists:
                    new_user = User(
                        name=u['name'],
                        email=u['email'],
                        password=get_password_hash(u['password']),
                        global_role=UserRole.REQUESTER, # Using model default for STAFF
                        approval_status="APPROVED",
                        is_temporary_password=False
                    )
                    a_session.add(new_user)
                    a_session.commit()
                    a_session.refresh(new_user)
                    
                    # Link to company
                    role = UserRole.REQUESTER if u['role'] == "STAFF" else UserRole.REQUESTER
                    link = TenantAccess(user_id=new_user.id, company_id=company.id, role=role)
                    p_session.add(link)
                    p_session.commit()
                    results.append(f"[OK] User: {u['name']} <{u['email']}> (ID: {new_user.id})")
                else:
                    results.append(f"[SKIP] User: {u['name']} already exists (ID: {user_exists.id})")

    # Final Output
    print("\n" + "="*50)
    for line in results:
        print(line)
    print("="*50)
    print(f"Done. Tenant {TENANT_NAME} is ready for beta.\n")

if __name__ == "__main__":
    # Add server to path so we can import models
    import sys
    sys.path.append(BASE_DIR)
    provision()
