import os
from pydantic import BaseModel, Field
from typing import Optional

class Settings(BaseModel):
    # Base configuration
    APP_NAME: str = "Crypto Portfolio Tracker"
    DEBUG: bool = False
    
    # Database configuration
    DATABASE_URL: str = "sqlite:///./data/app.db"
    
    # API keys
    COINGECKO_API_KEY: Optional[str] = None
    
    # Golden Cross settings
    SHORT_MA_PERIOD: int = 50
    LONG_MA_PERIOD: int = 200
    APPROACHING_THRESHOLD: float = 0.02
    GOLDEN_CROSS_CHECK_INTERVAL: int = 3600
    TOP_COINS_LIMIT: int = 200
    
    # CORS settings
    CORS_ORIGINS: str = "*"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"  # Allow extra fields in the settings

settings = Settings()
