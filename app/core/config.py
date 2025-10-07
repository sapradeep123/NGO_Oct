from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application
    APP_ENV: str = "dev"
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    ALLOWED_ORIGINS_LIST: List[str] = []
    
    # External
    EXTERNAL_BASE_URL: str = ""
    
    # S3/MinIO
    S3_ENDPOINT: str = "http://minio:9000"
    S3_BUCKET: str = "ngo-app"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    
    # Payment Provider
    PAYMENT_PROVIDER: str = "razorpay"
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    
    # Application
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"
        
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Parse ALLOWED_ORIGINS from comma-separated string
        if isinstance(self.ALLOWED_ORIGINS, str):
            self.ALLOWED_ORIGINS_LIST = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        else:
            self.ALLOWED_ORIGINS_LIST = []


settings = Settings()
