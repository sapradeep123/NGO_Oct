from sqlalchemy.orm import Session
from app.models import Payout, PayoutStatus, PayoutToType
from typing import List, Optional


class PayoutService:
    """Service for handling payout operations"""
    
    def __init__(self):
        pass
    
    def create_payout(self, db: Session, to_type: PayoutToType, to_id: int, amount: float, currency: str = "INR") -> Payout:
        """Create a new payout"""
        payout = Payout(
            to_type=to_type,
            to_id=to_id,
            amount=amount,
            currency=currency,
            status=PayoutStatus.QUEUED
        )
        
        db.add(payout)
        db.commit()
        db.refresh(payout)
        
        return payout
    
    def update_payout_status(self, db: Session, payout_id: int, status: PayoutStatus, pg_payout_id: Optional[str] = None) -> Payout:
        """Update payout status"""
        payout = db.query(Payout).filter(Payout.id == payout_id).first()
        if not payout:
            raise ValueError("Payout not found")
        
        payout.status = status
        if pg_payout_id:
            payout.pg_payout_id = pg_payout_id
        
        db.commit()
        db.refresh(payout)
        
        return payout
    
    def get_payouts_by_tenant(self, db: Session, tenant_id: int) -> List[Payout]:
        """Get all payouts for a tenant"""
        return db.query(Payout).filter(
            Payout.to_type == PayoutToType.NGO,
            Payout.to_id == tenant_id
        ).all()
    
    def get_payouts_by_vendor(self, db: Session, vendor_id: int) -> List[Payout]:
        """Get all payouts for a vendor"""
        return db.query(Payout).filter(
            Payout.to_type == PayoutToType.VENDOR,
            Payout.to_id == vendor_id
        ).all()
    
    def process_payout(self, db: Session, payout_id: int) -> bool:
        """Process payout (mock implementation)"""
        payout = db.query(Payout).filter(Payout.id == payout_id).first()
        if not payout:
            return False
        
        # In production, integrate with payment gateway
        # For now, just mark as processed
        payout.status = PayoutStatus.PROCESSED
        payout.pg_payout_id = f"payout_{payout_id}_{payout.created_at.timestamp()}"
        
        db.commit()
        return True
