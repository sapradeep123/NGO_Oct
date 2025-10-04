from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Donation, Cause, User, DonationStatus
from app.schemas import DonationCreate, Donation as DonationSchema, DonationUpdate
from app.api.v1.endpoints.auth import get_current_active_user
from app.core.config import settings
import razorpay
import json
from decimal import Decimal

router = APIRouter()

# Initialize Razorpay client
if settings.PAYMENT_PROVIDER == "razorpay" and settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )
else:
    razorpay_client = None


@router.post("/donations/init")
def init_donation(
    donation: DonationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Initialize a donation and create Razorpay order"""
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
    
    if razorpay_client:
        # Create Razorpay order
        order_data = {
            "amount": int(donation.amount * 100),  # Convert to paise
            "currency": donation.currency,
            "receipt": f"donation_{db_donation.id}",
            "notes": {
                "donation_id": str(db_donation.id),
                "cause_id": str(donation.cause_id),
                "donor_id": str(current_user.id)
            }
        }
        
        try:
            order = razorpay_client.order.create(data=order_data)
            
            # Update donation with order ID
            db_donation.pg_order_id = order["id"]
            db.commit()
            
            return {
                "donation_id": db_donation.id,
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "key_id": settings.RAZORPAY_KEY_ID
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Payment gateway error: {str(e)}")
    else:
        # Simulate order creation for testing
        order_id = f"test_order_{db_donation.id}"
        db_donation.pg_order_id = order_id
        db.commit()
        
        return {
            "donation_id": db_donation.id,
            "order_id": order_id,
            "amount": int(donation.amount * 100),
            "currency": donation.currency,
            "key_id": "test_key"
        }


@router.post("/donations/webhook")
def donation_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Razorpay webhook for payment status updates"""
    body = request.body()
    headers = dict(request.headers)
    
    if razorpay_client and settings.PAYMENT_PROVIDER == "razorpay":
        # Verify webhook signature
        try:
            razorpay_client.utility.verify_webhook_signature(
                body, headers.get("X-Razorpay-Signature", ""), settings.RAZORPAY_KEY_SECRET
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    
    # Parse webhook data
    try:
        webhook_data = json.loads(body.decode())
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    # Handle payment events
    if webhook_data.get("event") == "payment.captured":
        payment_data = webhook_data.get("payload", {}).get("payment", {})
        order_id = payment_data.get("order_id")
        
        if order_id:
            donation = db.query(Donation).filter(Donation.pg_order_id == order_id).first()
            if donation:
                donation.status = DonationStatus.CAPTURED
                donation.pg_payment_id = payment_data.get("id")
                donation.pg_signature = headers.get("X-Razorpay-Signature", "")
                donation.audit_json = webhook_data
                
                # Update cause raised amount
                cause = db.query(Cause).filter(Cause.id == donation.cause_id).first()
                if cause:
                    cause.raised_amount += donation.amount
                
                db.commit()
    
    elif webhook_data.get("event") == "payment.failed":
        payment_data = webhook_data.get("payload", {}).get("payment", {})
        order_id = payment_data.get("order_id")
        
        if order_id:
            donation = db.query(Donation).filter(Donation.pg_order_id == order_id).first()
            if donation:
                donation.status = DonationStatus.FAILED
                donation.pg_payment_id = payment_data.get("id")
                donation.audit_json = webhook_data
                db.commit()
    
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
