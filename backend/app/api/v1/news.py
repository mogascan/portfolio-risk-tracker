"""
News API endpoints
"""
from fastapi import APIRouter, Query, HTTPException, Depends, Path # type: ignore
from typing import List, Optional, Dict, Any
import os
import json
import logging
import random
import time
from datetime import datetime

from app.models.news import (
    CryptoNewsItem, MacroNewsItem, NewsResponse, 
    CryptoNewsResponse, MacroNewsResponse, SocialMediaPost, SocialMediaResponse, RedditPost
)
from app.services.news import crypto_news_service, macro_news_service, reddit_service
from app.core.logging import get_logger

# Initialize logger
logger = get_logger(__name__)

# Create router
router = APIRouter(prefix="/news", tags=["News"])

# Helper to load mock data when needed
def load_mock_data(filename):
    try:
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                return json.load(f)
        # Return empty list if file doesn't exist
        return []
    except Exception as e:
        logger.error(f"Error loading mock data from {filename}: {e}")
        return []

@router.get("/crypto", response_model=CryptoNewsResponse)
async def get_crypto_news(
    limit: int = Query(20, description="Number of news items to return"),
    page: int = Query(1, description="Page number"),
    query: Optional[str] = Query(None, description="Filter by keyword"),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment"),
    symbol: Optional[str] = Query(None, description="Filter by related coin")
):
    """
    Get cryptocurrency news items
    """
    try:
        logger.info(f"Fetching crypto news: limit={limit}, page={page}, query={query}, sentiment={sentiment}, symbol={symbol}")
        
        # Get news from the service
        news_data = crypto_news_service.get_news(limit=limit, filter_term=query)
        
        # Apply additional filters
        if sentiment:
            news_data = [
                item for item in news_data 
                if item.get("sentiment") == sentiment.upper()
            ]
        
        if symbol:
            news_data = crypto_news_service.get_news_by_asset(symbol, limit=limit)
        
        # Calculate pagination
        total_count = len(news_data)
        start_idx = (page - 1) * limit
        end_idx = min(start_idx + limit, total_count)
        paginated_data = news_data[start_idx:end_idx]
        
        # Convert to Pydantic models
        news_items = []
        for item in paginated_data:
            try:
                news_items.append(CryptoNewsItem(
                    id=item.get("id", f"crypto-{random.randint(1000, 9999)}"),
                    title=item.get("title", ""),
                    summary=item.get("summary", item.get("content", "")),
                    source=item.get("source", ""),
                    url=item.get("url", item.get("link", "https://example.com")),
                    published_at=datetime.now(),  # RSS feed timestamp is already formatted
                    timestamp=item.get("timestamp", datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p")),
                    sentiment=item.get("sentiment"),
                    related_coins=item.get("relatedCoins", [])
                ))
            except Exception as e:
                logger.error(f"Error converting news item: {e}")
        
        return CryptoNewsResponse(
            items=news_items,
            total_count=total_count,
            page=page,
            page_size=limit
        )
    
    except Exception as e:
        logger.error(f"Error fetching crypto news: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching crypto news: {str(e)}")

@router.get("/macro", response_model=MacroNewsResponse)
async def get_macro_news(
    category: str = Query("business", description="Economic news category"),
    limit: int = Query(20, description="Number of news items to return"),
    page: int = Query(1, description="Page number")
):
    """
    Get macroeconomic news items
    """
    try:
        logger.info(f"Fetching macro news: category={category}, limit={limit}, page={page}")
        
        # Get news from the service
        news_data = macro_news_service.get_news(category=category, limit=limit)
        
        # Calculate pagination
        total_count = len(news_data)
        start_idx = (page - 1) * limit
        end_idx = min(start_idx + limit, total_count)
        paginated_data = news_data[start_idx:end_idx]
        
        # Convert to Pydantic models
        news_items = []
        for item in paginated_data:
            try:
                news_items.append(MacroNewsItem(
                    id=item.get("id", f"macro-{random.randint(1000, 9999)}"),
                    title=item.get("title", ""),
                    summary=item.get("summary", item.get("content", "")),
                    source=item.get("source", ""),
                    url=item.get("url", item.get("link", "https://example.com")),
                    published_at=datetime.now(),  # RSS feed timestamp is already formatted
                    timestamp=item.get("timestamp", datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p")),
                    sentiment=item.get("sentiment", "NEUTRAL"),
                    category=item.get("category", category)
                ))
            except Exception as e:
                logger.error(f"Error converting news item: {e}")
        
        return MacroNewsResponse(
            items=news_items,
            total_count=total_count,
            page=page,
            page_size=limit
        )
    
    except Exception as e:
        logger.error(f"Error fetching macro news: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching macro news: {str(e)}")

@router.get("/bitcoin", response_model=CryptoNewsResponse)
async def get_bitcoin_news(
    limit: int = Query(20, description="Number of news items to return"),
    page: int = Query(1, description="Page number")
):
    """
    Get Bitcoin-specific news items
    """
    try:
        logger.info(f"Fetching Bitcoin news: limit={limit}, page={page}")
        
        # Use dedicated Bitcoin news collection directly
        bitcoin_news = crypto_news_service.bitcoin_news
        
        if not bitcoin_news:
            # Fallback to filtering general crypto news if no dedicated Bitcoin news
            logger.info("No dedicated Bitcoin news found, falling back to filtered crypto news")
            return await get_crypto_news(limit=limit, page=page, symbol="BTC")
        
        # Calculate pagination
        total_count = len(bitcoin_news)
        start_idx = (page - 1) * limit
        end_idx = min(start_idx + limit, total_count)
        paginated_data = bitcoin_news[start_idx:end_idx]
        
        # Convert to Pydantic models
        news_items = []
        for item in paginated_data:
            try:
                news_items.append(CryptoNewsItem(
                    id=item.get("id", f"bitcoin-{random.randint(1000, 9999)}"),
                    title=item.get("title", ""),
                    summary=item.get("summary", item.get("content", "")),
                    source=item.get("source", "Bitcoin News"),
                    url=item.get("url", item.get("link", "https://example.com")),
                    published_at=datetime.now(),
                    timestamp=item.get("timestamp", datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p")),
                    sentiment=item.get("sentiment"),
                    related_coins=item.get("relatedCoins", ["BTC"])
                ))
            except Exception as e:
                logger.error(f"Error converting Bitcoin news item: {e}")
        
        return CryptoNewsResponse(
            items=news_items,
            total_count=total_count,
            page=page,
            page_size=limit
        )
    
    except Exception as e:
        logger.error(f"Error fetching Bitcoin news: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching Bitcoin news: {str(e)}")

@router.get("/asset/{symbol}", response_model=CryptoNewsResponse)
async def get_asset_news(
    symbol: str = Path(..., description="Asset symbol"),
    limit: int = Query(20, description="Number of news items to return"),
    page: int = Query(1, description="Page number")
):
    """
    Get news for a specific asset
    """
    try:
        # Use the symbol filter on the crypto news endpoint
        return await get_crypto_news(limit=limit, page=page, symbol=symbol)
    
    except Exception as e:
        logger.error(f"Error fetching asset news for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching asset news: {str(e)}")

@router.get("/reddit/{subreddit}/{sort}", response_model=SocialMediaResponse)
async def proxy_reddit_api(
    subreddit: str = Path(..., description="Subreddit name"),
    sort: str = Path(..., description="Sorting method (hot, new, top, rising)"),
    limit: int = Query(25, description="Number of posts to fetch"),
    page: int = Query(1, description="Page number")
):
    """
    Proxy for Reddit API to fetch posts from a specific subreddit
    """
    try:
        logger.info(f"Fetching Reddit posts: subreddit={subreddit}, sort={sort}, limit={limit}, page={page}")
        
        # Get posts from the service
        posts = reddit_service.get_posts(subreddit=subreddit, sort=sort, limit=limit*page)
        
        # Calculate pagination
        total_count = len(posts)
        start_idx = (page - 1) * limit
        end_idx = min(start_idx + limit, total_count)
        paginated_data = posts[start_idx:end_idx]
        
        # Convert to Pydantic models
        social_posts = []
        for post in paginated_data:
            try:
                published_at = datetime.fromtimestamp(post.get("created_utc", time.time()))
                social_posts.append(SocialMediaPost(
                    id=post.get("id", f"reddit-{random.randint(1000, 9999)}"),
                    platform="reddit",
                    author=post.get("author", "unknown"),
                    content=post.get("content", ""),
                    title=post.get("title", ""),
                    url=post.get("url", "https://reddit.com"),
                    score=post.get("score", 0),
                    comments=post.get("num_comments", 0),
                    published_at=published_at,
                    sentiment=post.get("sentiment"),
                    related_coins=[]
                ))
            except Exception as e:
                logger.error(f"Error converting Reddit post: {e}")
        
        return SocialMediaResponse(
            items=social_posts,
            total_count=total_count,
            page=page,
            page_size=limit
        )
    
    except Exception as e:
        logger.error(f"Error fetching Reddit posts from r/{subreddit}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching Reddit posts: {str(e)}")

@router.get("/reddit/search", response_model=SocialMediaResponse)
async def proxy_reddit_search(
    q: str = Query(..., description="Search query"),
    subreddit: Optional[str] = Query(None, description="Limit search to specific subreddit"),
    limit: int = Query(25, description="Number of posts to fetch"),
    page: int = Query(1, description="Page number"),
    sort: str = Query("relevance", description="Sort method"),
    t: str = Query("week", description="Time period (hour, day, week, month, year, all)")
):
    """
    Proxy for Reddit API to search across Reddit
    """
    try:
        logger.info(f"Searching Reddit: q={q}, subreddit={subreddit}, limit={limit}, page={page}")
        
        # Get search results from the service
        if subreddit:
            # If searching within a specific subreddit, get posts and filter them
            posts = reddit_service.get_posts(subreddit=subreddit, limit=100)
            
            # Filter posts by query
            filtered_posts = []
            for post in posts:
                if (q.lower() in post.get("title", "").lower() or 
                    q.lower() in post.get("content", "").lower()):
                    filtered_posts.append(post)
            
            # Sort posts
            if sort == "relevance":
                filtered_posts.sort(key=lambda x: q.lower() in x.get("title", "").lower(), reverse=True)
            elif sort == "new":
                filtered_posts.sort(key=lambda x: x.get("created_utc", 0), reverse=True)
            elif sort == "top":
                filtered_posts.sort(key=lambda x: x.get("score", 0), reverse=True)
            
            posts = filtered_posts
        else:
            # If searching across all cached subreddits
            posts = reddit_service.search_posts(query=q, limit=limit*page)
        
        # Calculate pagination
        total_count = len(posts)
        start_idx = (page - 1) * limit
        end_idx = min(start_idx + limit, total_count)
        paginated_data = posts[start_idx:end_idx]
        
        # Convert to Pydantic models (reusing the same conversion code)
        social_posts = []
        for post in paginated_data:
            try:
                published_at = datetime.fromtimestamp(post.get("created_utc", time.time()))
                social_posts.append(SocialMediaPost(
                    id=post.get("id", f"reddit-{random.randint(1000, 9999)}"),
                    platform="reddit",
                    author=post.get("author", "unknown"),
                    content=post.get("content", ""),
                    title=post.get("title", ""),
                    url=post.get("url", "https://reddit.com"),
                    score=post.get("score", 0),
                    comments=post.get("num_comments", 0),
                    published_at=published_at,
                    sentiment=post.get("sentiment"),
                    related_coins=[]
                ))
            except Exception as e:
                logger.error(f"Error converting Reddit post: {e}")
        
        return SocialMediaResponse(
            items=social_posts,
            total_count=total_count,
            page=page,
            page_size=limit
        )
    
    except Exception as e:
        logger.error(f"Error searching Reddit for '{q}': {e}")
        raise HTTPException(status_code=500, detail=f"Error searching Reddit: {str(e)}")

@router.get("/portfolio", response_model=CryptoNewsResponse)
async def get_portfolio_news(
    limit: int = Query(20, description="Number of news items to return"),
    page: int = Query(1, description="Page number"),
    user_id: Optional[str] = Query(None, description="User ID")
):
    """
    Get news related to the user's portfolio holdings
    """
    try:
        # Load portfolio holdings from file
        portfolio_data = load_mock_data(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "user_portfolio_holdings.json"))
        
        # Get the symbols from the portfolio
        portfolio_symbols = []
        for holding in portfolio_data:
            if holding.get("symbol"):
                portfolio_symbols.append(holding.get("symbol").upper())
        
        # If no symbols found, return empty response
        if not portfolio_symbols:
            return CryptoNewsResponse(
                items=[],
                total_count=0,
                page=page,
                page_size=limit
            )
        
        # Get news for each symbol in the portfolio
        all_news = []
        for symbol in portfolio_symbols:
            news = crypto_news_service.get_news_by_asset(symbol, limit=5)
            all_news.extend(news)
        
        # Deduplicate news items by ID
        seen_ids = set()
        unique_news = []
        for item in all_news:
            item_id = item.get("id", "")
            if item_id not in seen_ids:
                seen_ids.add(item_id)
                unique_news.append(item)
        
        # Sort by timestamp (newest first)
        unique_news.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        # Calculate pagination
        total_count = len(unique_news)
        start_idx = (page - 1) * limit
        end_idx = min(start_idx + limit, total_count)
        paginated_data = unique_news[start_idx:end_idx]
        
        # Convert to Pydantic models
        news_items = []
        for item in paginated_data:
            try:
                news_items.append(CryptoNewsItem(
                    id=item.get("id", f"crypto-{random.randint(1000, 9999)}"),
                    title=item.get("title", ""),
                    summary=item.get("summary", item.get("content", "")),
                    source=item.get("source", ""),
                    url=item.get("url", item.get("link", "https://example.com")),
                    published_at=datetime.now(),
                    timestamp=item.get("timestamp", datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p")),
                    sentiment=item.get("sentiment"),
                    related_coins=item.get("relatedCoins", [])
                ))
            except Exception as e:
                logger.error(f"Error converting news item: {e}")
        
        return CryptoNewsResponse(
            items=news_items,
            total_count=total_count,
            page=page,
            page_size=limit
        )
    
    except Exception as e:
        logger.error(f"Error fetching portfolio news: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching portfolio news: {str(e)}")

@router.get("/watchlist", response_model=CryptoNewsResponse)
async def get_watchlist_news(
    limit: int = Query(20, description="Number of news items to return"),
    page: int = Query(1, description="Page number")
):
    """
    Get news related to watchlist tokens
    """
    try:
        logger.info(f"Fetching watchlist news: limit={limit}, page={page}")
        
        # For now, just return crypto news as we don't have a separate watchlist news service yet
        # In the future, we would want to filter crypto news specifically for watchlist tokens
        return await get_crypto_news(limit=limit, page=page)
    
    except Exception as e:
        logger.error(f"Error fetching watchlist news: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching watchlist news: {str(e)}")

@router.get("/rwa", response_model=CryptoNewsResponse)
async def get_rwa_news(
    limit: int = Query(20, description="Number of news items to return"),
    page: int = Query(1, description="Page number")
):
    """
    Get Real World Asset (RWA) news
    """
    try:
        logger.info(f"Fetching RWA news: limit={limit}, page={page}")
        
        # Filter crypto news for RWA-related terms
        rwa_terms = ["real world asset", "rwa", "tokenized real estate", "tokenized asset"]
        
        # Get all crypto news first
        all_news = crypto_news_service.get_news(limit=100)
        
        # Filter for RWA-related news
        rwa_news = []
        for item in all_news:
            title_lower = item.get('title', '').lower()
            content_lower = item.get('content', '').lower()
            
            if any(term in title_lower or term in content_lower for term in rwa_terms):
                item['relatedCoins'] = ['RWA']  # Add RWA tag
                rwa_news.append(item)
        
        # Calculate pagination
        total_count = len(rwa_news)
        start_idx = (page - 1) * limit
        end_idx = min(start_idx + limit, total_count)
        paginated_data = rwa_news[start_idx:end_idx]
        
        # Convert to Pydantic models
        news_items = []
        for item in paginated_data:
            try:
                news_items.append(CryptoNewsItem(
                    id=item.get("id", f"rwa-{random.randint(1000, 9999)}"),
                    title=item.get("title", ""),
                    summary=item.get("summary", item.get("content", "")),
                    source=item.get("source", ""),
                    url=item.get("url", item.get("link", "https://example.com")),
                    published_at=datetime.now(),
                    timestamp=item.get("timestamp", datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p")),
                    sentiment=item.get("sentiment"),
                    related_coins=item.get("relatedCoins", ["RWA"])
                ))
            except Exception as e:
                logger.error(f"Error converting RWA news item: {e}")
        
        return CryptoNewsResponse(
            items=news_items,
            total_count=total_count,
            page=page,
            page_size=limit
        )
    
    except Exception as e:
        logger.error(f"Error fetching RWA news: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching RWA news: {str(e)}")

@router.get("/messari", response_model=CryptoNewsResponse)
async def get_messari_news(
    limit: int = Query(20, description="Number of news items to return"),
    page: int = Query(1, description="Page number")
):
    """
    Get Messari research news
    """
    try:
        logger.info(f"Fetching Messari news: limit={limit}, page={page}")
        
        # Use dedicated Messari news collection directly
        messari_news = crypto_news_service.messari_news
        
        if not messari_news:
            # Fallback to filtering general crypto news for Messari-related content
            logger.info("No dedicated Messari news found, falling back to filtered crypto news")
            # Filter crypto news for Messari-related content
            messari_terms = ["messari", "research report", "crypto research"]
            
            # Get all crypto news first
            all_news = crypto_news_service.get_news(limit=100)
            
            # Filter for Messari-related news
            messari_news = []
            for item in all_news:
                source_lower = item.get('source', '').lower()
                title_lower = item.get('title', '').lower()
                content_lower = item.get('content', '').lower()
                
                if "messari" in source_lower or any(term in title_lower or term in content_lower for term in messari_terms):
                    item['source'] = "Messari Research" if "messari" in source_lower else item.get('source', '')
                    messari_news.append(item)
        
        # Calculate pagination
        total_count = len(messari_news)
        start_idx = (page - 1) * limit
        end_idx = min(start_idx + limit, total_count)
        paginated_data = messari_news[start_idx:end_idx]
        
        # Convert to Pydantic models
        news_items = []
        for item in paginated_data:
            try:
                news_items.append(CryptoNewsItem(
                    id=item.get("id", f"messari-{random.randint(1000, 9999)}"),
                    title=item.get("title", ""),
                    summary=item.get("summary", item.get("content", "")),
                    source=item.get("source", "Messari Research"),
                    url=item.get("url", item.get("link", "https://example.com")),
                    published_at=datetime.now(),
                    timestamp=item.get("timestamp", datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p")),
                    sentiment=item.get("sentiment"),
                    related_coins=item.get("relatedCoins", [])
                ))
            except Exception as e:
                logger.error(f"Error converting Messari news item: {e}")
        
        return CryptoNewsResponse(
            items=news_items,
            total_count=total_count,
            page=page,
            page_size=limit
        )
    
    except Exception as e:
        logger.error(f"Error fetching Messari news: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching Messari news: {str(e)}")

@router.get("/latest", response_model=Dict[str, Any])
async def get_latest_news(
    limit: int = Query(5, description="Number of news items to return per category")
):
    """
    Get the latest news from all sources (crypto, macro, reddit)
    """
    try:
        logger.info(f"Fetching latest news from all sources with limit={limit}")
        
        # Fetch crypto news
        crypto_news = []
        try:
            crypto_news = crypto_news_service.get_news(limit=limit)
            logger.info(f"Fetched {len(crypto_news)} crypto news items")
        except Exception as e:
            logger.error(f"Error fetching crypto news: {e}")
        
        # Fetch Bitcoin-specific news
        bitcoin_news = []
        try:
            bitcoin_news = crypto_news_service.bitcoin_news[:limit]
            logger.info(f"Fetched {len(bitcoin_news)} Bitcoin news items")
        except Exception as e:
            logger.error(f"Error fetching Bitcoin news: {e}")
            
        # Fetch Messari news
        messari_news = []
        try:
            messari_news = crypto_news_service.messari_news[:limit]
            logger.info(f"Fetched {len(messari_news)} Messari news items")
        except Exception as e:
            logger.error(f"Error fetching Messari news: {e}")
        
        # Fetch macro news for various categories
        macro_news = {}
        categories = ["business", "technology", "economy", "markets", "policy"]
        for category in categories:
            try:
                category_items = macro_news_service.get_news(category=category, limit=limit)
                if category_items:
                    macro_news[category] = category_items
                    logger.info(f"Fetched {len(category_items)} {category} news items")
            except Exception as e:
                logger.error(f"Error fetching {category} macro news: {e}")
        
        # Fetch reddit posts
        reddit_posts = []
        try:
            reddit_posts = reddit_service.get_posts(subreddit="cryptocurrency", sort="hot", limit=limit)
            logger.info(f"Fetched {len(reddit_posts)} reddit posts")
        except Exception as e:
            logger.error(f"Error fetching reddit posts: {e}")
        
        # Return all news in a structured format
        return {
            "crypto": crypto_news,
            "bitcoin": bitcoin_news,
            "messari": messari_news,
            "macro": macro_news,
            "reddit": reddit_posts,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error fetching latest news: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching latest news: {str(e)}")

@router.on_event("startup")
async def start_news_services():
    """Start news services when API starts"""
    try:
        logger.info("Starting news services")
        
        # Start the crypto news service update thread
        if not crypto_news_service.is_running():
            crypto_news_service.start_update_thread()
        
        # Start the macro news service update thread
        if not macro_news_service.is_running():
            macro_news_service.start_update_thread()
        
        # Start the reddit service update thread
        if not reddit_service.is_running():
            reddit_service.start_update_thread()
            
    except Exception as e:
        logger.error(f"Error starting news services: {e}") 