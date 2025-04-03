"""AI models package"""

from pydantic import BaseModel, Field # type: ignore
from datetime import datetime
from typing import List, Dict, Any, Optional

from .ai import ChatMessage, ChatRequest, ChatResponse, NewsAnalysisRequest, NewsAnalysisResponse

class MarketPrediction(BaseModel):
    """Market prediction model for AI analysis"""
    asset: str
    prediction_type: str = "price"  # price, trend, momentum
    timeframe: str = "24h"  # 24h, 7d, 30d
    value: float
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    timestamp: datetime = datetime.now()

class SentimentAnalysis(BaseModel):
    """Sentiment analysis model for AI analysis"""
    asset: str
    sentiment: str  # positive, negative, neutral
    score: float = Field(ge=-1.0, le=1.0)
    sources: List[Dict[str, Any]] = []
    timestamp: datetime = datetime.now()

class MarketInsight(BaseModel):
    """Market insight model for AI analysis"""
    title: str
    content: str
    related_assets: List[str] = []
    sources: List[Dict[str, Any]] = []
    timestamp: datetime = datetime.now()

class PortfolioRecommendation(BaseModel):
    """Portfolio recommendation model for AI analysis"""
    action: str  # buy, sell, hold
    asset: str
    reasoning: str
    confidence: float = Field(ge=0.0, le=1.0)
    timestamp: datetime = datetime.now()

class AIAnalysisRequest(BaseModel):
    """Request model for AI analysis"""
    query: str
    assets: Optional[List[str]] = None
    timeframe: Optional[str] = None 