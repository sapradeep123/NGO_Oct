from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.models import User
from app.schemas import Token, UserCreate, User as UserSchema
from app.deps import get_current_active_user
from datetime import timedelta
from app.core.config import settings

router = APIRouter()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


@router.post("/register", response_model=UserSchema)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create user
    from app.core.security import get_password_hash
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get current user profile with role information"""
    from app.models import Membership, Tenant, Vendor
    
    # Get user's primary membership (first one)
    membership = db.query(Membership).filter(Membership.user_id == current_user.id).first()
    
    # Create response dict
    user_dict = {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "role": None,
        "ngo_id": None,
        "ngo_name": None,
        "vendor_id": None,
        "vendor_name": None
    }
    
    if membership:
        user_dict["role"] = membership.role.value
        
        # Get tenant/NGO information if applicable
        if membership.role in ["NGO_ADMIN", "NGO_STAFF"]:
            tenant = db.query(Tenant).filter(Tenant.id == membership.tenant_id).first()
            if tenant:
                user_dict["ngo_id"] = tenant.id
                user_dict["ngo_name"] = tenant.name
        
        # Get vendor information if applicable
        elif membership.role == "VENDOR":
            vendor = db.query(Vendor).filter(Vendor.tenant_id == membership.tenant_id).first()
            if vendor:
                user_dict["vendor_id"] = vendor.id
                user_dict["vendor_name"] = vendor.name
                user_dict["ngo_id"] = membership.tenant_id
                tenant = db.query(Tenant).filter(Tenant.id == membership.tenant_id).first()
                if tenant:
                    user_dict["ngo_name"] = tenant.name
    
    return user_dict
