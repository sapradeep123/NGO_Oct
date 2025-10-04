from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import VendorInvoice, Cause, Vendor, InvoiceStatus, Payout, PayoutToType, PayoutStatus, MembershipRole, User, VendorLink
from app.schemas import VendorInvoiceCreate, VendorInvoice as VendorInvoiceSchema, VendorInvoiceUpdate, VendorCreate, Vendor as VendorSchema, VendorLinkCreate, VendorLink as VendorLinkSchema
from app.deps import get_current_active_user, get_user_membership
from typing import List

router = APIRouter()


@router.post("/vendors", response_model=VendorSchema)
def create_vendor(
    vendor: VendorCreate,
    tenant_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a vendor (NGO_ADMIN only)"""
    # Check user has NGO_ADMIN role for this tenant
    membership = get_user_membership(current_user.id, tenant_id, db)
    if not membership or membership.role != MembershipRole.NGO_ADMIN:
        raise HTTPException(status_code=403, detail="Only NGO admins can create vendors")
    
    # Create vendor
    db_vendor = Vendor(
        tenant_id=tenant_id,
        name=vendor.name,
        gstin=vendor.gstin,
        bank_json=vendor.bank_json,
        kyc_status=vendor.kyc_status
    )
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    
    return VendorSchema.model_validate(db_vendor)


@router.post("/causes/{cause_id}/vendors", response_model=VendorLinkSchema)
def link_vendor_to_cause(
    cause_id: int,
    vendor_link: VendorLinkCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Link vendor to cause (NGO_ADMIN only)"""
    # Verify cause exists
    cause = db.query(Cause).filter(Cause.id == cause_id).first()
    if not cause:
        raise HTTPException(status_code=404, detail="Cause not found")
    
    # Check user has NGO_ADMIN role for this tenant
    membership = get_user_membership(current_user.id, cause.tenant_id, db)
    if not membership or membership.role != MembershipRole.NGO_ADMIN:
        raise HTTPException(status_code=403, detail="Only NGO admins can link vendors")
    
    # Verify vendor exists and belongs to same tenant
    vendor = db.query(Vendor).filter(
        Vendor.id == vendor_link.vendor_id,
        Vendor.tenant_id == cause.tenant_id
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Create vendor link
    db_link = VendorLink(
        cause_id=cause_id,
        vendor_id=vendor_link.vendor_id,
        terms_json=vendor_link.terms_json
    )
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    
    return VendorLinkSchema.model_validate(db_link)


@router.post("/vendor-invoices")
def create_vendor_invoice(
    cause_id: int = Form(...),
    vendor_id: int = Form(...),
    number: str = Form(...),
    amount: float = Form(...),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create vendor invoice with file uploads (VENDOR only)"""
    # Verify cause exists
    cause = db.query(Cause).filter(Cause.id == cause_id).first()
    if not cause:
        raise HTTPException(status_code=404, detail="Cause not found")
    
    # Verify vendor exists
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Check user has vendor role for this tenant
    membership = get_user_membership(current_user.id, vendor.tenant_id, db)
    if not membership or membership.role != MembershipRole.VENDOR:
        raise HTTPException(status_code=403, detail="Only vendors can submit invoices")
    
    # Process uploaded files (in production, upload to S3)
    from app.core.config import settings
    file_urls = []
    for file in files:
        # In production, upload to S3 and get URL
        # For now, simulate file URLs
        base_url = settings.EXTERNAL_BASE_URL or "https://example.com"
        file_urls.append(f"{base_url}/uploads/{file.filename}")
    
    # Create invoice
    invoice = VendorInvoice(
        cause_id=cause_id,
        vendor_id=vendor_id,
        number=number,
        amount=amount,
        files=file_urls,
        status=InvoiceStatus.SUBMITTED
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    return VendorInvoiceSchema.model_validate(invoice)


@router.patch("/vendor-invoices/{invoice_id}/approve")
def approve_vendor_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Approve vendor invoice and create payout (NGO_ADMIN only)"""
    # Get invoice
    invoice = db.query(VendorInvoice).filter(VendorInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check user has NGO_ADMIN role for this tenant
    membership = get_user_membership(current_user.id, invoice.vendor.tenant_id, db)
    if not membership or membership.role != MembershipRole.NGO_ADMIN:
        raise HTTPException(status_code=403, detail="Only NGO admins can approve invoices")
    
    # Update invoice status
    invoice.status = InvoiceStatus.NGO_APPROVED
    db.commit()
    
    # Create payout
    payout = Payout(
        to_type=PayoutToType.VENDOR,
        to_id=invoice.vendor_id,
        amount=invoice.amount,
        currency="INR",
        status=PayoutStatus.QUEUED
    )
    
    db.add(payout)
    db.commit()
    db.refresh(payout)
    
    return {
        "invoice_id": invoice.id,
        "status": invoice.status,
        "payout_id": payout.id,
        "payout_status": payout.status
    }


@router.get("/vendor-invoices/{invoice_id}")
def get_vendor_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get vendor invoice details"""
    invoice = db.query(VendorInvoice).filter(VendorInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check permissions
    membership = get_user_membership(current_user.id, invoice.vendor.tenant_id, db)
    if not membership:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return VendorInvoiceSchema.model_validate(invoice)
