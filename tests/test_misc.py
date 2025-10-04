import pytest
from fastapi.testclient import TestClient

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

def test_uploads_presign(client: TestClient, auth_headers):
    """Test file upload presign endpoint"""
    response = client.post(
        "/api/v1/uploads/presign",
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

def test_uploads_verify(client: TestClient, auth_headers):
    """Test file upload verification"""
    response = client.post(
        "/api/v1/uploads/verify",
        json={
            "file_url": "https://example.com/test.pdf",
            "file_hash": "abcd1234",
            "purpose": "invoice"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "document_id" in data
    assert data["url"] == "https://example.com/test.pdf"
    assert data["hash"] == "abcd1234"
    assert data["purpose"] == "invoice"
