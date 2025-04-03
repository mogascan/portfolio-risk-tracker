"""
SQLAlchemy ORM models for database tables
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    """User model for authentication and profile"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    portfolios = relationship("PortfolioEntity", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("TransactionEntity", back_populates="user", cascade="all, delete-orphan")
    watchlists = relationship("WatchlistEntity", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("AlertEntity", back_populates="user", cascade="all, delete-orphan")

class PortfolioEntity(Base):
    """Portfolio entity model"""
    __tablename__ = "portfolios"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, default="Default Portfolio")
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="portfolios")
    holdings = relationship("HoldingEntity", back_populates="portfolio", cascade="all, delete-orphan")

class HoldingEntity(Base):
    """Cryptocurrency holding entity model"""
    __tablename__ = "holdings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(String, ForeignKey("portfolios.id", ondelete="CASCADE"))
    symbol = Column(String, index=True)
    name = Column(String)
    quantity = Column(Float)
    avg_buy_price_usd = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    portfolio = relationship("PortfolioEntity", back_populates="holdings")

class TransactionEntity(Base):
    """Transaction entity model"""
    __tablename__ = "transactions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    symbol = Column(String, index=True)
    name = Column(String, nullable=True)
    transaction_type = Column(String)  # "buy" or "sell"
    quantity = Column(Float)
    price_usd = Column(Float)
    value_usd = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="transactions")

class WatchlistEntity(Base):
    """Watchlist entity model"""
    __tablename__ = "watchlists"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, default="Default Watchlist")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="watchlists")
    items = relationship("WatchlistItemEntity", back_populates="watchlist", cascade="all, delete-orphan")

class WatchlistItemEntity(Base):
    """Watchlist item entity model"""
    __tablename__ = "watchlist_items"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    watchlist_id = Column(String, ForeignKey("watchlists.id", ondelete="CASCADE"))
    symbol = Column(String, index=True)
    name = Column(String, nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    watchlist = relationship("WatchlistEntity", back_populates="items")

class AlertEntity(Base):
    """Alert entity model"""
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    symbol = Column(String, index=True)
    alert_type = Column(String)  # "PRICE_ABOVE", "PRICE_BELOW", "PERCENT_CHANGE", "TECHNICAL_SIGNAL"
    value = Column(Float)
    triggered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    triggered_at = Column(DateTime, nullable=True)
    message = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="alerts")

# News database tables

class CryptoNewsEntity(Base):
    """Cryptocurrency news entity model"""
    __tablename__ = "crypto_news"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String)
    summary = Column(Text)
    source = Column(String)
    url = Column(String)
    published_at = Column(DateTime, index=True)
    timestamp = Column(String)
    sentiment = Column(String, nullable=True)  # "POSITIVE", "NEGATIVE", "NEUTRAL"
    related_coins = Column(JSON, nullable=True)  # List of coin symbols
    created_at = Column(DateTime, default=datetime.utcnow)

class MacroNewsEntity(Base):
    """Macroeconomic news entity model"""
    __tablename__ = "macro_news"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String)
    summary = Column(Text)
    source = Column(String)
    url = Column(String)
    published_at = Column(DateTime, index=True)
    timestamp = Column(String)
    sentiment = Column(String, nullable=True)  # "POSITIVE", "NEGATIVE", "NEUTRAL"
    category = Column(String, nullable=True)  # "business", "technology", "federal-reserve", "financial-markets"
    created_at = Column(DateTime, default=datetime.utcnow)

class SocialMediaEntity(Base):
    """Social media post entity model"""
    __tablename__ = "social_media"
    
    id = Column(String, primary_key=True)  # Using the platform's post ID
    platform = Column(String)  # "reddit", "twitter", etc.
    author = Column(String)
    content = Column(Text)
    title = Column(String, nullable=True)
    url = Column(String)
    score = Column(Integer, nullable=True)
    comments = Column(Integer, nullable=True)
    published_at = Column(DateTime, index=True)
    sentiment = Column(String, nullable=True)  # "POSITIVE", "NEGATIVE", "NEUTRAL"
    related_coins = Column(JSON, nullable=True)  # List of coin symbols
    created_at = Column(DateTime, default=datetime.utcnow)

class MarketDataEntity(Base):
    """Market data entity model"""
    __tablename__ = "market_data"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, index=True)
    name = Column(String)
    price_usd = Column(Float)
    market_cap_usd = Column(Float, nullable=True)
    volume_24h_usd = Column(Float, nullable=True)
    change_24h = Column(Float, nullable=True)
    change_7d = Column(Float, nullable=True)
    change_30d = Column(Float, nullable=True)
    rank = Column(Integer, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    class Meta:
        unique_together = (("symbol", "last_updated"),) 