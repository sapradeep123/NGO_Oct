from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Payout, Vendor, MembershipRole, User
from app.schemas import Payout as PayoutSchema
from app.deps import get_current_active_user, get_user_membership

router = APIRouter()


@router.get("/payouts/{payout_id}")
def get_payout(
    payout_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get payout details"""
    payout = db.query(Payout).filter(Payout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    # Check permissions based on payout type
    if payout.to_type == "VENDOR":
        # For vendor payouts, check if user is vendor or NGO admin
        vendor = db.query(Vendor).filter(Vendor.id == payout.to_id).first()
        if vendor:
            membership = get_user_membership(current_user.id, vendor.tenant_id, db)
            if not membership or membership.role not in [MembershipRole.VENDOR, MembershipRole.NGO_ADMIN, MembershipRole.PLATFORM_ADMIN]:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
    elif payout.to_type == "NGO":
        # For NGO payouts, check if user is NGO admin or platform admin
        membership = get_user_membership(current_user.id, payout.to_id, db)
        if not membership or membership.role not in [MembershipRole.NGO_ADMIN, MembershipRole.PLATFORM_ADMIN]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return PayoutSchema.model_validate(payout)
