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
    
    # CORS - Store as string, will be parsed to list
    # Default to localhost for development, override in production
    ALLOWED_ORIGINS: str = "*"  # Will be overridden by .env in production
    
    # External
    EXTERNAL_BASE_URL: str = ""  # Should be set in .env for production
    
    # S3/MinIO
    S3_ENDPOINT: str = ""  # Should be set in .env if using S3/MinIO
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
    
    @property
    def ALLOWED_ORIGINS_LIST(self) -> List[str]:
        """Parse ALLOWED_ORIGINS string into a list"""
        if isinstance(self.ALLOWED_ORIGINS, str) and self.ALLOWED_ORIGINS:
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        return []


settings = Settings()
