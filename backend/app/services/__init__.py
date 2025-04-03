"""
Services initialization module
"""
# Order of imports matters for dependency resolution
from app.services.market_data import MarketDataService
from app.services.database import DatabaseService
from app.services.news import crypto_news_service, macro_news_service, reddit_service
from app.services.ai import AIService

from app.core.settings import USE_DATABASE
from app.core.logging import get_logger

logger = get_logger(__name__)

# Create singleton instances (order matters for dependencies)
market_data_service = MarketDataService()
logger.info("Market data service initialized")

# Initialize database service
if USE_DATABASE:
    logger.info("Database operations enabled, initializing database service")
    db_service = DatabaseService()
else:
    logger.info("Database operations disabled, using mock database service")
    db_service = DatabaseService()  # This will be the MockDatabaseService

# News services are initialized in their own module
logger.info("News services loaded")

# AI service initialization
ai_service = AIService()
logger.info("AI service initialized")

# Export the services
__all__ = [
    'market_data_service',
    'db_service',
    'crypto_news_service',
    'macro_news_service', 
    'reddit_service',
    'ai_service',
]
