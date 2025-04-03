"""
Feed fetcher utilities for news services
"""
import requests
import feedparser
import time
import logging
import re
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
import hashlib

logger = logging.getLogger(__name__)

def fetch_rss(url: str, source: str = None) -> List[Dict[str, Any]]:
    """
    Fetch and parse an RSS feed
    
    Args:
        url: URL of the RSS feed
        source: Name of the source
        
    Returns:
        List of parsed news items
    """
    try:
        logger.info(f"Fetching RSS feed from {url}")
        
        # Use requests to get the RSS data with a proper user agent
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
        
        # Add timeout to prevent hanging on non-responsive feeds
        response = requests.get(url, headers=headers, timeout=15)
        
        if response.status_code != 200:
            logger.error(f"Error fetching RSS feed from {url}: Status code {response.status_code}")
            return []
            
        # Log the beginning of the response content to help debug feed issues
        content_preview = response.content[:500].decode('utf-8', errors='ignore')
        logger.debug(f"Response from {url} begins with: {content_preview}...")
            
        # Parse the feed using the response content
        feed = feedparser.parse(response.content)
        
        if not feed.entries:
            logger.warning(f"No entries found in feed from {url}")
            # Check if the feed has an error
            if hasattr(feed, 'bozo') and feed.bozo:
                logger.error(f"Feed parsing error from {url}: {feed.get('bozo_exception', 'Unknown error')}")
            return []
        
        # Log success information before processing entries
        logger.info(f"Successfully parsed feed from {url}, found {len(feed.entries)} entries")
        
        # Process entries
        items = []
        for entry in feed.entries:
            try:
                # Extract publication date
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    published = time.strftime('%m/%d/%Y, %I:%M:%S %p', entry.published_parsed)
                elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    published = time.strftime('%m/%d/%Y, %I:%M:%S %p', entry.updated_parsed)
                else:
                    published = datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p')
                
                # Extract content
                if hasattr(entry, 'content') and entry.content:
                    content = entry.content[0].value
                elif hasattr(entry, 'summary'):
                    content = entry.summary
                elif hasattr(entry, 'description'):
                    content = entry.description
                else:
                    content = ""
                
                # Clean content
                clean_content = clean_html(content)
                
                # Detect sentiment
                sentiment = detect_sentiment(entry.title + " " + clean_content)
                
                # Create a unique ID
                entry_id = entry.id if hasattr(entry, 'id') else entry.link if hasattr(entry, 'link') else entry.title
                item_id = hashlib.md5(f"{source}-{entry_id}".encode()).hexdigest()
                
                # Get link, ensuring it's a real URL
                link = entry.link if hasattr(entry, 'link') else ""
                if not link and hasattr(entry, 'guid'):
                    link = entry.guid
                
                # Ensure URL is properly formatted
                if link and not (link.startswith('http://') or link.startswith('https://')):
                    link = f"https://{link}" if not link.startswith('//') else f"https:{link}"
                
                # Fallback URL for Google News or other aggregators
                if not link and 'google.com' in url:
                    # Extract possible URL from content or try building one from title
                    content_urls = re.findall(r'https?://[^\s<>"\']+', clean_content)
                    if content_urls:
                        link = content_urls[0]
                    else:
                        # Create a Google search URL using the title
                        query = entry.title.replace(' ', '+')
                        link = f"https://www.google.com/search?q={query}"
                
                # Special handling for Messari content
                if 'messari' in url.lower():
                    # Set source explicitly for Messari content
                    source_name = "MESSARI RESEARCH" if "research" in url.lower() else "MESSARI"
                    
                    # Add messari-specific keywords and related coins
                    related_coins = []
                    if re.search(r'\b(btc|bitcoin)\b', entry.title.lower()):
                        related_coins.append("BTC")
                    if re.search(r'\b(eth|ethereum)\b', entry.title.lower()):
                        related_coins.append("ETH")
                else:
                    source_name = source or ""
                    related_coins = []
                
                # Create item
                item = {
                    'id': item_id,
                    'title': entry.title,
                    'link': link,
                    'url': link,  # Add explicit url field
                    'timestamp': published,
                    'content': clean_content,
                    'source': source_name,
                    'sentiment': sentiment,
                    'relatedCoins': related_coins
                }
                
                items.append(item)
            except Exception as e:
                logger.error(f"Error processing feed entry from {url}: {str(e)}")
                continue
        
        logger.info(f"Fetched {len(items)} items from {url}")
        return items
    except Exception as e:
        logger.error(f"Error fetching RSS feed from {url}: {str(e)}")
        return []

def clean_html(html_text: str) -> str:
    """
    Remove HTML tags from text
    
    Args:
        html_text: Text with HTML tags
        
    Returns:
        Clean text without HTML tags
    """
    if not html_text:
        return ""
    
    try:
        # Parse HTML and get text
        soup = BeautifulSoup(html_text, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    except Exception as e:
        logger.error(f"Error cleaning HTML: {e}")
        # If BeautifulSoup fails, try a simple regex
        return re.sub(r'<[^>]+>', '', html_text)

def detect_sentiment(text: str) -> str:
    """
    Detect sentiment of text (POSITIVE, NEGATIVE, NEUTRAL)
    This is a simple implementation that could be replaced with a more sophisticated model
    
    Args:
        text: Text to analyze
        
    Returns:
        Sentiment as string
    """
    # List of positive and negative words
    positive_words = ['gain', 'gains', 'bull', 'bullish', 'surge', 'surged', 'rally', 'rallies',
                     'positive', 'up', 'upward', 'rise', 'rising', 'rose', 'high', 'higher',
                     'growth', 'grow', 'grew', 'increase', 'increased', 'support']
    
    negative_words = ['loss', 'losses', 'bear', 'bearish', 'crash', 'crashed', 'drop', 'dropped',
                     'negative', 'down', 'downward', 'fall', 'falling', 'fell', 'low', 'lower',
                     'decrease', 'decreased', 'resistance']
    
    # Convert to lowercase for case-insensitive matching
    text_lower = text.lower()
    
    # Count positive and negative words
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    # Determine sentiment
    if positive_count > negative_count:
        return "POSITIVE"
    elif negative_count > positive_count:
        return "NEGATIVE"
    else:
        return "NEUTRAL"

def fetch_reddit_posts(subreddit: str, limit: int = 20, sort: str = 'hot') -> List[Dict[str, Any]]:
    """
    Fetch posts from a Reddit subreddit using the JSON API
    
    Args:
        subreddit: Name of the subreddit
        limit: Number of posts to fetch
        sort: Sorting method (hot, new, top)
        
    Returns:
        List of Reddit posts
    """
    try:
        logger.info(f"Fetching Reddit posts from r/{subreddit} sorted by {sort}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; CryptoPortfolioTracker/1.0)'
        }
        
        url = f"https://www.reddit.com/r/{subreddit}/{sort}.json?limit={limit}"
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            logger.error(f"Error fetching Reddit posts: Status code {response.status_code}")
            return []
        
        data = response.json()
        
        if 'data' not in data or 'children' not in data['data']:
            logger.warning(f"Invalid response format from Reddit API")
            return []
        
        posts = []
        for post_data in data['data']['children']:
            try:
                post = post_data['data']
                
                # Process timestamp
                created_time = datetime.fromtimestamp(post.get('created_utc', time.time()))
                timestamp = created_time.strftime('%m/%d/%Y, %I:%M:%S %p')
                
                # Detect sentiment
                sentiment = detect_sentiment(post.get('title', '') + ' ' + post.get('selftext', ''))
                
                # Create post object
                reddit_post = {
                    'id': post.get('id', f"reddit-{subreddit}-{hash(post.get('title', ''))}"),
                    'title': post.get('title', 'No Title'),
                    'author': post.get('author', 'unknown'),
                    'content': post.get('selftext', ''),
                    'url': post.get('url', ''),
                    'permalink': f"https://www.reddit.com{post.get('permalink', '')}",
                    'score': post.get('score', 0),
                    'num_comments': post.get('num_comments', 0),
                    'created_utc': post.get('created_utc', time.time()),
                    'timestamp': timestamp,
                    'subreddit': subreddit,
                    'sentiment': sentiment
                }
                
                posts.append(reddit_post)
            except Exception as e:
                logger.error(f"Error processing Reddit post: {e}")
                continue
        
        logger.info(f"Fetched {len(posts)} posts from r/{subreddit}")
        return posts
    except Exception as e:
        logger.error(f"Error fetching Reddit posts: {e}")
        return [] 