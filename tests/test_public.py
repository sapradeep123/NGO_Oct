import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import User, Tenant, Category, Cause, Membership, MembershipRole, CauseType, CauseStatus
from app.core.security import get_password_hash

def test_public_categories(client: TestClient):
    """Test getting categories"""
    response = client.get("/api/v1/public/categories")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_public_ngos(client: TestClient):
    """Test getting NGOs"""
    response = client.get("/api/v1/public/ngos")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_public_causes(client: TestClient):
    """Test getting causes"""
    response = client.get("/api/v1/public/causes")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_public_causes_with_tenant_filter(client: TestClient):
    """Test getting causes filtered by tenant"""
    response = client.get("/api/v1/public/causes?tenant=hope-trust")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_public_causes_with_status_filter(client: TestClient):
    """Test getting causes filtered by status"""
    response = client.get("/api/v1/public/causes?status=LIVE")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_public_tenant_by_slug(client: TestClient):
    """Test getting tenant by slug"""
    response = client.get("/api/v1/public/tenants/hope-trust")
    
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "hope-trust"

def test_public_tenant_by_slug_not_found(client: TestClient):
    """Test getting non-existent tenant by slug"""
    response = client.get("/api/v1/public/tenants/nonexistent")
    
    assert response.status_code == 404

def test_public_tenant_by_host(client: TestClient):
    """Test getting tenant by host"""
    response = client.get("/api/v1/public/tenants/by-host?host=hopetrust.local")
    
    assert response.status_code == 200
    data = response.json()
    assert "mode" in data
    assert data["mode"] in ["MICROSITE", "MARKETPLACE"]

def test_public_tenant_by_host_marketplace(client: TestClient):
    """Test getting marketplace mode for unknown host"""
    response = client.get("/api/v1/public/tenants/by-host?host=unknown.local")
    
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "MARKETPLACE"
    assert data["tenant"] is None
