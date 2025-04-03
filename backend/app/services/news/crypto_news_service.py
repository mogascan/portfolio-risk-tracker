import json
import time
import threading
import logging
import os
from datetime import datetime
from app.services.news.feed_fetcher import fetch_rss, clean_html, detect_sentiment

logger = logging.getLogger(__name__)

class CryptoNewsService:
    def __init__(self):
        self.news_database = []
        self.is_running_flag = False
        self.update_thread = None
        self.crypto_feeds = [
            {'url': 'https://cointelegraph.com/rss', 'source': 'COINTELEGRAPH'},
            {'url': 'https://www.coindesk.com/arc/outboundfeeds/rss', 'source': 'COINDESK'},
            {'url': 'https://decrypt.co/feed', 'source': 'DECRYPT'},
            {'url': 'https://www.theblock.co/rss.xml', 'source': 'THE BLOCK'},
            {'url': 'https://cryptoslate.com/feed/', 'source': 'CRYPTOSLATE'},
            {'url': 'https://bitcoinmagazine.com/.rss/full/', 'source': 'BITCOIN MAGAZINE'},
            # Add more Bitcoin-specific feeds
            {'url': 'https://bitcoinist.com/feed/', 'source': 'BITCOINIST'},
            # Fix Messari feeds with valid URLs
            {'url': 'https://messari.io/rss', 'source': 'MESSARI'}, 
            {'url': 'https://messari.io/research/feed', 'source': 'MESSARI RESEARCH'}, 
            {'url': 'https://news.bitcoin.com/feed/', 'source': 'BITCOIN.COM'},
            {'url': 'https://btcmanager.com/feed/', 'source': 'BTC MANAGER'}
        ]
        self.bitcoin_news = []  # Dedicated storage for Bitcoin-specific news
        self.messari_news = []  # Dedicated storage for Messari-specific news
        self.load_cached_data()

    def load_cached_data(self):
        """Load cached news data from file"""
        try:
            base_data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data')
            crypto_cache_path = os.path.join(base_data_dir, 'crypto_news.json')
            
            # Load general crypto news
            if os.path.exists(crypto_cache_path):
                with open(crypto_cache_path, 'r') as f:
                    self.news_database = json.load(f)
                logger.info(f"Loaded {len(self.news_database)} crypto news items from cache")
            else:
                logger.warning(f"Crypto news cache file not found at {crypto_cache_path}")
                self.news_database = []
            
            # Load Bitcoin-specific news
            bitcoin_cache_path = os.path.join(base_data_dir, 'bitcoin_news.json')
            if os.path.exists(bitcoin_cache_path):
                with open(bitcoin_cache_path, 'r') as f:
                    self.bitcoin_news = json.load(f)
                logger.info(f"Loaded {len(self.bitcoin_news)} Bitcoin-specific news items from cache")
            else:
                logger.warning(f"Bitcoin news cache file not found at {bitcoin_cache_path}")
                self.bitcoin_news = []
                
            # Load Messari-specific news
            messari_cache_path = os.path.join(base_data_dir, 'messari_news.json')
            if os.path.exists(messari_cache_path):
                with open(messari_cache_path, 'r') as f:
                    self.messari_news = json.load(f)
                logger.info(f"Loaded {len(self.messari_news)} Messari-specific news items from cache")
            else:
                logger.warning(f"Messari news cache file not found at {messari_cache_path}")
                self.messari_news = []
                
        except Exception as e:
            logger.error(f"Error loading news cache: {e}")
            self.news_database = []
            self.bitcoin_news = []
            self.messari_news = []

    def save_to_cache(self):
        """Save news data to cache file"""
        try:
            cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data')
            os.makedirs(cache_dir, exist_ok=True)
            
            # Save general crypto news
            crypto_cache_path = os.path.join(cache_dir, 'crypto_news.json')
            with open(crypto_cache_path, 'w') as f:
                json.dump(self.news_database, f)
            logger.info(f"Saved {len(self.news_database)} crypto news items to cache")
            
            # Save Bitcoin-specific news
            bitcoin_cache_path = os.path.join(cache_dir, 'bitcoin_news.json')
            with open(bitcoin_cache_path, 'w') as f:
                json.dump(self.bitcoin_news, f)
            logger.info(f"Saved {len(self.bitcoin_news)} Bitcoin-specific news items to cache")
            
            # Save Messari-specific news
            messari_cache_path = os.path.join(cache_dir, 'messari_news.json')
            with open(messari_cache_path, 'w') as f:
                json.dump(self.messari_news, f)
            logger.info(f"Saved {len(self.messari_news)} Messari-specific news items to cache")
            
        except Exception as e:
            logger.error(f"Error saving news to cache: {e}")

    def update_feeds(self, interval_minutes=10):
        """Update crypto news feeds"""
        while self.is_running_flag:
            try:
                all_news = []
                for feed in self.crypto_feeds:
                    try:
                        logger.info(f"Attempting to fetch RSS feed from {feed['url']}")
                        feed_news = fetch_rss(feed['url'], feed['source'])
                        if feed_news:
                            all_news.extend(feed_news)
                            logger.info(f"Retrieved {len(feed_news)} articles from {feed['source']}")
                        else:
                            logger.warning(f"No articles retrieved from {feed['source']}")
                    except Exception as e:
                        logger.error(f"Error fetching from {feed['source']} ({feed['url']}): {e}")
                    time.sleep(1)  # Short pause between feeds
                
                if all_news:
                    # Sort by newest first
                    all_news.sort(key=lambda x: datetime.strptime(x['timestamp'], '%m/%d/%Y, %I:%M:%S %p'), reverse=True)
                    
                    # Deduplicate based on title similarity
                    unique_news = []
                    seen_titles = set()
                    for item in all_news:
                        title_lower = item['title'].lower()
                        if not any(title_lower in seen_title or seen_title in title_lower for seen_title in seen_titles):
                            seen_titles.add(title_lower)
                            unique_news.append(item)
                    
                    # Update the database
                    self.news_database = unique_news
                    
                    # Update Bitcoin-specific news
                    bitcoin_keywords = ["bitcoin", "btc", "satoshi", "lightning network", "bitcoin halving"]
                    self.bitcoin_news = [
                        item for item in unique_news 
                        if any(keyword in item['title'].lower() or 
                              keyword in item.get('content', '').lower() 
                              for keyword in bitcoin_keywords) or
                        "BITCOIN" in item['source']
                    ]
                    
                    # Update Messari-specific news
                    messari_keywords = ["messari", "research report", "crypto research"]
                    self.messari_news = [
                        item for item in unique_news 
                        if any(keyword in item['title'].lower() or 
                              keyword in item.get('content', '').lower() 
                              for keyword in messari_keywords) or
                        "MESSARI" in item['source']
                    ]
                    
                    self.save_to_cache()
                    
                    logger.info(f"Updated news database with {len(unique_news)} unique articles")
                    logger.info(f"Updated Bitcoin news with {len(self.bitcoin_news)} articles")
                    logger.info(f"Updated Messari news with {len(self.messari_news)} articles")
                else:
                    logger.warning("No news articles were retrieved from any feed")
                
            except Exception as e:
                logger.error(f"Error updating crypto news feeds: {e}")
            
            # Wait before next update
            time.sleep(interval_minutes * 60)

    def start_update_thread(self):
        """Start the background thread for updating feeds"""
        self.is_running_flag = True
        self.update_thread = threading.Thread(target=self.update_feeds, daemon=True)
        self.update_thread.start()
        logger.info("Started crypto news update thread")

    def stop_update_thread(self):
        """Stop the background thread"""
        self.is_running_flag = False
        if self.update_thread:
            self.update_thread.join()
        logger.info("Stopped crypto news update thread")

    def is_running(self):
        """Check if the update thread is running"""
        return self.is_running_flag and self.update_thread and self.update_thread.is_alive()

    def get_news(self, limit: int = 10, filter_term: str = None):
        """Get latest crypto news with optional filtering"""
        try:
            if not self.news_database:
                logger.warning("No news articles available in database")
                return []
                
            if filter_term:
                filter_term = filter_term.lower()
                filtered_news = [
                    news for news in self.news_database 
                    if filter_term in news['title'].lower() or 
                       filter_term in news.get('content', '').lower() or
                       filter_term in news.get('summary', '').lower()
                ]
                return filtered_news[:limit]
            return self.news_database[:limit]
        except Exception as e:
            logger.error(f"Error getting crypto news: {e}")
            return []

    def get_news_by_asset(self, asset: str, limit: int = 10):
        """Get news specific to a particular asset"""
        try:
            if not self.news_database:
                logger.warning("No news articles available in database")
                return []
                
            asset_terms = [asset.lower(), asset.upper()]
            filtered_news = []
            
            for item in self.news_database:
                title = item['title'].lower()
                summary = item.get('summary', '').lower()
                
                for term in asset_terms:
                    if (f" {term} " in f" {title} " or 
                        f" {term} " in f" {summary} " or
                        f" {term}." in f" {title}" or
                        f" {term}." in f" {summary}" or
                        f" {term}," in f" {title}" or
                        f" {term}," in f" {summary}" or
                        title.startswith(f"{term} ") or
                        summary.startswith(f"{term} ")):
                        
                        filtered_news.append(item)
                        break
            
            return filtered_news[:limit]
        except Exception as e:
            logger.error(f"Error getting news for asset {asset}: {e}")
            return []

    def get_cached_news(self, limit: int = 10, category: str = None):
        """
        Get cached news without hitting external APIs
        
        Args:
            limit: Maximum number of news items to return
            category: Optional category filter (bitcoin, messari)
            
        Returns:
            List of news items
        """
        try:
            logger.info(f"Getting cached news, category={category}, limit={limit}")
            
            # Return category-specific news if requested
            if category == "bitcoin":
                if not self.bitcoin_news:
                    logger.warning("No Bitcoin news articles available in cache")
                    return []
                return self.bitcoin_news[:limit]
            
            elif category == "messari":
                if not self.messari_news:
                    logger.warning("No Messari news articles available in cache")
                    return []
                return self.messari_news[:limit]
            
            # Otherwise return general crypto news
            if not self.news_database:
                logger.warning("No news articles available in cache")
                return []
                
            # Return the most recent news items
            return self.news_database[:limit]
            
        except Exception as e:
            logger.error(f"Error getting cached news: {e}")
            return [] 