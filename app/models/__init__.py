from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Numeric, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class TenantDomainStatus(str, enum.Enum):
    PENDING_DNS = "PENDING_DNS"
    LIVE = "LIVE"
    DISABLED = "DISABLED"


class MembershipRole(str, enum.Enum):
    PLATFORM_ADMIN = "PLATFORM_ADMIN"
    NGO_ADMIN = "NGO_ADMIN"
    NGO_STAFF = "NGO_STAFF"
    VENDOR = "VENDOR"
    DONOR = "DONOR"


class CauseType(str, enum.Enum):
    VENDOR = "VENDOR"
    NGO_MANAGED = "NGO_MANAGED"


class CauseStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    LIVE = "LIVE"
    FUNDED = "FUNDED"
    FULFILLED = "FULFILLED"
    CLOSED = "CLOSED"


class DonationStatus(str, enum.Enum):
    INIT = "INIT"
    CAPTURED = "CAPTURED"
    REFUNDED = "REFUNDED"
    FAILED = "FAILED"


class InvoiceStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    NGO_APPROVED = "NGO_APPROVED"
    PAID = "PAID"
    REJECTED = "REJECTED"


class ReceiptStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    ADMIN_APPROVED = "ADMIN_APPROVED"
    REJECTED = "REJECTED"


class PayoutStatus(str, enum.Enum):
    INIT = "INIT"
    QUEUED = "QUEUED"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"


class PayoutToType(str, enum.Enum):
    VENDOR = "VENDOR"
    NGO = "NGO"


class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    logo_url = Column(String(500))
    website_url = Column(String(500))
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    domains = relationship("TenantDomain", back_populates="tenant")
    memberships = relationship("Membership", back_populates="tenant")
    causes = relationship("Cause", back_populates="tenant")
    vendors = relationship("Vendor", back_populates="tenant")
    policies = relationship("TenantPolicy", back_populates="tenant")


class TenantDomain(Base):
    __tablename__ = "tenant_domains"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    host = Column(String(255), nullable=False, index=True)
    status = Column(Enum(TenantDomainStatus), default=TenantDomainStatus.PENDING_DNS)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="domains")


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    memberships = relationship("Membership", back_populates="user")
    donations = relationship("Donation", back_populates="donor")


class Membership(Base):
    __tablename__ = "memberships"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    role = Column(Enum(MembershipRole), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="memberships")
    tenant = relationship("Tenant", back_populates="memberships")


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    causes = relationship("Cause", back_populates="category")


class Cause(Base):
    __tablename__ = "causes"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    goal_amount = Column(Numeric(15, 2), nullable=False)
    raised_amount = Column(Numeric(15, 2), default=0)
    type = Column(Enum(CauseType), nullable=False)
    status = Column(Enum(CauseStatus), default=CauseStatus.DRAFT)
    policy_flags_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="causes")
    category = relationship("Category", back_populates="causes")
    donations = relationship("Donation", back_populates="cause")
    vendor_links = relationship("VendorLink", back_populates="cause")
    vendor_invoices = relationship("VendorInvoice", back_populates="cause")
    ngo_receipts = relationship("NGOReceipt", back_populates="cause")


class Donation(Base):
    __tablename__ = "donations"
    
    id = Column(Integer, primary_key=True, index=True)
    cause_id = Column(Integer, ForeignKey("causes.id"), nullable=False)
    donor_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="INR")
    pg_order_id = Column(String(255))
    pg_payment_id = Column(String(255))
    pg_signature = Column(String(500))
    status = Column(Enum(DonationStatus), default=DonationStatus.INIT)
    audit_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    cause = relationship("Cause", back_populates="donations")
    donor = relationship("User", back_populates="donations")


class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    gstin = Column(String(15))
    bank_json = Column(JSON)
    kyc_status = Column(String(50), default="PENDING")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="vendors")
    vendor_links = relationship("VendorLink", back_populates="vendor")
    vendor_invoices = relationship("VendorInvoice", back_populates="vendor")


class VendorLink(Base):
    __tablename__ = "vendor_links"
    
    id = Column(Integer, primary_key=True, index=True)
    cause_id = Column(Integer, ForeignKey("causes.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    terms_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    cause = relationship("Cause", back_populates="vendor_links")
    vendor = relationship("Vendor", back_populates="vendor_links")


class VendorInvoice(Base):
    __tablename__ = "vendor_invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    cause_id = Column(Integer, ForeignKey("causes.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    number = Column(String(100), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    files = Column(JSON)  # Array of file URLs
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.SUBMITTED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    cause = relationship("Cause", back_populates="vendor_invoices")
    vendor = relationship("Vendor", back_populates="vendor_invoices")


class NGOReceipt(Base):
    __tablename__ = "ngo_receipts"
    
    id = Column(Integer, primary_key=True, index=True)
    cause_id = Column(Integer, ForeignKey("causes.id"), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    files = Column(JSON)  # Array of file URLs
    note = Column(Text)
    status = Column(Enum(ReceiptStatus), default=ReceiptStatus.SUBMITTED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    cause = relationship("Cause", back_populates="ngo_receipts")


class Payout(Base):
    __tablename__ = "payouts"
    
    id = Column(Integer, primary_key=True, index=True)
    to_type = Column(Enum(PayoutToType), nullable=False)
    to_id = Column(Integer, nullable=False)  # vendor_id or tenant_id
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), default="INR")
    pg_payout_id = Column(String(255))
    status = Column(Enum(PayoutStatus), default=PayoutStatus.INIT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(1000), nullable=False)
    hash_sha256 = Column(String(64), nullable=False, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    purpose = Column(String(255))
    signed_by = Column(Integer, ForeignKey("users.id"))
    signed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    uploader = relationship("User", foreign_keys=[uploaded_by])
    signer = relationship("User", foreign_keys=[signed_by])


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"))
    entity = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action = Column(String(100), nullable=False)
    before_json = Column(JSON)
    after_json = Column(JSON)
    ts = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    actor = relationship("User")


class TenantPolicy(Base):
    __tablename__ = "tenant_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    allow_ngo_managed = Column(Boolean, default=True)
    ngo_managed_monthly_cap_percent = Column(Integer, default=10)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="policies")
