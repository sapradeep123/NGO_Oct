from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import TenantDomain, Tenant
from typing import Optional


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Get tenant from host header
        tenant = await self.get_tenant_from_request(request)
        
        # Add tenant to request state
        request.state.tenant = tenant
        
        response = await call_next(request)
        return response
    
    async def get_tenant_from_request(self, request: Request) -> Optional[Tenant]:
        # Get host from X-Forwarded-Host header first, then Host header
        host = request.headers.get("X-Forwarded-Host") or request.headers.get("Host")
        
        if not host:
            return None
        
        # Remove port if present
        if ":" in host:
            host = host.split(":")[0]
        
        db = SessionLocal()
        try:
            # Find tenant domain
            domain = db.query(TenantDomain).filter(
                TenantDomain.host == host,
                TenantDomain.status == "LIVE"
            ).first()
            
            if domain:
                return domain.tenant
            
            return None
        finally:
            db.close()


class ModeResolutionMiddleware(BaseHTTPMiddleware):
    """Middleware for microsite/marketplace mode resolution"""
    
    async def dispatch(self, request: Request, call_next):
        # Determine mode based on tenant
        tenant = getattr(request.state, 'tenant', None)
        
        if tenant:
            request.state.mode = "MICROSITE"
            request.state.tenant_theme = {
                "primary_color": "#2563eb",
                "logo_url": tenant.logo_url,
                "brand_name": tenant.name,
                "website_url": tenant.website_url
            }
        else:
            request.state.mode = "MARKETPLACE"
            request.state.tenant_theme = None
        
        response = await call_next(request)
        return response
