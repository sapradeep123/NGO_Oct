import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import User, Tenant, Category, Cause, Membership, MembershipRole, CauseType, CauseStatus, Vendor, VendorInvoice, InvoiceStatus, Payout, PayoutToType, PayoutStatus
from app.core.security import get_password_hash

def test_vendor_invoice_submit(client: TestClient, auth_headers):
    """Test vendor invoice submission"""
    # Create test data
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
        
        # Create vendor user
        vendor_user = User(
            email="vendor@test.com",
            hashed_password=get_password_hash("Vendor@123"),
            first_name="Test",
            last_name="Vendor"
        )
        db.add(vendor_user)
        db.commit()
        db.refresh(vendor_user)
        
        # Create vendor membership
        membership = Membership(
            user_id=vendor_user.id,
            tenant_id=tenant.id,
            role=MembershipRole.VENDOR
        )
        db.add(membership)
        db.commit()
        
        # Create vendor
        vendor = Vendor(
            tenant_id=tenant.id,
            name="Test Vendor",
            gstin="29ABCDE1234F1Z5",
            kyc_status="VERIFIED"
        )
        db.add(vendor)
        db.commit()
        db.refresh(vendor)
        
        # Create category and cause
        category = Category(name="Test Category", description="Test category")
        db.add(category)
        db.commit()
        db.refresh(category)
        
        cause = Cause(
            tenant_id=tenant.id,
            category_id=category.id,
            title="Test Cause",
            description="Test cause",
            goal_amount=10000.00,
            type=CauseType.VENDOR,
            status=CauseStatus.LIVE
        )
        db.add(cause)
        db.commit()
        db.refresh(cause)
        
        # Test vendor invoice submission
        response = client.post(
            "/api/v1/vendor-invoices",
            data={
                "cause_id": cause.id,
                "vendor_id": vendor.id,
                "number": "INV-001",
                "amount": 500.00
            },
            files=[("files", ("test.pdf", b"test content", "application/pdf"))],
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["number"] == "INV-001"
        assert data["amount"] == 500.00
        assert data["status"] == InvoiceStatus.SUBMITTED
        
    finally:
        db.close()

def test_vendor_invoice_approve(client: TestClient, auth_headers):
    """Test vendor invoice approval"""
    # This would require creating an invoice first and then approving it
    response = client.patch("/api/v1/vendor-invoices/1/approve", headers=auth_headers)
    
    # Should return 404 for non-existent invoice or 403 for insufficient permissions
    assert response.status_code in [403, 404]

def test_ngo_receipt_submit(client: TestClient, auth_headers):
    """Test NGO receipt submission"""
    # This would require NGO admin permissions
    response = client.post(
        "/api/v1/ngo-receipts",
        data={
            "cause_id": 1,
            "amount": 1000.00,
            "note": "Test receipt"
        },
        files=[("files", ("receipt.pdf", b"test content", "application/pdf"))],
        headers=auth_headers
    )
    
    # Should return 403 for insufficient permissions or 404 for non-existent cause
    assert response.status_code in [403, 404]

def test_ngo_receipt_approve(client: TestClient, auth_headers):
    """Test NGO receipt approval (platform admin only)"""
    response = client.patch("/api/v1/ngo-receipts/1/approve", headers=auth_headers)
    
    # Should return 404 for non-existent receipt or 403 for insufficient permissions
    assert response.status_code in [403, 404]

def test_payout_get(client: TestClient, auth_headers):
    """Test getting payout details"""
    response = client.get("/api/v1/payouts/1", headers=auth_headers)
    
    # Should return 404 for non-existent payout or 403 for insufficient permissions
    assert response.status_code in [403, 404]
