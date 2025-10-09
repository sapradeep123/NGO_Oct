from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models import (
    User, Membership, Tenant, Vendor, Category, Cause, 
    Donation, VendorInvoice, NGOReceipt, VendorLink,
    MembershipRole, CauseStatus
)
from app.schemas import (
    User as UserSchema, Tenant as TenantSchema, 
    Vendor as VendorSchema, Cause as CauseSchema
)
from app.deps import get_current_active_user
from typing import List, Optional

router = APIRouter()


def get_user_membership(user_id: int, db: Session):
    """Get user's membership"""
    return db.query(Membership).filter(Membership.user_id == user_id).first()


def check_admin_access(current_user: User, db: Session):
    """Check if user has admin access"""
    membership = get_user_membership(current_user.id, db)
    if not membership or membership.role not in [MembershipRole.PLATFORM_ADMIN, MembershipRole.NGO_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access admin resources"
        )
    return membership


@router.get("/admin/ngos")
def get_admin_ngos(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get NGOs - filtered by user role"""
    membership = check_admin_access(current_user, db)
    
    query = db.query(Tenant)
    
    # NGO Admins only see their own NGO
    if membership.role == MembershipRole.NGO_ADMIN:
        query = query.filter(Tenant.id == membership.tenant_id)
    
    ngos = query.all()
    
    return {
        "value": [
            {
                "id": ngo.id,
                "name": ngo.name,
                "slug": ngo.slug,
                "description": ngo.description,
                "logo_url": ngo.logo_url,
                "website_url": ngo.website_url,
                "contact_email": ngo.contact_email,
                "contact_phone": ngo.contact_phone,
                "address": ngo.address,
                "created_at": ngo.created_at.isoformat() if ngo.created_at else None
            }
            for ngo in ngos
        ],
        "Count": len(ngos)
    }


@router.get("/admin/vendors")
def get_admin_vendors(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get vendors - filtered by user role"""
    membership = get_user_membership(current_user.id, db)
    
    if not membership:
        return {"value": [], "Count": 0}
    
    query = db.query(Vendor)
    
    # NGO Admins/Staff only see vendors associated with their NGO
    if membership.role in [MembershipRole.NGO_ADMIN, MembershipRole.NGO_STAFF]:
        query = query.filter(Vendor.tenant_id == membership.tenant_id)
    
    # Vendors only see themselves
    elif membership.role == MembershipRole.VENDOR:
        query = query.filter(Vendor.tenant_id == membership.tenant_id)
    
    vendors = query.all()
    
    return {
        "value": [
            {
                "id": vendor.id,
                "tenant_id": vendor.tenant_id,
                "name": vendor.name,
                "gstin": vendor.gstin,
                "bank_json": vendor.bank_json,
                "kyc_status": vendor.kyc_status,
                "created_at": vendor.created_at.isoformat() if vendor.created_at else None
            }
            for vendor in vendors
        ],
        "Count": len(vendors)
    }


@router.get("/admin/donors")
def get_admin_donors(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get donors who have made donations"""
    membership = check_admin_access(current_user, db)
    
    # Get users who have donor role
    query = db.query(User).join(Membership).filter(
        Membership.role == MembershipRole.DONOR
    )
    
    donors = query.all()
    
    return {
        "value": [
            {
                "id": donor.id,
                "email": donor.email,
                "first_name": donor.first_name,
                "last_name": donor.last_name,
                "phone": donor.phone,
                "is_active": donor.is_active,
                "created_at": donor.created_at.isoformat() if donor.created_at else None
            }
            for donor in donors
        ],
        "Count": len(donors)
    }


@router.get("/admin/causes")
def get_admin_causes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get causes - filtered by user role"""
    membership = get_user_membership(current_user.id, db)
    
    if not membership:
        return []
    
    query = db.query(Cause)
    
    # NGO Admins/Staff only see their NGO's causes
    if membership.role in [MembershipRole.NGO_ADMIN, MembershipRole.NGO_STAFF]:
        query = query.filter(Cause.tenant_id == membership.tenant_id)
    
    causes = query.all()
    
    return [
        {
            "id": cause.id,
            "tenant_id": cause.tenant_id,
            "category_id": cause.category_id,
            "title": cause.title,
            "description": cause.description,
            "target_amount": float(cause.target_amount) if cause.target_amount else 0,
            "current_amount": float(cause.current_amount) if cause.current_amount else 0,
            "type": cause.type.value if cause.type else None,
            "status": cause.status.value if cause.status else None,
            "image_url": cause.image_url,
            "policy_flags_json": cause.policy_flags_json,
            "created_at": cause.created_at.isoformat() if cause.created_at else None
        }
        for cause in causes
    ]


@router.get("/admin/pending-causes")
def get_pending_causes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get pending causes for approval"""
    membership = check_admin_access(current_user, db)
    
    query = db.query(Cause).filter(Cause.status == CauseStatus.PENDING_APPROVAL)
    
    # NGO Admins only see their NGO's pending causes
    if membership.role == MembershipRole.NGO_ADMIN:
        query = query.filter(Cause.tenant_id == membership.tenant_id)
    
    causes = query.all()
    
    return {
        "value": [
            {
                "id": cause.id,
                "tenant_id": cause.tenant_id,
                "title": cause.title,
                "description": cause.description,
                "status": cause.status.value if cause.status else None,
                "created_at": cause.created_at.isoformat() if cause.created_at else None
            }
            for cause in causes
        ],
        "Count": len(causes)
    }


@router.get("/admin/payments")
def get_admin_payments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get payment summary"""
    membership = check_admin_access(current_user, db)
    
    query = db.query(Donation)
    
    # Filter by tenant for NGO admins
    if membership.role == MembershipRole.NGO_ADMIN:
        query = query.join(Cause).filter(Cause.tenant_id == membership.tenant_id)
    
    total_amount = db.query(func.sum(Donation.amount)).scalar() or 0
    total_donations = query.count()
    
    return {
        "total_amount": float(total_amount),
        "total_donations": total_donations,
        "currency": "INR"
    }


@router.get("/admin/ngo-vendor-associations")
def get_ngo_vendor_associations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get NGO-Vendor associations through causes"""
    membership = get_user_membership(current_user.id, db)
    
    if not membership:
        return {"value": [], "Count": 0}
    
    # Get vendor links (associations through causes)
    query = db.query(VendorLink).join(Cause)
    
    # Filter by tenant for NGO users
    if membership.role in [MembershipRole.NGO_ADMIN, MembershipRole.NGO_STAFF]:
        query = query.filter(Cause.tenant_id == membership.tenant_id)
    
    # Filter by vendor for vendor users
    elif membership.role == MembershipRole.VENDOR:
        # Get vendor associated with this user's tenant
        vendor = db.query(Vendor).filter(Vendor.tenant_id == membership.tenant_id).first()
        if vendor:
            query = query.filter(VendorLink.vendor_id == vendor.id)
    
    links = query.all()
    
    associations = []
    for link in links:
        cause = db.query(Cause).filter(Cause.id == link.cause_id).first()
        vendor = db.query(Vendor).filter(Vendor.id == link.vendor_id).first()
        tenant = db.query(Tenant).filter(Tenant.id == cause.tenant_id).first() if cause else None
        
        if cause and vendor and tenant:
            associations.append({
                "id": link.id,
                "ngo_id": tenant.id,
                "ngo_name": tenant.name,
                "vendor_id": vendor.id,
                "vendor_name": vendor.name,
                "cause_id": cause.id,
                "cause_title": cause.title,
                "created_at": link.created_at.isoformat() if link.created_at else None
            })
    
    return {
        "value": associations,
        "Count": len(associations)
    }


@router.get("/admin/users")
def get_admin_users(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all users with their roles"""
    membership = check_admin_access(current_user, db)
    
    # Only platform admins can see all users
    if membership.role != MembershipRole.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only platform admins can view all users"
        )
    
    users = db.query(User).all()
    
    result = []
    for user in users:
        user_membership = db.query(Membership).filter(Membership.user_id == user.id).first()
        result.append({
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "is_active": user.is_active,
            "role": user_membership.role.value if user_membership else None,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    
    return {
        "value": result,
        "Count": len(result)
    }


@router.get("/ngo/orders")
def get_ngo_orders(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get orders/donations for NGO"""
    membership = get_user_membership(current_user.id, db)
    
    if not membership or membership.role not in [MembershipRole.NGO_ADMIN, MembershipRole.NGO_STAFF]:
        return []
    
    # Get donations for causes belonging to this NGO
    donations = db.query(Donation).join(Cause).filter(
        Cause.tenant_id == membership.tenant_id
    ).all()
    
    return [
        {
            "id": donation.id,
            "cause_id": donation.cause_id,
            "donor_id": donation.donor_id,
            "amount": float(donation.amount) if donation.amount else 0,
            "currency": donation.currency,
            "status": donation.status.value if donation.status else None,
            "pg_order_id": donation.pg_order_id,
            "created_at": donation.created_at.isoformat() if donation.created_at else None
        }
        for donation in donations
    ]


@router.get("/donor/donations")
def get_donor_donations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get donations made by current donor"""
    donations = db.query(Donation).filter(Donation.donor_id == current_user.id).all()
    
    return [
        {
            "id": donation.id,
            "cause_id": donation.cause_id,
            "amount": float(donation.amount) if donation.amount else 0,
            "currency": donation.currency,
            "status": donation.status.value if donation.status else None,
            "pg_order_id": donation.pg_order_id,
            "created_at": donation.created_at.isoformat() if donation.created_at else None
        }
        for donation in donations
    ]


@router.get("/donor/orders")
def get_donor_orders(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get orders/donations for current donor (same as donations)"""
    return get_donor_donations(current_user, db)


@router.get("/vendor/invoices")
def get_vendor_invoices(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get invoices for current vendor"""
    membership = get_user_membership(current_user.id, db)
    
    if not membership or membership.role != MembershipRole.VENDOR:
        return []
    
    # Get vendor for this tenant
    vendor = db.query(Vendor).filter(Vendor.tenant_id == membership.tenant_id).first()
    
    if not vendor:
        return []
    
    invoices = db.query(VendorInvoice).filter(VendorInvoice.vendor_id == vendor.id).all()
    
    return [
        {
            "id": invoice.id,
            "cause_id": invoice.cause_id,
            "vendor_id": invoice.vendor_id,
            "number": invoice.number,
            "amount": float(invoice.amount) if invoice.amount else 0,
            "files": invoice.files,
            "status": invoice.status.value if invoice.status else None,
            "created_at": invoice.created_at.isoformat() if invoice.created_at else None
        }
        for invoice in invoices
    ]

