"""
Reddit service for fetching and processing Reddit posts
"""
import json
import time
import threading
import logging
import os
from datetime import datetime
from app.services.news.feed_fetcher import fetch_reddit_posts, detect_sentiment

logger = logging.getLogger(__name__)

class RedditService:
    def __init__(self):
        self.posts_database = {}
        self.is_running_flag = False
        self.update_thread = None
        self.subreddits = [
            'cryptocurrency',
            'CryptoMarkets',
            'Bitcoin',
            'ethereum',
            'defi',
            'altcoin'
        ]
        self.load_cached_data()

    def load_cached_data(self):
        """Load cached Reddit data from file"""
        try:
            cache_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data', 'reddit_posts.json')
            if os.path.exists(cache_path):
                with open(cache_path, 'r') as f:
                    self.posts_database = json.load(f)
                logger.info(f"Loaded Reddit posts for {len(self.posts_database)} subreddits from cache")
            else:
                logger.warning(f"Reddit cache file not found at {cache_path}")
                self.posts_database = {}
        except Exception as e:
            logger.error(f"Error loading Reddit posts cache: {e}")
            self.posts_database = {}

    def save_to_cache(self):
        """Save Reddit data to cache file"""
        try:
            cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data')
            os.makedirs(cache_dir, exist_ok=True)
            
            cache_path = os.path.join(cache_dir, 'reddit_posts.json')
            with open(cache_path, 'w') as f:
                json.dump(self.posts_database, f)
            logger.info(f"Saved Reddit posts for {len(self.posts_database)} subreddits to cache")
        except Exception as e:
            logger.error(f"Error saving Reddit posts to cache: {e}")

    def update_feeds(self, interval_minutes=30):
        """Update Reddit feeds for all configured subreddits"""
        while self.is_running_flag:
            try:
                for subreddit in self.subreddits:
                    try:
                        # Fetch posts for each sort method
                        for sort in ['hot', 'new', 'top']:
                            try:
                                posts = fetch_reddit_posts(subreddit=subreddit, limit=25, sort=sort)
                                if posts:
                                    if subreddit not in self.posts_database:
                                        self.posts_database[subreddit] = {}
                                    
                                    self.posts_database[subreddit][sort] = posts
                                    logger.info(f"Updated {len(posts)} {sort} posts for r/{subreddit}")
                                else:
                                    logger.warning(f"No {sort} posts retrieved from r/{subreddit}")
                                
                                # Short pause between requests to avoid rate limiting
                                time.sleep(2)
                            except Exception as e:
                                logger.error(f"Error fetching {sort} posts from r/{subreddit}: {e}")
                    except Exception as e:
                        logger.error(f"Error updating subreddit r/{subreddit}: {e}")
                
                # Save to cache after updating all subreddits
                self.save_to_cache()
                logger.info(f"Completed Reddit update cycle for {len(self.subreddits)} subreddits")
                
            except Exception as e:
                logger.error(f"Error in Reddit update cycle: {e}")
            
            # Wait before next update
            time.sleep(interval_minutes * 60)

    def start_update_thread(self):
        """Start the background thread for updating feeds"""
        self.is_running_flag = True
        self.update_thread = threading.Thread(target=self.update_feeds, daemon=True)
        self.update_thread.start()
        logger.info("Started Reddit update thread")

    def stop_update_thread(self):
        """Stop the background thread"""
        self.is_running_flag = False
        if self.update_thread:
            self.update_thread.join()
        logger.info("Stopped Reddit update thread")

    def is_running(self):
        """Check if the update thread is running"""
        return self.is_running_flag and self.update_thread and self.update_thread.is_alive()

    def get_posts(self, subreddit: str, sort: str = 'hot', limit: int = 25):
        """Get posts from a specific subreddit with a particular sort method"""
        try:
            # Check if we have cached data for this subreddit and sort method
            if (subreddit in self.posts_database and 
                sort in self.posts_database[subreddit] and 
                self.posts_database[subreddit][sort]):
                
                posts = self.posts_database[subreddit][sort]
                return posts[:limit]
            
            # If not in cache, fetch them directly
            logger.info(f"No cached posts for r/{subreddit} ({sort}), fetching directly")
            posts = fetch_reddit_posts(subreddit=subreddit, limit=limit, sort=sort)
            
            # Update the cache
            if posts:
                if subreddit not in self.posts_database:
                    self.posts_database[subreddit] = {}
                
                self.posts_database[subreddit][sort] = posts
                self.save_to_cache()
            
            return posts[:limit]
        except Exception as e:
            logger.error(f"Error getting posts from r/{subreddit}: {e}")
            return []

    def search_posts(self, query: str, limit: int = 25):
        """Search for posts containing the query across all cached subreddits"""
        try:
            if not query:
                return []
            
            # Normalize query for case-insensitive search
            query_lower = query.lower()
            
            # Search through all cached posts
            matching_posts = []
            
            for subreddit, sorts in self.posts_database.items():
                for sort_method, posts in sorts.items():
                    for post in posts:
                        # Search in title and content
                        if (query_lower in post.get('title', '').lower() or 
                            query_lower in post.get('content', '').lower()):
                            matching_posts.append(post)
            
            # Sort by score (upvotes) to show most popular matches first
            matching_posts.sort(key=lambda x: x.get('score', 0), reverse=True)
            
            return matching_posts[:limit]
        except Exception as e:
            logger.error(f"Error searching posts for '{query}': {e}")
            return []

    def get_cached_news(self, limit: int = 10, subreddit: str = None):
        """
        Get cached Reddit posts without making external API calls
        
        Args:
            limit: Maximum number of posts to return
            subreddit: Optional subreddit filter (cryptocurrency, Bitcoin, ethereum, etc.)
            
        Returns:
            List of Reddit posts formatted as news items
        """
        try:
            logger.info(f"Getting cached Reddit posts, subreddit={subreddit}, limit={limit}")
            
            all_posts = []
            
            # If a specific subreddit is requested
            if subreddit and subreddit in self.posts_database:
                # Combine posts from different sort methods (hot, new, top)
                for sort_method, posts in self.posts_database[subreddit].items():
                    for post in posts:
                        # Format the post as a news item
                        news_item = {
                            'title': post.get('title', ''),
                            'source': f"REDDIT r/{post.get('subreddit', subreddit)}",
                            'url': post.get('url', ''),
                            'timestamp': post.get('created_at', ''),
                            'summary': post.get('content', '')[:200] + '...' if len(post.get('content', '')) > 200 else post.get('content', ''),
                            'score': post.get('score', 0),
                            'author': post.get('author', 'unknown')
                        }
                        all_posts.append(news_item)
                
                if not all_posts:
                    logger.warning(f"No Reddit posts available for subreddit r/{subreddit}")
                    return []
            else:
                # Get posts from all subreddits
                for subreddit_name, sorts in self.posts_database.items():
                    for sort_method, posts in sorts.items():
                        # Only use 'hot' posts when getting from all subreddits to avoid duplicates
                        if sort_method == 'hot':
                            for post in posts:
                                news_item = {
                                    'title': post.get('title', ''),
                                    'source': f"REDDIT r/{post.get('subreddit', subreddit_name)}",
                                    'url': post.get('url', ''),
                                    'timestamp': post.get('created_at', ''),
                                    'summary': post.get('content', '')[:200] + '...' if len(post.get('content', '')) > 200 else post.get('content', ''),
                                    'score': post.get('score', 0),
                                    'author': post.get('author', 'unknown')
                                }
                                all_posts.append(news_item)
                
                if not all_posts:
                    logger.warning("No Reddit posts available in cache")
                    return []
            
            # Remove duplicates based on URL
            seen_urls = set()
            unique_posts = []
            for post in all_posts:
                if post['url'] not in seen_urls:
                    seen_urls.add(post['url'])
                    unique_posts.append(post)
            
            # Sort by score (upvotes) to show most popular posts first
            unique_posts.sort(key=lambda x: x.get('score', 0), reverse=True)
            
            return unique_posts[:limit]
        except Exception as e:
            logger.error(f"Error getting cached Reddit posts: {e}")
            return [] 