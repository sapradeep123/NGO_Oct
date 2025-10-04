from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Donation, Cause, User, DonationStatus
from app.schemas import DonationCreate, Donation as DonationSchema, DonationUpdate
from app.deps import get_current_active_user
from app.core.config import settings
from app.services.payment import PaymentService
import json
from decimal import Decimal

router = APIRouter()


@router.post("/donations/init")
def init_donation(
    donation: DonationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Initialize a donation and create payment order"""
    # Verify cause exists and is live
    cause = db.query(Cause).filter(
        Cause.id == donation.cause_id,
        Cause.status == "LIVE"
    ).first()
    
    if not cause:
        raise HTTPException(status_code=404, detail="Cause not found or not live")
    
    # Create donation record
    db_donation = Donation(
        cause_id=donation.cause_id,
        donor_user_id=current_user.id,
        amount=donation.amount,
        currency=donation.currency,
        status=DonationStatus.INIT
    )
    db.add(db_donation)
    db.commit()
    db.refresh(db_donation)
    
    # Initialize payment service
    payment_service = PaymentService()
    
    try:
        order_data = payment_service.create_order(
            amount=donation.amount,
            currency=donation.currency,
            donation_id=db_donation.id,
            cause_id=donation.cause_id,
            donor_id=current_user.id
        )
        
        # Update donation with order ID
        db_donation.pg_order_id = order_data["order_id"]
        db.commit()
        
        return {
            "donation_id": db_donation.id,
            "order_id": order_data["order_id"],
            "amount": order_data["amount"],
            "currency": order_data["currency"],
            "key_id": order_data.get("key_id")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment gateway error: {str(e)}")


@router.post("/donations/webhook")
def donation_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle payment webhook for status updates"""
    body = request.body()
    headers = dict(request.headers)
    
    # Initialize payment service
    payment_service = PaymentService()
    
    # Verify webhook signature
    try:
        payment_service.verify_webhook_signature(body, headers)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    
    # Parse webhook data
    try:
        webhook_data = json.loads(body.decode())
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    # Process webhook
    try:
        payment_service.process_webhook(webhook_data, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook processing error: {str(e)}")
    
    return {"status": "success"}


@router.get("/donations/{donation_id}/receipt")
def get_donation_receipt(
    donation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get donation receipt"""
    donation = db.query(Donation).filter(
        Donation.id == donation_id,
        Donation.donor_user_id == current_user.id
    ).first()
    
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    
    if donation.status != DonationStatus.CAPTURED:
        raise HTTPException(status_code=400, detail="Donation not completed")
    
    cause = db.query(Cause).filter(Cause.id == donation.cause_id).first()
    
    return {
        "donation_id": donation.id,
        "amount": donation.amount,
        "currency": donation.currency,
        "cause_title": cause.title if cause else "Unknown Cause",
        "donor_name": f"{current_user.first_name} {current_user.last_name}".strip(),
        "donor_email": current_user.email,
        "created_at": donation.created_at,
        "payment_id": donation.pg_payment_id
    }
