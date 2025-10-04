from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.deps import get_current_active_user
from app.models import User
from app.core.config import settings
from app.services.storage import StorageService
import hashlib
from typing import Dict

router = APIRouter()


@router.post("/uploads/presign")
def get_presigned_url(
    filename: str,
    content_type: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get pre-signed URL for file upload"""
    storage_service = StorageService()
    
    try:
        result = storage_service.get_presigned_url(filename, content_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")


@router.post("/uploads/verify")
def verify_file_upload(
    file_url: str,
    file_hash: str,
    purpose: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Verify file upload and create document record"""
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
