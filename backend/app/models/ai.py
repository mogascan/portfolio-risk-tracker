"""
AI and machine learning related models
"""
from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class MarketPrediction(BaseModel):
    """Model for AI-based market predictions"""
    symbol: str
    time_frame: str  # "24h", "7d", "30d"
    prediction_price: float
    confidence: float  # 0.0 to 1.0
    prediction_date: datetime
    generated_at: datetime = Field(default_factory=datetime.now)
    model_version: str
    features_used: List[str]

class SentimentAnalysis(BaseModel):
    """Model for sentiment analysis results"""
    symbol: Optional[str] = None
    text: Optional[str] = None
    sentiment_score: float  # -1.0 to 1.0
    sentiment_label: str  # "POSITIVE", "NEGATIVE", "NEUTRAL"
    confidence: float  # 0.0 to 1.0
    analyzed_at: datetime = Field(default_factory=datetime.now)
    sources_analyzed: Optional[int] = None
    time_period: Optional[str] = None  # "24h", "7d", "30d"

class MarketInsight(BaseModel):
    """Model for AI-generated market insights"""
    id: str
    title: str
    content: str
    symbols: List[str]
    categories: List[str]  # "technical", "fundamental", "sentiment", "news", etc.
    generated_at: datetime = Field(default_factory=datetime.now)
    confidence: float  # 0.0 to 1.0
    sources: Optional[List[str]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "id": "insight-123",
                "title": "Bitcoin Entering Accumulation Phase",
                "content": "On-chain metrics indicate Bitcoin may be entering an accumulation phase...",
                "symbols": ["BTC"],
                "categories": ["technical", "on-chain"],
                "generated_at": "2023-01-01T12:00:00Z",
                "confidence": 0.75,
                "sources": ["Glassnode", "CryptoQuant", "News Analysis"]
            }
        }

class PortfolioRecommendation(BaseModel):
    """Model for AI-generated portfolio recommendations"""
    user_id: str
    recommendations: List[Dict[str, Any]]  # List of assets and allocation recommendations
    risk_profile: str  # "conservative", "moderate", "aggressive"
    expected_return: float  # Annual expected return percentage
    generated_at: datetime = Field(default_factory=datetime.now)
    rationale: str
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "user-123",
                "recommendations": [
                    {"symbol": "BTC", "name": "Bitcoin", "allocation": 40.0},
                    {"symbol": "ETH", "name": "Ethereum", "allocation": 30.0},
                    {"symbol": "SOL", "name": "Solana", "allocation": 15.0},
                    {"symbol": "USDC", "name": "USD Coin", "allocation": 15.0}
                ],
                "risk_profile": "moderate",
                "expected_return": 25.5,
                "generated_at": "2023-01-01T12:00:00Z",
                "rationale": "This allocation balances growth potential with risk management..."
            }
        }

class AIAnalysisRequest(BaseModel):
    """Model for requesting AI analysis"""
    content_type: str  # "news", "market_data", "portfolio", "text"
    content: Union[str, Dict[str, Any]]
    analysis_type: str  # "sentiment", "prediction", "insight", "recommendation"
    parameters: Optional[Dict[str, Any]] = None 