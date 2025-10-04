from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_active_user
from app.models import User
from app.core.config import settings
import boto3
import hashlib
from typing import Dict

router = APIRouter()

# Initialize S3 client
if settings.S3_ACCESS_KEY and settings.S3_SECRET_KEY:
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.S3_ENDPOINT,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY
    )
else:
    s3_client = None


@router.post("/uploads/presign")
def get_presigned_url(
    filename: str,
    content_type: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get pre-signed URL for file upload"""
    if not s3_client:
        # Return mock URL for testing
        base_url = settings.EXTERNAL_BASE_URL or "https://example.com"
        return {
            "upload_url": f"{base_url}/uploads/{filename}",
            "file_url": f"{base_url}/uploads/{filename}",
            "fields": {}
        }
    
    # Generate unique key
    import uuid
    file_key = f"uploads/{uuid.uuid4()}/{filename}"
    
    try:
        # Generate pre-signed POST
        response = s3_client.generate_presigned_post(
            Bucket=settings.S3_BUCKET,
            Key=file_key,
            Fields={"Content-Type": content_type},
            Conditions=[
                {"Content-Type": content_type},
                ["content-length-range", 1, 10 * 1024 * 1024]  # 10MB limit
            ],
            ExpiresIn=3600  # 1 hour
        )
        
        return {
            "upload_url": response["url"],
            "file_url": f"{settings.S3_ENDPOINT}/{settings.S3_BUCKET}/{file_key}",
            "fields": response["fields"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"S3 error: {str(e)}")


@router.post("/uploads/verify")
def verify_file_upload(
    file_url: str,
    file_hash: str,
    purpose: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Verify file upload and create document record"""
    # In production, verify the file hash matches
    # For now, just create the document record
    
    from app.models import Document
    
    document = Document(
        url=file_url,
        hash_sha256=file_hash,
        uploaded_by=current_user.id,
        purpose=purpose
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return {
        "document_id": document.id,
        "url": document.url,
        "hash": document.hash_sha256,
        "purpose": document.purpose
    }
