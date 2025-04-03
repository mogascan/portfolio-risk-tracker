import json
import time
import threading
import logging
import os
from datetime import datetime, timedelta
from app.services.news.feed_fetcher import fetch_rss, clean_html, detect_sentiment

logger = logging.getLogger(__name__)

class MacroNewsService:
    def __init__(self):
        self.news_database = []
        self.is_running_flag = False
        self.update_thread = None
        self.macro_news_feeds = {
            'business': [
                {'url': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB', 'source': 'GOOGLE NEWS BUSINESS'}
            ],
            'technology': [
                {'url': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB', 'source': 'GOOGLE NEWS TECHNOLOGY'}
            ],
            'federal-reserve': [
                {'url': 'https://news.google.com/rss/search?q=federal+reserve', 'source': 'GOOGLE NEWS - FEDERAL RESERVE'}
            ],
            'financial-markets': [
                {'url': 'https://news.google.com/rss/search?q=financial+markets', 'source': 'GOOGLE NEWS - FINANCIAL MARKETS'}
            ],
            'us-news': [
                {'url': 'https://news.google.com/rss/headlines/section/geo/US', 'source': 'GOOGLE NEWS - US'}
            ],
            'global': [
                {'url': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB', 'source': 'GOOGLE NEWS - GLOBAL'}
            ]
        }
        self.load_cached_data()

    def load_cached_data(self):
        """Load cached news data from file"""
        try:
            cache_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data', 'macro_news.json')
            if os.path.exists(cache_path):
                with open(cache_path, 'r') as f:
                    self.news_database = json.load(f)
                logger.info(f"Loaded {len(self.news_database)} macro news items from cache")
            else:
                logger.warning(f"Macro news cache file not found at {cache_path}")
                self.news_database = []
        except Exception as e:
            logger.error(f"Error loading macro news cache: {e}")
            self.news_database = []

    def save_to_cache(self):
        """Save news data to cache file"""
        try:
            cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data')
            os.makedirs(cache_dir, exist_ok=True)
            
            cache_path = os.path.join(cache_dir, 'macro_news.json')
            with open(cache_path, 'w') as f:
                json.dump(self.news_database, f)
            logger.info(f"Saved {len(self.news_database)} macro news items to cache")
        except Exception as e:
            logger.error(f"Error saving macro news to cache: {e}")

    def update_feeds(self, interval_minutes=15):
        """Update macro news feeds"""
        while self.is_running_flag:
            try:
                # Fetch news from all feeds by category
                new_items = []
                for category, feeds in self.macro_news_feeds.items():
                    for feed in feeds:
                        feed_news = fetch_rss(feed['url'], feed['source'])
                        # Add category to each news item
                        for item in feed_news:
                            item['category'] = category
                        new_items.extend(feed_news)
                        time.sleep(1)  # Short pause between feeds
                
                # Add new items to database if they don't exist
                for item in new_items:
                    if not any(existing_item.get('id') == item.get('id') for existing_item in self.news_database):
                        self.news_database.append(item)
                
                # Sort by timestamp (newest first)
                self.news_database.sort(key=lambda x: datetime.strptime(x.get('timestamp', '1/1/2000'), '%m/%d/%Y, %I:%M:%S %p'), reverse=True)
                
                # Limit database size
                self.news_database = self.news_database[:1000]
                
                # Save to cache
                self.save_to_cache()
                
                logger.info(f"Updated macro news database with {len(new_items)} new items")
                
            except Exception as e:
                logger.error(f"Error updating macro news feeds: {e}")
            
            # Wait before next update
            time.sleep(interval_minutes * 60)

    def start_update_thread(self):
        """Start the background thread for updating feeds"""
        self.is_running_flag = True
        self.update_thread = threading.Thread(target=self.update_feeds, daemon=True)
        self.update_thread.start()
        logger.info("Started macro news update thread")

    def stop_update_thread(self):
        """Stop the background thread"""
        self.is_running_flag = False
        if self.update_thread:
            self.update_thread.join()
        logger.info("Stopped macro news update thread")

    def is_running(self):
        """Check if the update thread is running"""
        return self.is_running_flag and self.update_thread and self.update_thread.is_alive()

    def get_news(self, category: str, limit: int = 10, hours: int = 24):
        """Get macro news for a specific category"""
        try:
            # Calculate cutoff time
            cutoff_time = datetime.now() - timedelta(hours=hours)
            
            # Filter news by category and recency
            filtered_news = []
            for item in self.news_database:
                try:
                    if item.get('category') == category:
                        item_date = datetime.strptime(item.get('timestamp', '1/1/2000'), '%m/%d/%Y, %I:%M:%S %p')
                        if item_date >= cutoff_time:
                            filtered_news.append(item)
                except Exception as e:
                    logger.warning(f"Error processing news item: {e}")
                    continue
            
            # Sort by timestamp (newest first)
            filtered_news.sort(key=lambda x: datetime.strptime(x.get('timestamp', '1/1/2000'), '%m/%d/%Y, %I:%M:%S %p'), reverse=True)
            
            return filtered_news[:limit]
        except Exception as e:
            logger.error(f"Error getting macro news for category {category}: {e}")
            return []

    def get_all_news(self, limit: int = 10, hours: int = 24):
        """Get all macro news"""
        try:
            # Calculate cutoff time
            cutoff_time = datetime.now() - timedelta(hours=hours)
            
            # Filter news by recency
            recent_news = []
            for item in self.news_database:
                try:
                    item_date = datetime.strptime(item.get('timestamp', '1/1/2000'), '%m/%d/%Y, %I:%M:%S %p')
                    if item_date >= cutoff_time:
                        recent_news.append(item)
                except Exception as e:
                    logger.warning(f"Error processing news item: {e}")
                    continue
            
            # Sort by timestamp (newest first)
            recent_news.sort(key=lambda x: datetime.strptime(x.get('timestamp', '1/1/2000'), '%m/%d/%Y, %I:%M:%S %p'), reverse=True)
            
            return recent_news[:limit]
        except Exception as e:
            logger.error(f"Error getting all macro news: {e}")
            return []

    def get_cached_news(self, limit: int = 10, category: str = None):
        """
        Get cached macro news without making external API calls
        
        Args:
            limit: Maximum number of news items to return
            category: Optional category filter (business, technology, federal-reserve, etc.)
            
        Returns:
            List of news items
        """
        try:
            logger.info(f"Getting cached macro news, category={category}, limit={limit}")
            
            # Return category-specific news if requested
            if category and category in list(self.macro_news_feeds.keys()):
                filtered_news = [item for item in self.news_database if item.get('category') == category]
                
                if not filtered_news:
                    logger.warning(f"No macro news articles available for category '{category}'")
                    return []
                    
                # Sort by timestamp (newest first)
                filtered_news.sort(key=lambda x: datetime.strptime(x.get('timestamp', '1/1/2000'), '%m/%d/%Y, %I:%M:%S %p'), reverse=True)
                return filtered_news[:limit]
            
            # Otherwise return all macro news
            if not self.news_database:
                logger.warning("No macro news articles available in cache")
                return []
                
            # Sort by timestamp (newest first)
            sorted_news = sorted(
                self.news_database,
                key=lambda x: datetime.strptime(x.get('timestamp', '1/1/2000'), '%m/%d/%Y, %I:%M:%S %p'),
                reverse=True
            )
            return sorted_news[:limit]
            
        except Exception as e:
            logger.error(f"Error getting cached macro news: {e}")
            return [] 