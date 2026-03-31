from sqlmodel import Session, select, create_engine
from models import User, Company, TenantAccess, UserRole

# Define engines exactly like in main.py
auth_engine = create_engine("sqlite:///./auth.db")
procurement_engine = create_engine("sqlite:///./procurement.db")

def verify():
    print("--- AUTH DB CHECK ---")
    with Session(auth_engine) as session:
        users = session.exec(select(User)).all()
        for u in users:
            print(f"User: {u.email} | Role: {u.global_role} | ID: {u.id}")
            
    print("\n--- PROCUREMENT DB CHECK ---")
    with Session(procurement_engine) as session:
        companies = session.exec(select(Company)).all()
        for c in companies:
            print(f"Company: {c.name} | ID: {c.id}")
            
        access = session.exec(select(TenantAccess)).all()
        for a in access:
            print(f"Access: UserID {a.user_id} -> CoID {a.company_id} | Role: {a.role}")

if __name__ == "__main__":
    verify()
