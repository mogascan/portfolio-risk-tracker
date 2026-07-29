"""
Services initialization module
"""
# Order of imports matters for dependency resolution
from app.services.market_data import MarketDataService
from app.services.news import crypto_news_service, macro_news_service, reddit_service
from app.services.ai import AIService

from app.core.logging import get_logger

logger = get_logger(__name__)

# Create singleton instances (order matters for dependencies)
market_data_service = MarketDataService()
logger.info("Market data service initialized")

# News services are initialized in their own module
logger.info("News services loaded")

# AI service initialization
ai_service = AIService()
logger.info("AI service initialized")

# Export the services
__all__ = [
    'market_data_service',
    'crypto_news_service',
    'macro_news_service', 
    'reddit_service',
    'ai_service',
]
