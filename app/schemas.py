from pydantic import BaseModel
from email_validator import EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models import (
    CauseType, CauseStatus, DonationStatus, InvoiceStatus, 
    ReceiptStatus, PayoutStatus, PayoutToType, MembershipRole
)


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Auth schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None


# Tenant schemas
class TenantBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class Tenant(TenantBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class TenantDomainBase(BaseModel):
    host: str
    status: str = "PENDING_DNS"
    is_primary: bool = False


class TenantDomainCreate(TenantDomainBase):
    tenant_id: int


class TenantDomain(TenantDomainBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Membership schemas
class MembershipBase(BaseModel):
    role: MembershipRole


class MembershipCreate(MembershipBase):
    user_id: int
    tenant_id: int


class Membership(MembershipBase):
    id: int
    user_id: int
    tenant_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Category schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Cause schemas
class CauseBase(BaseModel):
    title: str
    description: Optional[str] = None
    goal_amount: Decimal
    type: CauseType
    policy_flags_json: Optional[dict] = None


class CauseCreate(CauseBase):
    category_id: int


class CauseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    goal_amount: Optional[Decimal] = None
    status: Optional[CauseStatus] = None
    policy_flags_json: Optional[dict] = None


class Cause(CauseBase):
    id: int
    tenant_id: int
    category_id: int
    raised_amount: Decimal
    status: CauseStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Donation schemas
class DonationBase(BaseModel):
    amount: Decimal
    currency: str = "INR"


class DonationCreate(DonationBase):
    cause_id: int


class DonationUpdate(BaseModel):
    status: Optional[DonationStatus] = None
    pg_order_id: Optional[str] = None
    pg_payment_id: Optional[str] = None
    pg_signature: Optional[str] = None
    audit_json: Optional[dict] = None


class Donation(DonationBase):
    id: int
    cause_id: int
    donor_user_id: int
    pg_order_id: Optional[str] = None
    pg_payment_id: Optional[str] = None
    pg_signature: Optional[str] = None
    status: DonationStatus
    audit_json: Optional[dict] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Vendor schemas
class VendorBase(BaseModel):
    name: str
    gstin: Optional[str] = None
    bank_json: Optional[dict] = None
    kyc_status: str = "PENDING"


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    gstin: Optional[str] = None
    bank_json: Optional[dict] = None
    kyc_status: Optional[str] = None


class Vendor(VendorBase):
    id: int
    tenant_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Vendor Link schemas
class VendorLinkBase(BaseModel):
    terms_json: Optional[dict] = None


class VendorLinkCreate(VendorLinkBase):
    cause_id: int
    vendor_id: int


class VendorLink(VendorLinkBase):
    id: int
    cause_id: int
    vendor_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Vendor Invoice schemas
class VendorInvoiceBase(BaseModel):
    number: str
    amount: Decimal
    files: List[str] = []


class VendorInvoiceCreate(VendorInvoiceBase):
    cause_id: int
    vendor_id: int


class VendorInvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None


class VendorInvoice(VendorInvoiceBase):
    id: int
    cause_id: int
    vendor_id: int
    status: InvoiceStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# NGO Receipt schemas
class NGOReceiptBase(BaseModel):
    amount: Decimal
    files: List[str] = []
    note: Optional[str] = None


class NGOReceiptCreate(NGOReceiptBase):
    cause_id: int


class NGOReceiptUpdate(BaseModel):
    status: Optional[ReceiptStatus] = None


class NGOReceipt(NGOReceiptBase):
    id: int
    cause_id: int
    status: ReceiptStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Payout schemas
class PayoutBase(BaseModel):
    to_type: PayoutToType
    to_id: int
    amount: Decimal
    currency: str = "INR"


class PayoutCreate(PayoutBase):
    pass


class PayoutUpdate(BaseModel):
    status: Optional[PayoutStatus] = None
    pg_payout_id: Optional[str] = None


class Payout(PayoutBase):
    id: int
    pg_payout_id: Optional[str] = None
    status: PayoutStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Document schemas
class DocumentBase(BaseModel):
    url: str
    purpose: Optional[str] = None


class DocumentCreate(DocumentBase):
    hash_sha256: str
    uploaded_by: int


class Document(DocumentBase):
    id: int
    hash_sha256: str
    uploaded_by: int
    signed_by: Optional[int] = None
    signed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Audit Log schemas
class AuditLogBase(BaseModel):
    entity: str
    entity_id: int
    action: str
    before_json: Optional[dict] = None
    after_json: Optional[dict] = None


class AuditLogCreate(AuditLogBase):
    actor_id: Optional[int] = None


class AuditLog(AuditLogBase):
    id: int
    actor_id: Optional[int] = None
    ts: datetime
    
    class Config:
        from_attributes = True


# Tenant Policy schemas
class TenantPolicyBase(BaseModel):
    allow_ngo_managed: bool = False
    ngo_managed_monthly_cap_percent: int = 10


class TenantPolicyCreate(TenantPolicyBase):
    tenant_id: int


class TenantPolicyUpdate(BaseModel):
    allow_ngo_managed: Optional[bool] = None
    ngo_managed_monthly_cap_percent: Optional[int] = None


class TenantPolicy(TenantPolicyBase):
    id: int
    tenant_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Public API schemas
class PublicTenant(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class PublicCause(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    goal_amount: Decimal
    raised_amount: Decimal
    type: CauseType
    status: CauseStatus
    created_at: datetime
    
    class Config:
        from_attributes = True


class TenantByHostResponse(BaseModel):
    mode: str  # 'MICROSITE' or 'MARKETPLACE'
    tenant: Optional[PublicTenant] = None
    theme: Optional[dict] = None  # branding/theme data


class RuntimeConfig(BaseModel):
    apiBaseUrl: str


# Demo schemas
class DemoUser(BaseModel):
    email: str
    password: str
    role: str
    tenant: Optional[str] = None


class DemoUsersResponse(BaseModel):
    users: List[DemoUser]
