"""
AI models for chat and analysis
"""
from pydantic import BaseModel # type: ignore
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatMessage(BaseModel):
    """Represents a message in a chat conversation"""
    conversation_id: str
    message: str
    timestamp: datetime = datetime.now()
    
class ChatRequest(BaseModel):
    """Request model for chat endpoints"""
    query: str
    conversation_id: Optional[str] = None
    
class ChatResponse(BaseModel):
    """Response model for chat endpoints"""
    response: str
    conversation_id: str
    timestamp: datetime = datetime.now()
    
class NewsAnalysisRequest(BaseModel):
    """Request model for news analysis"""
    query: str
    asset_filter: Optional[str] = None
    max_items: Optional[int] = 10
    
class NewsAnalysisResponse(BaseModel):
    """Response model for news analysis"""
    analysis: str
    related_news: List[Dict[str, Any]] = []
    timestamp: datetime = datetime.now() 