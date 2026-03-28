from enum import Enum
from typing import List, Optional
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel, create_engine, Session, select

class StatusEnum(str, Enum):
    DRAFT = "DRAFT"
    PENDING_MANAGER = "PENDING_MANAGER"
    PENDING_DIRECTOR = "PENDING_DIRECTOR"
    APPROVED = "APPROVED"
    PO_ISSUED = "PO_ISSUED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAID = "PAID"

class UserRole(str, Enum):
    REQUESTER = "REQUESTER"
    MANAGER = "MANAGER"
    DIRECTOR = "DIRECTOR"
    FINANCE = "FINANCE"

class ProcurementRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    vendor_name: str
    vendor_id: str
    total_amount: float
    status: StatusEnum = Field(default=StatusEnum.DRAFT)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
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
    file_type: str  # e.g., 'QUOTE', 'RECEIPT', 'PO'
    file_path: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    request_id: int = Field(foreign_key="procurementrequest.id")
    
    request: Optional[ProcurementRequest] = Relationship(back_populates="files")

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    request_id: int = Field(foreign_key="procurementrequest.id")
    action: str  # e.g., 'STATUS_CHANGE', 'COMMENT'
    from_status: Optional[StatusEnum] = None
    to_status: Optional[StatusEnum] = None
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
