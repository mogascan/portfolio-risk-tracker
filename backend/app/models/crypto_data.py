"""
Database models for cryptocurrency data
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class CryptoData(Base):
    """Model for storing cryptocurrency market data"""
    
    __tablename__ = "crypto_data"
    
    id = Column(Integer, primary_key=True)
    coin_id = Column(String, unique=True)  # CoinGecko coin ID
    symbol = Column(String)   # Trading symbol (e.g., BTC)
    name = Column(String)     # Full name (e.g., Bitcoin)
    current_price = Column(Float)
    market_cap = Column(Float)
    total_volume = Column(Float)
    last_updated = Column(DateTime)
    
    # Relationship with price history
    price_history = relationship("PriceHistory", back_populates="crypto")
    
    def __str__(self):
        return f"{self.name} ({self.symbol})"

class PriceHistory(Base):
    """Model for storing historical price data"""
    
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True)
    crypto_id = Column(Integer, ForeignKey('crypto_data.id'))
    price = Column(Float)
    timestamp = Column(DateTime)
    
    # Add unique constraint to prevent duplicate entries
    __table_args__ = (
        UniqueConstraint('crypto_id', 'timestamp', name='uix_crypto_timestamp'),
    )
    
    # Relationship with crypto data
    crypto = relationship("CryptoData", back_populates="price_history")
    
    def __str__(self):
        return f"{self.crypto.symbol} - {self.price} at {self.timestamp}" 