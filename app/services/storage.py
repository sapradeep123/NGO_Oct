import boto3
from app.core.config import settings
from typing import Dict, Any
import uuid


class StorageService:
    """Service for handling file storage operations"""
    
    def __init__(self):
        self.client = None
        if settings.S3_ACCESS_KEY and settings.S3_SECRET_KEY:
            self.client = boto3.client(
                's3',
                endpoint_url=settings.S3_ENDPOINT,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY
            )
    
    def get_presigned_url(self, filename: str, content_type: str) -> Dict[str, Any]:
        """Get pre-signed URL for file upload"""
        if not self.client:
            # Return mock URL for testing
            base_url = settings.EXTERNAL_BASE_URL or "https://example.com"
            return {
                "upload_url": f"{base_url}/uploads/{filename}",
                "file_url": f"{base_url}/uploads/{filename}",
                "fields": {}
            }
        
        # Generate unique key
        file_key = f"uploads/{uuid.uuid4()}/{filename}"
        
        try:
            # Generate pre-signed POST
            response = self.client.generate_presigned_post(
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
            raise Exception(f"S3 error: {str(e)}")
    
    def upload_file(self, file_content: bytes, file_key: str, content_type: str) -> str:
        """Upload file to storage"""
        if not self.client:
            # Return mock URL for testing
            base_url = settings.EXTERNAL_BASE_URL or "https://example.com"
            return f"{base_url}/uploads/{file_key}"
        
        try:
            self.client.put_object(
                Bucket=settings.S3_BUCKET,
                Key=file_key,
                Body=file_content,
                ContentType=content_type
            )
            
            return f"{settings.S3_ENDPOINT}/{settings.S3_BUCKET}/{file_key}"
        except Exception as e:
            raise Exception(f"S3 upload error: {str(e)}")
    
    def delete_file(self, file_key: str) -> bool:
        """Delete file from storage"""
        if not self.client:
            return True  # Mock success
        
        try:
            self.client.delete_object(Bucket=settings.S3_BUCKET, Key=file_key)
            return True
        except Exception as e:
            raise Exception(f"S3 delete error: {str(e)}")
