"""
Market data models
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator

class MarketOverview(BaseModel):
    """Model for market overview data"""
    total_market_cap_usd: float
    total_volume_24h_usd: float
    btc_dominance: float
    eth_dominance: float
    market_cap_change_24h: float
    last_updated: datetime = Field(default_factory=datetime.now)

class CryptoPrice(BaseModel):
    """Model for cryptocurrency price data"""
    symbol: str
    name: str
    price_usd: float
    market_cap_usd: Optional[float] = None
    volume_24h_usd: Optional[float] = None
    change_24h: Optional[float] = None
    change_7d: Optional[float] = None
    change_30d: Optional[float] = None
    ath_usd: Optional[float] = None
    ath_date: Optional[datetime] = None
    rank: Optional[int] = None
    last_updated: datetime = Field(default_factory=datetime.now)
    
    @validator('price_usd')
    def validate_positive_price(cls, v):
        """Validate positive price"""
        if v < 0:
            raise ValueError('Price must be positive')
        return v

class CryptoPriceHistory(BaseModel):
    """Model for cryptocurrency price history data"""
    symbol: str
    interval: str  # "1h", "1d", "7d", "30d", "90d", "1y", "max"
    prices: List[Dict[str, Any]]  # List of {timestamp: timestamp, price: price} objects
    
    class Config:
        schema_extra = {
            "example": {
                "symbol": "BTC",
                "interval": "7d",
                "prices": [
                    {
                        "timestamp": "2023-01-01T00:00:00Z",
                        "price": 47000.0
                    },
                    {
                        "timestamp": "2023-01-02T00:00:00Z",
                        "price": 48000.0
                    }
                ]
            }
        }

class TechnicalIndicator(BaseModel):
    """Model for technical indicators"""
    symbol: str
    indicator_type: str  # "RSI", "MACD", "MA", "EMA", "GOLDEN_CROSS", etc.
    value: float
    signal: str  # "BUY", "SELL", "NEUTRAL"
    time_frame: str  # "1h", "4h", "1d", etc.
    last_updated: datetime = Field(default_factory=datetime.now)
    parameters: Optional[Dict[str, Any]] = None  # Additional parameters used for calculation
    
    class Config:
        schema_extra = {
            "example": {
                "symbol": "BTC",
                "indicator_type": "RSI",
                "value": 65.42,
                "signal": "NEUTRAL",
                "time_frame": "1d", 
                "last_updated": "2023-01-01T12:00:00Z",
                "parameters": {
                    "period": 14
                }
            }
        }

class MarketAlert(BaseModel):
    """Model for market alerts"""
    id: str
    user_id: str
    symbol: str
    alert_type: str  # "PRICE_ABOVE", "PRICE_BELOW", "PERCENT_CHANGE", "TECHNICAL_SIGNAL"
    value: float
    triggered: bool = False
    created_at: datetime = Field(default_factory=datetime.now)
    triggered_at: Optional[datetime] = None
    message: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "id": "alert-123",
                "user_id": "user-456",
                "symbol": "ETH",
                "alert_type": "PRICE_ABOVE",
                "value": 3000.0,
                "triggered": False,
                "created_at": "2023-01-01T12:00:00Z",
                "triggered_at": None,
                "message": "ETH price is above $3000"
            }
        } 