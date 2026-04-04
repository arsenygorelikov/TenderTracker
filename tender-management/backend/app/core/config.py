from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Настройки приложения"""
    
    # Database
    database_url: str = "postgresql://postgres:postgres@db:5432/tender_db"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Application
    app_name: str = "Tender Management System"
    debug: bool = True
    
    class Config:
        env_file = ".env"


settings = Settings()
