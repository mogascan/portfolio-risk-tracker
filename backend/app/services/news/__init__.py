"""
News services module initialization
"""
from app.services.news.crypto_news_service import CryptoNewsService
from app.services.news.macro_news_service import MacroNewsService
from app.services.news.reddit_service import RedditService

# Initialize service instances
crypto_news_service = CryptoNewsService()
macro_news_service = MacroNewsService()
reddit_service = RedditService()

__all__ = ["CryptoNewsService", "MacroNewsService", "RedditService", 
           "crypto_news_service", "macro_news_service", "reddit_service"]
