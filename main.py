from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import os
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine
from app.api.v1.api import api_router
from app.middleware.tenant import TenantMiddleware


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
    allow_origins=settings.ALLOWED_ORIGINS,
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

# Include API router
app.include_router(api_router, prefix="/api/v1")


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
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=settings.DEBUG
    )
