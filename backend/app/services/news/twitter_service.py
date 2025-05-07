"""
Twitter/X service for fetching and processing tweets
"""
import os
import json
import time
import threading
import logging
import httpx
from datetime import datetime
from typing import Dict, List, Optional, Any
from functools import lru_cache
import asyncio

from app.core.logging import get_logger
from app.models.news import TwitterPost

logger = get_logger(__name__)

class TwitterService:
    def __init__(self):
        self.bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        self.cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data')
        self.cache_file = os.path.join(self.cache_dir, 'twitter_posts.json')
        self.tweets_cache = {}
        self.rate_limited = False  # Flag to track rate limiting status
        self.rate_limit_reset = 0  # Timestamp when rate limit resets
        self.load_cached_data()
        
    def load_cached_data(self):
        """Load cached Twitter data from file"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r') as f:
                    self.tweets_cache = json.load(f)
                logger.info(f"Loaded Twitter posts for {len(self.tweets_cache)} users from cache")
            else:
                logger.warning(f"Twitter cache file not found at {self.cache_file}")
                self.tweets_cache = {}
        except Exception as e:
            logger.error(f"Error loading Twitter posts cache: {e}")
            self.tweets_cache = {}
            
    def save_to_cache(self):
        """Save Twitter data to cache file"""
        try:
            os.makedirs(self.cache_dir, exist_ok=True)
            
            with open(self.cache_file, 'w') as f:
                json.dump(self.tweets_cache, f)
            logger.info(f"Saved Twitter posts for {len(self.tweets_cache)} users to cache")
        except Exception as e:
            logger.error(f"Error saving Twitter posts to cache: {e}")
            
    def get_headers(self) -> Dict[str, str]:
        """Get the authorization headers for Twitter API requests"""
        if not self.bearer_token:
            logger.error("TWITTER_BEARER_TOKEN not found in environment variables")
            return {}
        
        return {
            "Authorization": f"Bearer {self.bearer_token}",
            "Content-Type": "application/json"
        }
    
    # Remove the @lru_cache decorator and implement manual caching
    async def get_user_id_by_username(self, username: str) -> Optional[str]:
        """Get Twitter user ID by username
        
        Args:
            username: Twitter handle without the @ symbol
            
        Returns:
            User ID string or None if not found
        """
        # Check in-memory cache for user ID
        username_lower = username.lower()  # Normalize username
        user_id_cache = self.tweets_cache.get("user_ids", {})
        
        if username_lower in user_id_cache:
            logger.info(f"Using cached user ID for @{username}")
            return user_id_cache[username_lower]
            
        if not self.bearer_token:
            logger.error("TWITTER_BEARER_TOKEN not set")
            return None
            
        # Check if we're currently rate limited
        current_time = time.time()
        if self.rate_limited and current_time < self.rate_limit_reset:
            wait_time = self.rate_limit_reset - current_time
            logger.warning(f"Twitter API is rate limited. Reset in {wait_time:.1f} seconds")
            return None
            
        try:
            logger.info(f"Fetching user ID for Twitter username: {username}")
            
            # Always create a new client - don't reuse
            client = None
            try:
                client = httpx.AsyncClient(timeout=10.0)
                url = f"https://api.twitter.com/2/users/by/username/{username}"
                response = await client.get(
                    url, 
                    headers=self.get_headers()
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data and "data" in data and "id" in data["data"]:
                        user_id = data["data"]["id"]
                        logger.info(f"Found user ID {user_id} for username {username}")
                        
                        # Update cache
                        if "user_ids" not in self.tweets_cache:
                            self.tweets_cache["user_ids"] = {}
                        self.tweets_cache["user_ids"][username_lower] = user_id
                        self.save_to_cache()
                        
                        # Reset rate limited flag if it was set
                        self.rate_limited = False
                        
                        return user_id
                    else:
                        logger.warning(f"No user ID found in response for {username}")
                elif response.status_code == 404:
                    logger.warning(f"Twitter username not found: {username}")
                elif response.status_code == 429:
                    logger.error(f"Twitter API rate limit exceeded when looking up {username}")
                    
                    # Set rate limited flag and estimate reset time (15 minutes from now)
                    self.rate_limited = True
                    self.rate_limit_reset = current_time + (15 * 60)
                    
                    # Check for rate limit headers
                    if 'x-rate-limit-reset' in response.headers:
                        try:
                            self.rate_limit_reset = int(response.headers['x-rate-limit-reset'])
                        except (ValueError, TypeError):
                            pass  # Use default if header parsing fails
                            
                    # Sleep to respect rate limits
                    await asyncio.sleep(2)
                else:
                    logger.error(f"Error fetching user ID for {username}: HTTP {response.status_code}")
                    logger.error(f"Response: {response.text}")
            finally:
                # Always close the client to free resources
                if client:
                    await client.aclose()
                    
        except Exception as e:
            logger.error(f"Exception when fetching Twitter user ID for {username}: {e}")
            
        return None
        
    async def get_user_tweets(self, user_id: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """Get tweets from a specific user by ID
        
        Args:
            user_id: Twitter user ID
            max_results: Maximum number of tweets to fetch (default 10)
            
        Returns:
            List of tweet objects
        """
        if not self.bearer_token:
            logger.error("TWITTER_BEARER_TOKEN not set")
            return []
            
        # Check if we're currently rate limited
        current_time = time.time()
        if self.rate_limited and current_time < self.rate_limit_reset:
            wait_time = self.rate_limit_reset - current_time
            logger.warning(f"Twitter API is rate limited. Reset in {wait_time:.1f} seconds")
            
            # Check cache for user tweets
            cache_key = f"user_{user_id}"
            cache_entry = self.tweets_cache.get(cache_key, {})
            if "tweets" in cache_entry:
                logger.info(f"Using cached tweets for user_id {user_id} due to rate limiting")
                return cache_entry["tweets"]
            
            return []
            
        # Check cache for user tweets
        cache_key = f"user_{user_id}"
        cache_entry = self.tweets_cache.get(cache_key, {})
        cache_timestamp = cache_entry.get("timestamp", 0)
        cache_ttl = 60 * 60  # 60 minutes cache TTL
        
        # If we have fresh cached data, use it
        if current_time - cache_timestamp < cache_ttl and "tweets" in cache_entry:
            logger.info(f"Using cached tweets for user_id {user_id}")
            return cache_entry["tweets"]
            
        try:
            logger.info(f"Fetching tweets for user ID: {user_id}")
            
            # Define tweet fields to retrieve
            tweet_fields = "created_at,public_metrics,attachments"
            expansions = "author_id,attachments.media_keys"
            media_fields = "url,preview_image_url,type"
            user_fields = "name,username"
            
            # Retry logic with exponential backoff
            max_retries = 3
            retry_delay = 1  # Initial delay in seconds
            
            for retry in range(max_retries):
                client = None
                try:
                    # Create a new client for each request
                    client = httpx.AsyncClient(timeout=10.0)
                    url = f"https://api.twitter.com/2/users/{user_id}/tweets"
                    response = await client.get(
                        url,
                        headers=self.get_headers(),
                        params={
                            "max_results": max_results,
                            "tweet.fields": tweet_fields,
                            "expansions": expansions,
                            "media.fields": media_fields,
                            "user.fields": user_fields
                        }
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        processed_tweets = self._process_tweets_response(data)
                        
                        # Update cache
                        self.tweets_cache[cache_key] = {
                            "timestamp": current_time,
                            "tweets": processed_tweets
                        }
                        self.save_to_cache()
                        
                        # Reset rate limited flag if it was set
                        self.rate_limited = False
                        
                        return processed_tweets
                    elif response.status_code == 404:
                        logger.warning(f"Twitter user ID not found: {user_id}")
                        return []
                    elif response.status_code == 429:
                        # Set rate limited flag and estimate reset time (15 minutes from now)
                        self.rate_limited = True
                        self.rate_limit_reset = current_time + (15 * 60)
                        
                        # Check for rate limit headers
                        if 'x-rate-limit-reset' in response.headers:
                            try:
                                self.rate_limit_reset = int(response.headers['x-rate-limit-reset'])
                            except (ValueError, TypeError):
                                pass  # Use default if header parsing fails
                        
                        wait_time = retry_delay * (2 ** retry)
                        logger.warning(f"Twitter API rate limit exceeded. Retrying in {wait_time} seconds...")
                        await asyncio.sleep(wait_time)
                        continue  # Try again after waiting
                    else:
                        logger.error(f"Error fetching tweets for {user_id}: HTTP {response.status_code}")
                        logger.error(f"Response: {response.text}")
                        
                        # If we have a backup in cache, use it even if it's stale
                        if "tweets" in cache_entry:
                            logger.info(f"Using stale cached tweets for user_id {user_id} due to API error")
                            return cache_entry["tweets"]
                        
                        return []
                finally:
                    # Always close the client to free resources
                    if client:
                        await client.aclose()
                
            logger.error(f"Failed to fetch tweets after {max_retries} retries")
            
            # If we have a backup in cache, use it even if it's stale
            if "tweets" in cache_entry:
                logger.info(f"Using stale cached tweets for user_id {user_id} after max retries")
                return cache_entry["tweets"]
                
            return []
            
        except Exception as e:
            logger.error(f"Exception when fetching tweets for {user_id}: {e}")
            
            # If we have a backup in cache, use it even if it's stale
            if "tweets" in cache_entry:
                logger.info(f"Using stale cached tweets for user_id {user_id} due to exception")
                return cache_entry["tweets"]
                
            return []
    
    def _process_tweets_response(self, response_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process the Twitter API response data
        
        Args:
            response_data: Twitter API response JSON
            
        Returns:
            List of processed tweet objects
        """
        if not response_data or "data" not in response_data:
            return []
            
        tweets = response_data["data"]
        includes = response_data.get("includes", {})
        users = {user["id"]: user for user in includes.get("users", [])}
        media = {media["media_key"]: media for media in includes.get("media", [])}
        
        processed_tweets = []
        
        for tweet in tweets:
            author_id = tweet.get("author_id")
            user = users.get(author_id, {})
            
            # Process media attachments if present
            tweet_media = []
            if "attachments" in tweet and "media_keys" in tweet["attachments"]:
                for media_key in tweet["attachments"]["media_keys"]:
                    if media_key in media:
                        tweet_media.append(media[media_key])
            
            processed_tweet = {
                "id": tweet["id"],
                "text": tweet["text"],
                "author_id": author_id,
                "author_name": user.get("name", ""),
                "author_username": user.get("username", ""),
                "created_at": tweet.get("created_at"),
                "public_metrics": tweet.get("public_metrics", {}),
                "media": tweet_media if tweet_media else None
            }
            
            # Extract specific metrics for easier access
            if "public_metrics" in tweet:
                metrics = tweet["public_metrics"]
                processed_tweet["like_count"] = metrics.get("like_count", 0)
                processed_tweet["retweet_count"] = metrics.get("retweet_count", 0)
                processed_tweet["reply_count"] = metrics.get("reply_count", 0)
                processed_tweet["quote_count"] = metrics.get("quote_count", 0)
            
            processed_tweets.append(processed_tweet)
            
        return processed_tweets
    
    async def get_tweets_by_username(self, username: str, max_results: int = 10) -> List[TwitterPost]:
        """Get tweets from a user by their username/handle
        
        Args:
            username: Twitter handle without the @ symbol
            max_results: Maximum number of tweets to fetch
            
        Returns:
            List of TwitterPost objects
        """
        try:
            # Remove @ if included in the username
            if username.startswith('@'):
                username = username[1:]
                
            # Normalize username
            username = username.lower()
                
            # Check cache first for the normalized username
            current_time = time.time()
            cache_key = f"username_{username}"
            cache_entry = self.tweets_cache.get(cache_key, {})
            cache_timestamp = cache_entry.get("timestamp", 0)
            cache_ttl = 60 * 60  # 60 minutes cache TTL (increased from 30 minutes)
            
            # If we have fresh cached data, use it
            if current_time - cache_timestamp < cache_ttl and "tweets" in cache_entry:
                logger.info(f"Using cached tweets for @{username}")
                cached_tweets = cache_entry["tweets"]
                return [TwitterPost(**tweet) for tweet in cached_tweets[:max_results]]
            
            # Check if we're currently rate limited
            if self.rate_limited and current_time < self.rate_limit_reset:
                wait_time = self.rate_limit_reset - current_time
                logger.warning(f"Twitter API is rate limited. Reset in {wait_time:.1f} seconds")
                # Return any stale data we might have rather than empty
                if "tweets" in cache_entry:
                    logger.info(f"Using stale cached tweets for @{username} due to rate limiting")
                    cached_tweets = cache_entry["tweets"]
                    return [TwitterPost(**tweet) for tweet in cached_tweets[:max_results]]
                return []
            
            # If not in cache or cache is stale, fetch from API
            # Get user ID - fresh coroutine each time
            user_id = await self.get_user_id_by_username(username)
            if not user_id:
                logger.warning(f"Could not find Twitter user: @{username}")
                # Return any stale data we might have rather than empty
                if "tweets" in cache_entry:
                    logger.info(f"Using stale cached tweets for @{username} as user ID lookup failed")
                    cached_tweets = cache_entry["tweets"]
                    return [TwitterPost(**tweet) for tweet in cached_tweets[:max_results]]
                return []
            
            # Get tweets - fresh coroutine each time
            tweets = await self.get_user_tweets(user_id, max_results)
            if not tweets:
                logger.warning(f"No tweets found for @{username}")
                # Return any stale data we might have rather than empty
                if "tweets" in cache_entry:
                    logger.info(f"Using stale cached tweets for @{username} as no new tweets found")
                    cached_tweets = cache_entry["tweets"]
                    return [TwitterPost(**tweet) for tweet in cached_tweets[:max_results]]
                return []
                
            # Update cache with username-specific key
            self.tweets_cache[cache_key] = {
                "timestamp": current_time,
                "tweets": tweets
            }
            self.save_to_cache()
            
            # Convert to TwitterPost objects
            return [TwitterPost(**tweet) for tweet in tweets]
            
        except Exception as e:
            logger.error(f"Error getting tweets for @{username}: {e}")
            # Check if we have any cached data we can return
            cache_key = f"username_{username.lower()}"
            cache_entry = self.tweets_cache.get(cache_key, {})
            if "tweets" in cache_entry:
                logger.info(f"Using cached tweets for @{username} due to error")
                cached_tweets = cache_entry["tweets"]
                return [TwitterPost(**tweet) for tweet in cached_tweets[:max_results]]
            return []
