from enum import Enum
from typing import List, Optional
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel, create_engine, Session, select

# --- SaaS Enums ---

class StatusEnum(str, Enum):
    DRAFT = "DRAFT"
    PENDING_MANAGER = "PENDING_MANAGER"
    PENDING_DIRECTOR = "PENDING_DIRECTOR"
    APPROVED = "APPROVED"
    PO_ISSUED = "PO_ISSUED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAID = "PAID"

class PettyCashStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DISBURSED = "DISBURSED"

class UserRole(str, Enum):
    REQUESTER = "REQUESTER"
    MANAGER = "MANAGER"
    DIRECTOR = "DIRECTOR"
    FINANCE = "FINANCE"

# --- Multi-Tenant Models ---

class Company(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    domain: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    settings: "CompanySettings" = Relationship(back_populates="company")
    requests: List["ProcurementRequest"] = Relationship(back_populates="company")
    users: List["User"] = Relationship(back_populates="company")
    petty_cash: List["PettyCash"] = Relationship(back_populates="company")

class CompanySettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    approval_threshold: float = Field(default=5000.0)
    currency: str = Field(default="RM")
    retention_period_days: int = Field(default=365)
    
    company: Company = Relationship(back_populates="settings")

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    role: UserRole
    company_id: int = Field(foreign_key="company.id")
    
    company: Company = Relationship(back_populates="users")

# --- Procurement Models ---

class ProcurementRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    title: str
    vendor_name: str
    vendor_id: str
    total_amount: float
    status: StatusEnum = Field(default=StatusEnum.DRAFT)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    company: Company = Relationship(back_populates="requests")
    items: List["LineItem"] = Relationship(back_populates="request")
    files: List["FileMetadata"] = Relationship(back_populates="request")
    audit_logs: List["AuditLog"] = Relationship(back_populates="request")

class LineItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    quantity: int
    unit_price: float
    total_price: float
    request_id: int = Field(foreign_key="procurementrequest.id")
    
    request: Optional[ProcurementRequest] = Relationship(back_populates="items")

class FileMetadata(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    file_type: str  # 'QUOTE', 'RECEIPT', 'PO'
    file_path: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    request_id: int = Field(foreign_key="procurementrequest.id")
    
    request: Optional[ProcurementRequest] = Relationship(back_populates="files")

# --- Petty Cash Models ---

class PettyCash(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    requester_name: str
    amount: float
    receipt_url: Optional[str] = None
    status: PettyCashStatus = Field(default=PettyCashStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    disbursed_at: Optional[datetime] = None
    disbursed_by: Optional[str] = None
    
    company: Company = Relationship(back_populates="petty_cash")

# --- Audit Logs ---

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    request_id: Optional[int] = Field(default=None, foreign_key="procurementrequest.id")
    action: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    user_name: str
    user_role: UserRole
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None
    
    request: Optional[ProcurementRequest] = Relationship(back_populates="audit_logs")

# Database setup
sqlite_url = "sqlite:///./procurement.db"
engine = create_engine(sqlite_url, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
