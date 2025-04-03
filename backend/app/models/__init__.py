"""
Models package for both Pydantic and SQLAlchemy ORM models
"""
# Pydantic models for API
from app.models.portfolio import CryptoAsset, Portfolio, Transaction, Watchlist
from app.models.market import MarketOverview, CryptoPrice, CryptoPriceHistory, TechnicalIndicator, MarketAlert
from app.models.news import NewsItem, CryptoNewsItem, MacroNewsItem, SocialMediaPost, RedditPost
from app.models.news import NewsResponse, CryptoNewsResponse, MacroNewsResponse, SocialMediaResponse
from app.models.ai import MarketPrediction, SentimentAnalysis, MarketInsight, PortfolioRecommendation, AIAnalysisRequest

# SQLAlchemy ORM models for database
from app.models.entities import (
    User, PortfolioEntity, HoldingEntity, TransactionEntity, WatchlistEntity, 
    WatchlistItemEntity, AlertEntity, CryptoNewsEntity, MacroNewsEntity, 
    SocialMediaEntity, MarketDataEntity
) 