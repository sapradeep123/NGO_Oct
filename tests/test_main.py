import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import get_db, Base
from app.core.config import settings
from app.main import app
import os

# Create test database
SQLALCHEMY_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql+psycopg://ngo_user:ngo_pass@localhost:5432/ngo_test_db")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def setup_test_db():
    """Create test database tables"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(setup_test_db):
    """Create test client"""
    return TestClient(app)

@pytest.fixture
def auth_headers(client):
    """Get authentication headers for test user"""
    # Register test user
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "Test@123",
        "first_name": "Test",
        "last_name": "User"
    })
    
    # Login
    response = client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "Test@123"
    })
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_check(client: TestClient):
    """Test health check endpoint"""
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_runtime_config(client: TestClient):
    """Test runtime configuration endpoint"""
    response = client.get("/.well-known/runtime-config")
    assert response.status_code == 200
    data = response.json()
    assert "apiBaseUrl" in data

def test_openapi_docs(client: TestClient):
    """Test OpenAPI documentation endpoint"""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert "info" in data
    assert data["info"]["title"] == "NGO Donations Platform"

def test_auth_register(client: TestClient):
    """Test user registration"""
    response = client.post("/auth/register", json={
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
    client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "Test@123",
        "first_name": "Test",
        "last_name": "User"
    })
    
    # Then login
    response = client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "Test@123"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_auth_me(client: TestClient, auth_headers):
    """Test getting current user info"""
    response = client.get("/auth/me", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["first_name"] == "Test"
    assert data["last_name"] == "User"

def test_public_categories(client: TestClient):
    """Test getting categories"""
    response = client.get("/public/categories")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_public_ngos(client: TestClient):
    """Test getting NGOs"""
    response = client.get("/public/ngos")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_public_causes(client: TestClient):
    """Test getting causes"""
    response = client.get("/public/causes")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_public_tenant_by_host(client: TestClient):
    """Test getting tenant by host"""
    response = client.get("/public/tenants/by-host?host=hopetrust.local")
    
    assert response.status_code == 200
    data = response.json()
    assert "mode" in data
    assert data["mode"] in ["MICROSITE", "MARKETPLACE"]

def test_demo_users_dev(client: TestClient):
    """Test demo users endpoint in dev mode"""
    # This test will pass in dev mode, fail in prod
    response = client.get("/demo/users")
    
    if response.status_code == 200:
        data = response.json()
        assert "users" in data
        assert len(data["users"]) > 0
    else:
        # Expected in prod mode
        assert response.status_code == 404

def test_donations_init(client: TestClient, auth_headers):
    """Test donation initialization"""
    # This would require a cause to exist in the database
    response = client.post("/donations/init", json={
        "cause_id": 1,
        "amount": 100.00,
        "currency": "INR"
    }, headers=auth_headers)
    
    # Should return 404 for non-existent cause
    assert response.status_code == 404

def test_uploads_presign(client: TestClient, auth_headers):
    """Test file upload presign endpoint"""
    response = client.post(
        "/uploads/presign",
        params={
            "filename": "test.pdf",
            "content_type": "application/pdf"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "upload_url" in data
    assert "file_url" in data
    assert "fields" in data
