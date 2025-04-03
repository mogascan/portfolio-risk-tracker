"""
News service for fetching cryptocurrency and market news
This file is deprecated - use the services in the news/ directory instead.
"""
import logging
from app.core.logging import get_logger
from app.services.news import crypto_news_service, macro_news_service, reddit_service

# Initialize logger
logger = get_logger(__name__)

# Re-export the services for backward compatibility
def get_crypto_news(*args, **kwargs):
    logger.warning("Using deprecated news.py module, please update to use crypto_news_service directly")
    return crypto_news_service.get_news(**kwargs)

def get_macro_news(*args, **kwargs):
    logger.warning("Using deprecated news.py module, please update to use macro_news_service directly")
    return macro_news_service.get_news(**kwargs)

def get_reddit_posts(*args, **kwargs):
    logger.warning("Using deprecated news.py module, please update to use reddit_service directly")
    return reddit_service.get_posts(**kwargs) 