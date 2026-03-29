from enum import Enum
from typing import List, Optional
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel, create_engine, Session, select

# --- SaaS Enums ---

class StatusEnum(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PENDING_MANAGER = "PENDING_MANAGER"
    PENDING_DIRECTOR = "PENDING_DIRECTOR"
    APPROVED = "APPROVED"
    PO_ISSUED = "PO_ISSUED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAID = "PAID"

class PettyCashStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    DISBURSED = "DISBURSED"

class UserRole(str, Enum):
    REQUESTER = "REQUESTER"
    MANAGER = "MANAGER"
    DIRECTOR = "DIRECTOR"
    FINANCE = "FINANCE"
    ADMIN = "ADMIN"
    GLOBAL_ADMIN = "GLOBAL_ADMIN"

# --- Multi-Tenant Mapping (Tenant-Specific Roles) ---

class TenantAccess(SQLModel, table=True):
    """Bridge table for User-to-Tenant access control with entity-specific roles"""
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    company_id: int = Field(foreign_key="company.id", primary_key=True)
    role: UserRole = Field(default=UserRole.REQUESTER)

# --- Multi-Tenant Models ---

class Company(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    domain: str
    logo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    settings: "CompanySettings" = Relationship(back_populates="company")
    requests: List["ProcurementRequest"] = Relationship(back_populates="company")
    petty_cash: List["PettyCash"] = Relationship(back_populates="company")
    users: List["User"] = Relationship(back_populates="companies", link_model=TenantAccess)

class CompanySettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    approval_threshold: float = Field(default=5000.0)
    currency: str = Field(default="RM")
    
    company: Company = Relationship(back_populates="settings")

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password: str = Field(default="password123") # Plain text for demo simplicity, in production use bcrypt
    # Global role (e.g. for super admin access)
    global_role: UserRole = Field(default=UserRole.REQUESTER)
    
    companies: List[Company] = Relationship(back_populates="users", link_model=TenantAccess)

# --- Procurement Models ---

class ProcurementRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    title: str
    vendor_name: str
    vendor_id: str
    total_amount: float
    status: StatusEnum = Field(default=StatusEnum.DRAFT)
    quotation_url: Optional[str] = None
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    company: Company = Relationship(back_populates="requests")
    items: List["LineItem"] = Relationship(back_populates="request", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    files: List["FileMetadata"] = Relationship(back_populates="request", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    audit_logs: List["AuditLog"] = Relationship(back_populates="request", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class LineItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    quantity: int
    uom: str = Field(default="PCS")
    unit_price: float
    total_price: float
    request_id: Optional[int] = Field(default=None, foreign_key="procurementrequest.id")
    
    request: Optional[ProcurementRequest] = Relationship(back_populates="items")

class FileMetadata(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    file_type: str
    file_path: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    request_id: int = Field(foreign_key="procurementrequest.id")
    
    request: Optional[ProcurementRequest] = Relationship(back_populates="files")

# --- Petty Cash Models ---

class PettyCash(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    requester_id: int = Field(foreign_key="user.id")
    description: str = Field(default="Petty Cash Claim")
    amount: float
    receipt_url: Optional[str] = None
    status: PettyCashStatus = Field(default=PettyCashStatus.SUBMITTED)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    disbursed_at: Optional[datetime] = None
    disbursed_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
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
