from enum import Enum
from typing import List, Optional
from datetime import datetime
import os
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

# --- 1. AUTH DOMAIN (Stored in auth.db / Auth Schema) ---

class User(SQLModel, table=True):
    """Core Identity Model - Stored in the Auth Vault"""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    phone_number: Optional[str] = None
    password: str = Field(default="password123")
    global_role: UserRole = Field(default=UserRole.REQUESTER)
    approval_status: str = Field(default="PENDING")
    is_temporary_password: bool = Field(default=True)
    
    # Relationship to TenantAccess (Procurement DB) - Handled as cross-DB relationship
    # companies: List["Company"] = Relationship(back_populates="users", link_model="TenantAccess")

# --- 2. PROCUREMENT DOMAIN (Stored in procurement.db / Procurement Schema) ---

class TenantAccess(SQLModel, table=True):
    """Bridge table for User-to-Tenant access. Stored in Procurement DB.
    Loose link to User (Auth DB) via user_id integer.
    """
    user_id: int = Field(primary_key=True) # Loose link to Auth DB
    company_id: int = Field(foreign_key="company.id", primary_key=True)
    role: UserRole = Field(default=UserRole.REQUESTER, primary_key=True)


class Company(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    domain: Optional[str] = None
    contact_person: Optional[str] = None
    contact_no: Optional[str] = None
    email_address: Optional[str] = None
    co_reg_no: Optional[str] = None
    trading_license: Optional[str] = None
    business_objectives: Optional[str] = None 
    logo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    settings: "CompanySettings" = Relationship(back_populates="company")
    requests: List["ProcurementRequest"] = Relationship(back_populates="company")
    petty_cash: List["PettyCash"] = Relationship(back_populates="company")
    vendors: List["Vendor"] = Relationship(back_populates="company")

class CompanySettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    approval_threshold: float = Field(default=5000.0)
    currency: str = Field(default="RM")
    
    company: Company = Relationship(back_populates="settings")

class ProcurementRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    title: str
    vendor_name: str
    vendor_id: str
    total_amount: float
    status: StatusEnum = Field(default=StatusEnum.DRAFT)
    quotation_url: Optional[str] = None
    comments: Optional[str] = None
    created_by: Optional[int] = Field(default=None) # Loose link to Auth DB
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

class PettyCash(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    requester_id: int # Loose link to Auth DB
    amount: float
    description: str = Field(default="Petty Cash Claim")
    receipt_url: Optional[str] = None
    status: PettyCashStatus = Field(default=PettyCashStatus.SUBMITTED)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    disbursed_at: Optional[datetime] = None
    disbursed_by_id: Optional[int] = Field(default=None) # Loose link to Auth DB
    
    company: Company = Relationship(back_populates="petty_cash")

class Vendor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    name: str
    vendor_type: str
    location: Optional[str] = None # Keeping for legacy/compatibility if needed, but primary is detailed address
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = Field(default="Malaysia")
    contact: Optional[str] = None
    rating: float = Field(default=5.0)
    comments: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    company: Company = Relationship(back_populates="vendors")

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

# --- DATABASE CONFIGURATION ---

# Detect PostgreSQL Connection String (Railway Production)
DB_URL = os.getenv("DATABASE_URL")
AUTH_DB_URL = os.getenv("AUTH_DATABASE_URL") or DB_URL

# Helper to fix 'postgres://' vs 'postgresql://' for SQLAlchemy
def fix_postgres_url(url: str):
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url

# ENGINE DEFINITIONS
if DB_URL:
    # PRODUCTION: PostgreSQL
    auth_engine = create_engine(fix_postgres_url(AUTH_DB_URL), pool_pre_ping=True)
    procurement_engine = create_engine(fix_postgres_url(DB_URL), pool_pre_ping=True)
else:
    # LOCAL: Separate SQLite Files
    auth_engine = create_engine("sqlite:///./auth.db", connect_args={"check_same_thread": False})
    procurement_engine = create_engine("sqlite:///./procurement.db", connect_args={"check_same_thread": False})

def create_db_and_tables():
    # 1. Create Identity Tables in Auth DB (Use User's metadata)
    User.metadata.create_all(auth_engine, tables=[User.__table__])
    
    # 2. Create Business Tables in Procurement DB (Exclude User table)
    # We create all tables EXCEPT User
    procurement_tables = [
        TenantAccess.__table__, Company.__table__, CompanySettings.__table__,
        ProcurementRequest.__table__, LineItem.__table__, FileMetadata.__table__,
        PettyCash.__table__, AuditLog.__table__, Vendor.__table__
    ]
    SQLModel.metadata.create_all(procurement_engine, tables=procurement_tables)
