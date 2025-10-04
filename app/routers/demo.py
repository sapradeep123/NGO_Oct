from fastapi import APIRouter, Depends, HTTPException
from app.core.config import settings
from app.schemas import DemoUsersResponse, DemoUser

router = APIRouter()


@router.get("/demo/users", response_model=DemoUsersResponse)
def get_demo_users():
    """Get demo user credentials (dev only)"""
    if settings.APP_ENV == "prod":
        raise HTTPException(status_code=404, detail="Not found")
    
    users = [
        DemoUser(
            email="admin@example.com",
            password="Admin@123",
            role="PLATFORM_ADMIN"
        ),
        DemoUser(
            email="ngo.hope.admin@example.com",
            password="Ngo@123",
            role="NGO_ADMIN",
            tenant="hope-trust"
        ),
        DemoUser(
            email="ngo.hope.staff@example.com",
            password="Staff@123",
            role="NGO_STAFF",
            tenant="hope-trust"
        ),
        DemoUser(
            email="vendor.alpha@example.com",
            password="Vendor@123",
            role="VENDOR",
            tenant="hope-trust"
        ),
        DemoUser(
            email="donor.arya@example.com",
            password="Donor@123",
            role="DONOR"
        )
    ]
    
    return DemoUsersResponse(users=users)
