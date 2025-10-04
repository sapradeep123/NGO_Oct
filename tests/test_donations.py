import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import User, Tenant, Category, Cause, Membership, MembershipRole, CauseType, CauseStatus, Donation, DonationStatus
from app.core.security import get_password_hash

def test_donation_init(client: TestClient, auth_headers):
    """Test donation initialization"""
    # First create a cause
    db = SessionLocal()
    try:
        # Create tenant
        tenant = Tenant(
            name="Test NGO",
            slug="test-ngo",
            description="Test NGO for testing"
        )
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        # Create category
        category = Category(name="Test Category", description="Test category")
        db.add(category)
        db.commit()
        db.refresh(category)
        
        # Create cause
        cause = Cause(
            tenant_id=tenant.id,
            category_id=category.id,
            title="Test Cause",
            description="Test cause for donations",
            goal_amount=10000.00,
            type=CauseType.VENDOR,
            status=CauseStatus.LIVE
        )
        db.add(cause)
        db.commit()
        db.refresh(cause)
        
        # Test donation init
        response = client.post("/api/v1/donations/init", json={
            "cause_id": cause.id,
            "amount": 100.00,
            "currency": "INR"
        }, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "donation_id" in data
        assert "order_id" in data
        assert data["amount"] == 10000  # Amount in paise
        
    finally:
        db.close()

def test_donation_init_invalid_cause(client: TestClient, auth_headers):
    """Test donation initialization with invalid cause"""
    response = client.post("/api/v1/donations/init", json={
        "cause_id": 99999,
        "amount": 100.00,
        "currency": "INR"
    }, headers=auth_headers)
    
    assert response.status_code == 404

def test_donation_webhook(client: TestClient):
    """Test donation webhook processing"""
    # Mock webhook data
    webhook_data = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "id": "pay_test123",
                "order_id": "order_test123",
                "amount": 10000,
                "currency": "INR"
            }
        }
    }
    
    response = client.post(
        "/api/v1/donations/webhook",
        json=webhook_data,
        headers={"X-Razorpay-Signature": "test_signature"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

def test_donation_receipt(client: TestClient, auth_headers):
    """Test getting donation receipt"""
    # This would require a completed donation in the database
    response = client.get("/api/v1/donations/1/receipt", headers=auth_headers)
    
    # Should return 404 for non-existent donation or 400 for incomplete donation
    assert response.status_code in [400, 404]
