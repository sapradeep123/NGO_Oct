from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Category, Tenant, Cause, CauseStatus, TenantDomain
from app.schemas import Category as CategorySchema, PublicTenant, PublicCause, TenantByHostResponse
from typing import List, Optional

router = APIRouter()


@router.get("/categories", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    """Get all categories"""
    return db.query(Category).all()


@router.get("/ngos", response_model=List[PublicTenant])
def get_ngos(db: Session = Depends(get_db)):
    """Get all NGOs (tenants)"""
    return db.query(Tenant).all()


@router.get("/causes", response_model=List[PublicCause])
def get_causes(
    tenant: Optional[str] = Query(None, description="Tenant slug"),
    status: Optional[CauseStatus] = Query(CauseStatus.LIVE, description="Cause status"),
    db: Session = Depends(get_db)
):
    """Get causes with optional filtering"""
    query = db.query(Cause)
    
    if tenant:
        query = query.join(Tenant).filter(Tenant.slug == tenant)
    
    if status:
        query = query.filter(Cause.status == status)
    
    return query.all()


@router.get("/tenants/{slug}", response_model=PublicTenant)
def get_tenant_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get tenant by slug"""
    tenant = db.query(Tenant).filter(Tenant.slug == slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.get("/tenants/by-host", response_model=TenantByHostResponse)
def get_tenant_by_host(
    host: str = Query(..., description="Host header"),
    db: Session = Depends(get_db)
):
    """Get tenant by host for microsite/marketplace mode"""
    # Find tenant domain
    domain = db.query(TenantDomain).filter(
        TenantDomain.host == host,
        TenantDomain.status == "LIVE"
    ).first()
    
    if domain:
        return TenantByHostResponse(
            mode="MICROSITE",
            tenant=PublicTenant.model_validate(domain.tenant),
            theme={
                "primary_color": "#2563eb",
                "logo_url": domain.tenant.logo_url,
                "brand_name": domain.tenant.name
            }
        )
    else:
        return TenantByHostResponse(mode="MARKETPLACE")
