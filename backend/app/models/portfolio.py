"""
Portfolio data models
"""
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator

class CryptoAsset(BaseModel):
    """Model for a cryptocurrency asset"""
    symbol: str
    name: str
    quantity: float
    price_usd: float
    value_usd: float
    allocation_percentage: Optional[float] = None
    last_updated: Optional[datetime] = None

    @validator('price_usd', 'value_usd', 'quantity')
    def validate_positive(cls, v):
        """Validate positive numbers"""
        if v < 0:
            raise ValueError('Value must be positive')
        return v

class Portfolio(BaseModel):
    """Model for user's cryptocurrency portfolio"""
    user_id: str
    assets: List[CryptoAsset]
    total_value_usd: float
    last_updated: datetime = Field(default_factory=datetime.now)
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "user123",
                "assets": [
                    {
                        "symbol": "BTC",
                        "name": "Bitcoin",
                        "quantity": 0.5,
                        "price_usd": 50000.0,
                        "value_usd": 25000.0,
                        "allocation_percentage": 60.0,
                        "last_updated": "2023-01-01T12:00:00Z"
                    },
                    {
                        "symbol": "ETH",
                        "name": "Ethereum",
                        "quantity": 10.0,
                        "price_usd": 2000.0,
                        "value_usd": 20000.0,
                        "allocation_percentage": 40.0,
                        "last_updated": "2023-01-01T12:00:00Z"
                    }
                ],
                "total_value_usd": 45000.0,
                "last_updated": "2023-01-01T12:00:00Z"
            }
        }

class Transaction(BaseModel):
    """Model for cryptocurrency transaction"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symbol: str
    name: Optional[str] = None
    transaction_type: str  # "buy" or "sell"
    quantity: float
    price_usd: float
    value_usd: float
    timestamp: datetime = Field(default_factory=datetime.now)
    notes: Optional[str] = None
    
    @validator('transaction_type')
    def validate_transaction_type(cls, v):
        """Validate transaction type"""
        if v.lower() not in ['buy', 'sell']:
            raise ValueError('Transaction type must be "buy" or "sell"')
        return v.lower()

class Watchlist(BaseModel):
    """Model for user's cryptocurrency watchlist"""
    user_id: str
    symbols: List[str]
    last_updated: datetime = Field(default_factory=datetime.now)
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "user123",
                "symbols": ["BTC", "ETH", "SOL", "ADA"],
                "last_updated": "2023-01-01T12:00:00Z"
            }
        } 