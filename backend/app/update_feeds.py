"""
Script to force update all RSS feeds
"""
import logging
import os
import sys
import time

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.news.crypto_news_service import CryptoNewsService
from app.services.news.macro_news_service import MacroNewsService
from app.services.news.reddit_service import RedditService
from app.services.news.feed_fetcher import fetch_rss, clean_html, detect_sentiment

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def update_crypto_news(crypto_service=None):
    """Update crypto news feeds"""
    if crypto_service is None:
        crypto_service = CryptoNewsService()
        
    try:
        # Update feeds for crypto news
        logger.info("Updating crypto news feeds...")
        all_news = []
        for feed in crypto_service.crypto_feeds:
            try:
                feed_news = fetch_rss(feed['url'], feed['source'])
                if feed_news:
                    all_news.extend(feed_news)
                    logger.info(f"Retrieved {len(feed_news)} articles from {feed['source']}")
                else:
                    logger.warning(f"No articles retrieved from {feed['source']}")
            except Exception as e:
                logger.error(f"Error fetching from {feed['source']}: {e}")
            time.sleep(0.5)  # Small delay to prevent rate limiting
        
        crypto_service.news_database = all_news
        crypto_service.save_to_cache()
        logger.info(f"Updated crypto news database with {len(all_news)} items")
        return True
    except Exception as e:
        logger.error(f"Error updating crypto feeds: {e}")
        return False

def update_macro_news(macro_service=None):
    """Update macro news feeds"""
    if macro_service is None:
        macro_service = MacroNewsService()
        
    try:
        # Update feeds for macro news
        logger.info("Updating macro news feeds...")
        all_feeds = []
        for category, feeds in macro_service.macro_news_feeds.items():
            all_feeds.extend(feeds)
        
        # Fetch news from all feeds
        new_items = []
        for feed in all_feeds:
            try:
                feed_news = fetch_rss(feed['url'], feed['source'])
                if feed_news:
                    new_items.extend(feed_news)
                    logger.info(f"Retrieved {len(feed_news)} articles from {feed['source']}")
                else:
                    logger.warning(f"No articles retrieved from {feed['source']}")
            except Exception as e:
                logger.error(f"Error fetching from {feed['source']}: {e}")
            time.sleep(0.5)  # Small delay to prevent rate limiting
        
        macro_service.news_database = new_items
        macro_service.save_to_cache()
        logger.info(f"Updated macro news database with {len(new_items)} items")
        return True
    except Exception as e:
        logger.error(f"Error updating macro feeds: {e}")
        return False

def update_reddit_posts(reddit_service=None):
    """Update Reddit posts"""
    if reddit_service is None:
        reddit_service = RedditService()
        
    try:
        # Update Reddit posts
        logger.info("Updating Reddit posts...")
        try:
            # First try with the single_run parameter
            success = reddit_service.update_feeds(single_run=True)
        except TypeError:
            # If that fails, call the method without parameters
            success = reddit_service.update_feeds()
            
        if success:
            logger.info("Reddit posts updated successfully")
        else:
            logger.warning("Reddit posts update failed")
        return success
    except Exception as e:
        logger.error(f"Error updating Reddit posts: {e}")
        return False

def main():
    """Main function to update all feeds"""
    logger.info("Starting RSS feed update...")
    
    # Initialize services
    from app.services.news import crypto_news_service, macro_news_service, reddit_service
    
    # Update crypto news
    update_crypto_news(crypto_news_service)
    
    # Update macro news
    update_macro_news(macro_news_service)
    
    # Update Reddit posts
    update_reddit_posts(reddit_service)
    
    logger.info("RSS feed update completed!")
    
    # Return success (used when called from other modules)
    return True

if __name__ == "__main__":
    main() 