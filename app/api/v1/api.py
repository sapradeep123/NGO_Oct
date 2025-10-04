from fastapi import APIRouter
from app.api.v1.endpoints import auth, public, donations, vendors, ngo_receipts, payouts, uploads

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
api_router.include_router(donations.router, prefix="/donations", tags=["donations"])
api_router.include_router(vendors.router, prefix="/vendor-invoices", tags=["vendor-invoices"])
api_router.include_router(ngo_receipts.router, prefix="/ngo-receipts", tags=["ngo-receipts"])
api_router.include_router(payouts.router, prefix="/payouts", tags=["payouts"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
