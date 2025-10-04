from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import User, Membership, MembershipRole, Tenant
from app.core.security import verify_token
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_user_membership(user_id: int, tenant_id: int, db: Session) -> Optional[Membership]:
    """Get user membership for a tenant"""
    return db.query(Membership).filter(
        Membership.user_id == user_id,
        Membership.tenant_id == tenant_id
    ).first()


def require_role(required_roles: list[MembershipRole]):
    """Dependency to require specific roles"""
    def role_checker(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        # Check if user has any of the required roles across all tenants
        memberships = db.query(Membership).filter(
            Membership.user_id == current_user.id,
            Membership.role.in_(required_roles)
        ).all()
        
        if not memberships:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        return current_user, memberships
    
    return role_checker


def require_tenant_role(required_roles: list[MembershipRole]):
    """Dependency to require specific roles within a tenant context"""
    def tenant_role_checker(
        tenant_id: int,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        membership = get_user_membership(current_user.id, tenant_id, db)
        
        if not membership or membership.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this tenant"
            )
        
        return current_user, membership
    
    return tenant_role_checker


def get_tenant_from_request(request) -> Optional[Tenant]:
    """Get tenant from request headers (used by middleware)"""
    from app.core.database import SessionLocal
    
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
        from app.models import TenantDomain
        domain = db.query(TenantDomain).filter(
            TenantDomain.host == host,
            TenantDomain.status == "LIVE"
        ).first()
        
        if domain:
            return domain.tenant
        
        return None
    finally:
        db.close()
