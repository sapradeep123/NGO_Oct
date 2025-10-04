import razorpay
from app.core.config import settings
from decimal import Decimal
from typing import Dict, Any


class PaymentService:
    """Service for handling payment operations"""
    
    def __init__(self):
        self.client = None
        if settings.PAYMENT_PROVIDER == "razorpay" and settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            self.client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
    
    def create_order(self, amount: Decimal, currency: str, donation_id: int, cause_id: int, donor_id: int) -> Dict[str, Any]:
        """Create payment order"""
        if self.client:
            # Create Razorpay order
            order_data = {
                "amount": int(amount * 100),  # Convert to paise
                "currency": currency,
                "receipt": f"donation_{donation_id}",
                "notes": {
                    "donation_id": str(donation_id),
                    "cause_id": str(cause_id),
                    "donor_id": str(donor_id)
                }
            }
            
            order = self.client.order.create(data=order_data)
            
            return {
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "key_id": settings.RAZORPAY_KEY_ID
            }
        else:
            # Simulate order creation for testing
            order_id = f"test_order_{donation_id}"
            return {
                "order_id": order_id,
                "amount": int(amount * 100),
                "currency": currency,
                "key_id": "test_key"
            }
    
    def verify_webhook_signature(self, body: bytes, headers: Dict[str, str]):
        """Verify webhook signature"""
        if self.client:
            signature = headers.get("X-Razorpay-Signature", "")
            self.client.utility.verify_webhook_signature(
                body, signature, settings.RAZORPAY_KEY_SECRET
            )
    
    def process_webhook(self, webhook_data: Dict[str, Any], db):
        """Process webhook data"""
        from app.models import Donation, Cause, DonationStatus
        
        # Handle payment events
        if webhook_data.get("event") == "payment.captured":
            payment_data = webhook_data.get("payload", {}).get("payment", {})
            order_id = payment_data.get("order_id")
            
            if order_id:
                donation = db.query(Donation).filter(Donation.pg_order_id == order_id).first()
                if donation:
                    donation.status = DonationStatus.CAPTURED
                    donation.pg_payment_id = payment_data.get("id")
                    donation.pg_signature = webhook_data.get("signature", "")
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
