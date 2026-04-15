import sys
import os
# Add server to path so we can import models
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'server')))

from models import User, Company, TenantAccess, ProcurementRequest, UserRole, auth_engine, procurement_engine
from sqlmodel import Session, select

def seed():
    with Session(auth_engine) as auth_session:
        with Session(procurement_engine) as b_session:
            # 1. Create Users if they don't exist
            users_to_create = [
                {"id": 3, "name": "C1 Manager", "email": "m1@test.com", "role": UserRole.MANAGER},
                {"id": 4, "name": "C1 Requester", "email": "r1@test.com", "role": UserRole.REQUESTER},
                {"id": 5, "name": "C2 Manager", "email": "m2@test.com", "role": UserRole.MANAGER},
                {"id": 6, "name": "C2 Requester", "email": "r2@test.com", "role": UserRole.REQUESTER},
            ]
            
            for u_data in users_to_create:
                existing = auth_session.exec(select(User).where(User.email == u_data["email"])).first()
                if not existing:
                    u = User(id=u_data["id"], name=u_data["name"], email=u_data["email"], global_role=u_data["role"], approval_status="APPROVED", is_temporary_password=False)
                    auth_session.add(u)
            auth_session.commit()

            # 2. Map Users to Tenants
            # User 3,4 to Company 1
            # User 5,6 to Company 2
            mappings = [
                (3, 1, UserRole.MANAGER),
                (4, 1, UserRole.REQUESTER),
                (5, 2, UserRole.MANAGER),
                (6, 2, UserRole.REQUESTER),
            ]
            for u_id, c_id, role in mappings:
                existing = b_session.exec(select(TenantAccess).where(TenantAccess.user_id == u_id, TenantAccess.company_id == c_id)).first()
                if not existing:
                    b_session.add(TenantAccess(user_id=u_id, company_id=c_id, role=role))
            
            # 3. Create a request for Company 2 to probe from Company 1
            existing_req = b_session.exec(select(ProcurementRequest).where(ProcurementRequest.company_id == 2)).first()
            if not existing_req:
                req = ProcurementRequest(
                    company_id=2,
                    title="C2 Secret Hardware",
                    vendor_name="Secret Vendor",
                    vendor_id="V999",
                    total_amount=1000.0,
                    created_by=6
                )
                b_session.add(req)
            
            b_session.commit()
            print("Stress test seeding completed.")

if __name__ == "__main__":
    seed()
