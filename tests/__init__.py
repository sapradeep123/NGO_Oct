import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import get_db, Base
from app.core.config import settings
from main import app
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
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "Test@123",
        "first_name": "Test",
        "last_name": "User"
    })
    
    # Login
    response = client.post("/api/v1/auth/token", data={
        "username": "test@example.com",
        "password": "Test@123"
    })
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
