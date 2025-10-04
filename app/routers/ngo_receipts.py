from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import NGOReceipt, Cause, ReceiptStatus, Payout, PayoutToType, PayoutStatus, MembershipRole, User
from app.schemas import NGOReceiptCreate, NGOReceipt as NGOReceiptSchema, NGOReceiptUpdate
from app.deps import get_current_active_user, get_user_membership
from typing import List

router = APIRouter()


@router.post("/ngo-receipts")
def create_ngo_receipt(
    cause_id: int = Form(...),
    amount: float = Form(...),
    note: str = Form(None),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create NGO receipt with file uploads (NGO_ADMIN only)"""
    # Verify cause exists
    cause = db.query(Cause).filter(Cause.id == cause_id).first()
    if not cause:
        raise HTTPException(status_code=404, detail="Cause not found")
    
    # Check user has NGO_ADMIN role for this tenant
    membership = get_user_membership(current_user.id, cause.tenant_id, db)
    if not membership or membership.role != MembershipRole.NGO_ADMIN:
        raise HTTPException(status_code=403, detail="Only NGO admins can submit receipts")
    
    # Process uploaded files (in production, upload to S3)
    from app.core.config import settings
    file_urls = []
    for file in files:
        # In production, upload to S3 and get URL
        # For now, simulate file URLs
        base_url = settings.EXTERNAL_BASE_URL or "https://example.com"
        file_urls.append(f"{base_url}/uploads/{file.filename}")
    
    # Create receipt
    receipt = NGOReceipt(
        cause_id=cause_id,
        amount=amount,
        files=file_urls,
        note=note,
        status=ReceiptStatus.SUBMITTED
    )
    
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    
    return NGOReceiptSchema.model_validate(receipt)


@router.patch("/ngo-receipts/{receipt_id}/approve")
def approve_ngo_receipt(
    receipt_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Approve NGO receipt (PLATFORM_ADMIN only) and create payout"""
    # Get receipt
    receipt = db.query(NGOReceipt).filter(NGOReceipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Check user has PLATFORM_ADMIN role
    membership = get_user_membership(current_user.id, receipt.cause.tenant_id, db)
    if not membership or membership.role != MembershipRole.PLATFORM_ADMIN:
        raise HTTPException(status_code=403, detail="Only platform admins can approve NGO receipts")
    
    # Update receipt status
    receipt.status = ReceiptStatus.ADMIN_APPROVED
    db.commit()
    
    # Create payout
    payout = Payout(
        to_type=PayoutToType.NGO,
        to_id=receipt.cause.tenant_id,
        amount=receipt.amount,
        currency="INR",
        status=PayoutStatus.QUEUED
    )
    
    db.add(payout)
    db.commit()
    db.refresh(payout)
    
    return {
        "receipt_id": receipt.id,
        "status": receipt.status,
        "payout_id": payout.id,
        "payout_status": payout.status
    }


@router.get("/ngo-receipts/{receipt_id}")
def get_ngo_receipt(
    receipt_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get NGO receipt details"""
    receipt = db.query(NGOReceipt).filter(NGOReceipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Check permissions
    membership = get_user_membership(current_user.id, receipt.cause.tenant_id, db)
    if not membership:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return NGOReceiptSchema.model_validate(receipt)
