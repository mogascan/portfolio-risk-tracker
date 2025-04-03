"""
News and social data models
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl

class NewsItem(BaseModel):
    """Base model for news items"""
    id: str
    title: str
    summary: str
    source: str
    url: HttpUrl
    published_at: datetime
    timestamp: str
    sentiment: Optional[str] = None  # "POSITIVE", "NEGATIVE", "NEUTRAL"

class CryptoNewsItem(NewsItem):
    """Model for cryptocurrency news items"""
    related_coins: List[str] = Field(default_factory=list)

class MacroNewsItem(NewsItem):
    """Model for macroeconomic news items"""
    category: Optional[str] = None  # "business", "technology", "federal-reserve", "financial-markets"

class SocialMediaPost(BaseModel):
    """Model for social media posts"""
    id: str
    platform: str  # "reddit", "twitter", etc.
    author: str
    content: str
    title: Optional[str] = None
    url: HttpUrl
    score: Optional[int] = None
    comments: Optional[int] = None
    published_at: datetime
    sentiment: Optional[str] = None  # "POSITIVE", "NEGATIVE", "NEUTRAL"
    related_coins: Optional[List[str]] = None
    
class NewsResponse(BaseModel):
    """Model for paginated news response"""
    items: List[NewsItem]
    total_count: int
    page: int
    page_size: int
    
class CryptoNewsResponse(BaseModel):
    """Model for paginated crypto news response"""
    items: List[CryptoNewsItem]
    total_count: int
    page: int
    page_size: int

class MacroNewsResponse(BaseModel):
    """Model for paginated macro news response"""
    items: List[MacroNewsItem]
    total_count: int
    page: int
    page_size: int

class SocialMediaResponse(BaseModel):
    """Model for paginated social media response"""
    items: List[SocialMediaPost]
    total_count: int
    page: int
    page_size: int

class RedditPost(BaseModel):
    """Model for Reddit posts"""
    id: str
    subreddit: str
    author: str
    title: str
    selftext: str
    score: int
    url: HttpUrl
    permalink: str
    created_utc: int
    num_comments: int
    upvote_ratio: float
    
    @property
    def published_at(self) -> datetime:
        """Convert UTC timestamp to datetime"""
        return datetime.fromtimestamp(self.created_utc) 