from sqlmodel import Session, create_engine, select
from server.models import ProcurementRequest, LineItem, Company, User, UserRole, AuditLog, StatusEnum
from datetime import datetime

# Database setup
DATABASE_URL = "sqlite:///server/procurement.db"
engine = create_engine(DATABASE_URL)

def inject():
    with Session(engine) as session:
        # 1. Get or Create Company
        company = session.exec(select(Company)).first()
        if not company:
            company = Company(name="Test Corp", address="123 Street", city="Kuching", state="Sarawak", postal_code="93050")
            session.add(company)
            session.commit()
            session.refresh(company)
        
        # 2. Get or Create User (Admin)
        user = session.exec(select(User).where(User.email == "pomodorotechco@gmail.com")).first()
        if not user:
            user = User(email="pomodorotechco@gmail.com", name="Admin User", global_role=UserRole.GLOBAL_ADMIN, password="hashed_password")
            session.add(user)
            session.commit()
            session.refresh(user)

        # 3. Create Procurement Request
        req = ProcurementRequest(
            title="Smoke Test PO",
            company_id=company.id,
            vendor_name="Borneo Scientific",
            vendor_id="V-001",
            total_amount=1250.00,
            status=StatusEnum.APPROVED,
            created_by=user.id,
            comments="This is a test PO for PDF generation smoke test."
        )
        session.add(req)
        session.commit()
        session.refresh(req)

        # 4. Add Line Items
        item1 = LineItem(request_id=req.id, description="Laboratory Beaker 500ml", quantity=10, unit_price=25.00, total_price=250.00)
        item2 = LineItem(request_id=req.id, description="Mass Spectrometer Service Kit", quantity=1, unit_price=1000.00, total_price=1000.00)
        session.add(item1)
        session.add(item2)
        
        # 5. Add Audit Log for Approval
        audit = AuditLog(
            company_id=company.id,
            request_id=req.id,
            timestamp=datetime.now(),
            user_id=user.id,
            user_name=user.name,
            user_role="GLOBAL_ADMIN",
            from_status=StatusEnum.SUBMITTED,
            to_status=StatusEnum.APPROVED,
            action="Approved request for PDF generation test."
        )
        session.add(audit)
        
        session.commit()
        print(f"Successfully injected Request ID: {req.id}")
        return req.id

if __name__ == "__main__":
    inject()
