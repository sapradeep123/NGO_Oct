import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import User, Tenant, Category, Cause, Membership, MembershipRole, CauseType, CauseStatus
from app.core.security import get_password_hash

def test_auth_register(client: TestClient):
    """Test user registration"""
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "Test@123",
        "first_name": "Test",
        "last_name": "User"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["first_name"] == "Test"
    assert data["last_name"] == "User"
    assert "id" in data

def test_auth_login(client: TestClient):
    """Test user login"""
    # First register a user
    client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "Test@123",
        "first_name": "Test",
        "last_name": "User"
    })
    
    # Then login
    response = client.post("/api/v1/auth/token", data={
        "username": "test@example.com",
        "password": "Test@123"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_auth_invalid_login(client: TestClient):
    """Test login with invalid credentials"""
    response = client.post("/api/v1/auth/token", data={
        "username": "nonexistent@example.com",
        "password": "wrongpassword"
    })
    
    assert response.status_code == 401

def test_auth_me(client: TestClient, auth_headers):
    """Test getting current user info"""
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["first_name"] == "Test"
    assert data["last_name"] == "User"

def test_auth_protected_endpoint_without_token(client: TestClient):
    """Test accessing protected endpoint without token"""
    response = client.get("/api/v1/auth/me")
    
    assert response.status_code == 401
