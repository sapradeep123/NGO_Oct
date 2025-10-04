from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.database import engine
from app.middleware import TenantMiddleware, ModeResolutionMiddleware
from app.routers import auth, public, donations, vendors, ngo_receipts, payouts, uploads, demo


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="NGO Donations Platform",
    description="Multi-tenant NGO donations platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure based on your deployment
)

# Tenant middleware
app.add_middleware(TenantMiddleware)
app.add_middleware(ModeResolutionMiddleware)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(public.router, prefix="/public", tags=["public"])
app.include_router(donations.router, prefix="/donations", tags=["donations"])
app.include_router(vendors.router, prefix="/vendors", tags=["vendors"])
app.include_router(ngo_receipts.router, prefix="/ngo-receipts", tags=["ngo-receipts"])
app.include_router(payouts.router, prefix="/payouts", tags=["payouts"])
app.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
app.include_router(demo.router, prefix="/demo", tags=["demo"])


@app.get("/healthz")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/.well-known/runtime-config")
async def runtime_config():
    """Runtime configuration endpoint"""
    return {
        "apiBaseUrl": settings.EXTERNAL_BASE_URL or "/api/v1"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=settings.DEBUG
    )
