"""
AI analysis API endpoints
"""
from fastapi import APIRouter, Query, HTTPException, Depends, Path, Body, BackgroundTasks # type: ignore
from typing import List, Optional, Dict, Any, Union
import os
import json
import logging
import random
from datetime import datetime, timedelta
import uuid
import re

from app.models.ai import (
    MarketPrediction, SentimentAnalysis, MarketInsight, 
    PortfolioRecommendation, AIAnalysisRequest
)
from app.core.logging import get_logger
from app.services.ai import AIService
from app.services.ai.openai_service import OpenAIService, get_openai_service
from app.services.ai.intent_classifier import IntentClassifier, IntentType
from app.services.ai.prompt_templates import get_prompt_for_intent
from app.services.ai.context_registry import ContextRegistry, ContextPriority
from app.services.news import crypto_news_service, macro_news_service, reddit_service
from app.core.llm_provider import LLMProvider
from app.models.ai.ai import ChatMessage
from pydantic import BaseModel # type: ignore
from app.services.ai.utils.keyword_extractor import extract_keywords_from_query

# Initialize logger
logger = get_logger(__name__)

# Create router
router = APIRouter(prefix="/ai", tags=["AI Analysis"])

# Initialize AI services
ai_service = AIService()
openai_service = OpenAIService()

# Initialize intent classifier and context registry
intent_classifier = IntentClassifier()
context_registry = ContextRegistry()

# Helper function to load market data directly from file
def load_market_data():
    """
    Load market data from the data directory
    """
    try:
        # Try both potential locations for market data
        potential_paths = [
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "market_data.json"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "app", "data", "market_data.json")
        ]
        
        for path in potential_paths:
            if os.path.exists(path):
                with open(path, 'r') as f:
                    market_data = json.load(f)
                    logger.info(f"Successfully loaded market data from {path}")
                    return market_data
        
        logger.warning("Could not find market data in any expected location")
        return {}
    except Exception as e:
        logger.error(f"Error loading market data: {e}")
        return {}

# Fetch news data to include in AI context
def get_news_context(query: str = None, limit: int = 5):
    """
    Get recent news from various sources to provide context to AI
    
    Args:
        query: Optional query term to filter news
        limit: Maximum number of items to include per category
        
    Returns:
        Dictionary containing news data from different sources
    """
    try:
        logger.info(f"Fetching news context for AI with query: {query}, limit: {limit}")
        
        # Get crypto news
        crypto_data = []
        try:
            if query:
                # Try to get news related to the query
                crypto_data = crypto_news_service.get_news(limit=limit, filter_term=query)
            else:
                # Get general crypto news
                crypto_data = crypto_news_service.get_news(limit=limit)
            
            logger.info(f"Successfully fetched {len(crypto_data)} crypto news items")
        except Exception as e:
            logger.error(f"Error fetching crypto news for context: {e}")
            
        # Retrieve macro news for different categories
        macro_data = {}
        try:
            # Get different categories of macro news
            categories = ["business", "technology", "economy", "markets", "policy"]
            
            for category in categories:
                try:
                    category_news = macro_news_service.get_news(category=category, limit=limit)
                    if category_news:
                        macro_data[category] = category_news
                        logger.info(f"Successfully fetched {len(category_news)} {category} news items")
                except Exception as category_error:
                    logger.error(f"Error fetching {category} news: {category_error}")
        except Exception as e:
            logger.error(f"Error fetching macro news for context: {e}")
            
        # Get Reddit posts
        reddit_data = []
        try:
            # Try to get posts from cryptocurrency subreddit
            reddit_data = reddit_service.get_posts(subreddit="cryptocurrency", sort="hot", limit=limit)
            logger.info(f"Successfully fetched {len(reddit_data)} Reddit posts")
        except Exception as e:
            logger.error(f"Error fetching Reddit posts for context: {e}")
            
        # Return all news data
        return {
            "crypto": crypto_data,
            "macro": macro_data,
            "reddit": reddit_data
        }
    except Exception as e:
        logger.error(f"Error building news context: {e}")
        return {"crypto": [], "macro": {}, "reddit": []}

class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    model: Optional[str] = "gpt-4-turbo-preview"
    include_debug_info: Optional[bool] = False

class ChatResponse(BaseModel):
    answer: str
    metadata: Dict[str, Any]

def extract_keywords(query: str) -> List[str]:
    """Extract keywords from user query to improve news search results."""
    
    # Convert query to lowercase for case-insensitive matching
    query_lower = query.lower()
    
    # Initialize keywords list
    keywords = []
    
    # Check for special terms that should be preserved exactly as written
    special_terms = [
        "bitcoin", "btc", "ethereum", "eth", "solana", "sol", 
        "binance", "coinbase", "ftx", "kraken", "gemini",
        "defi", "nft", "dao", "stablecoin", "metaverse", 
        "airdrop", "ico", "ido", "ieo", "sto",
        "pump.fun", "ai", "grayscale", "gbtc", "ethe"
    ]
    
    # Log the special terms being checked
    logger.info(f"Checking query for special terms: {special_terms}")
    
    # Check each special term
    for term in special_terms:
        # Use word boundary check for more accurate matching
        pattern = r'\b' + re.escape(term) + r'\b'
        if re.search(pattern, query_lower):
            keywords.append(term)
            logger.info(f"Found special term in query: '{term}'")
    
    # Additional entity extraction using simple patterns
    
    # Find tokens that could be cryptocurrency symbols (all caps, 2-5 letters)
    crypto_symbols = re.findall(r'\b[A-Z]{2,5}\b', query)
    for symbol in crypto_symbols:
        if symbol.lower() not in [k.lower() for k in keywords]:
            keywords.append(symbol.lower())
            logger.info(f"Found potential crypto symbol: {symbol.lower()}")
    
    # Extract potential named entities (capitalized words)
    potential_entities = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', query)
    for entity in potential_entities:
        if entity.lower() not in [k.lower() for k in keywords]:
            keywords.append(entity.lower())
            logger.info(f"Found potential named entity: {entity.lower()}")
    
    # If no keywords were found, extract nouns as a fallback
    if not keywords:
        # Simple noun extraction - words that are not common stop words
        stop_words = {"a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "from", "by", "about", "in", "me", "you", "he", "she", "it", "we", "they", "is", "am", "are", "was", "were"}
        words = re.findall(r'\b[a-zA-Z]{3,}\b', query_lower)
        for word in words:
            if word not in stop_words and word not in keywords:
                keywords.append(word)
                logger.info(f"Added noun as fallback keyword: {word}")
    
    # Log the final keywords
    logger.info(f"Extracted keywords from query: {keywords}")
    
    return keywords

def extract_keywords_from_news_query(query):
    """Extract keywords for news search from a user query."""
    keywords = []
    
    # Check for specific terms that should be included as-is
    special_terms = ["pump.fun", "grayscale", "gbtc", "ethe"]
    for term in special_terms:
        if term.lower() in query.lower():
            keywords.append(term)
            logger.info(f"Found special term in query: {term}")
    
    # Extract words that look like crypto symbols (all caps, 2-5 letters)
    symbols = re.findall(r'\b[A-Z]{2,5}\b', query)
    for symbol in symbols:
        if symbol.lower() not in [k.lower() for k in keywords]:
            keywords.append(symbol.lower())
            logger.info(f"Found potential crypto symbol: {symbol}")
    
    # Extract capitalized words (potential proper names)
    names = re.findall(r'\b[A-Z][a-z]+\b', query)
    for name in names:
        if name.lower() not in [k.lower() for k in keywords]:
            keywords.append(name.lower())
            logger.info(f"Found potential entity name: {name}")
    
    # If no keywords found yet, extract all words with 4+ characters
    if not keywords:
        words = re.findall(r'\b[a-zA-Z]{4,}\b', query.lower())
        # Filter out common words
        stop_words = {'what', 'when', 'where', 'which', 'who', 'why', 'how', 
                      'about', 'that', 'this', 'these', 'those', 'there',
                      'their', 'have', 'from', 'with', 'news', 'information',
                      'tell', 'know', 'find', 'want', 'look', 'recent'}
        keywords = [w for w in words if w not in stop_words 
                   and w not in [k.lower() for k in keywords]]
        if keywords:
            logger.info(f"Using remaining words as keywords: {keywords}")
    
    return keywords

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Get AI response to a chat message using OpenAI.
    
    This endpoint processes user queries and returns AI-generated responses
    along with relevant metadata.
    """
    try:
        # Log the incoming request
        logger.info(f"Processing chat request: {request.query[:100]}{'...' if len(request.query) > 100 else ''}")
        
        # Get the OpenAI service
        openai_service = get_openai_service()
        
        # Process the query
        response = await openai_service.process_query(
            query=request.query,
            conversation_id=request.conversation_id,
            model=request.model
        )
        
        # Remove sensitive or excessive information from metadata if not requested
        if not request.include_debug_info and "metadata" in response:
            # Keep only essential metadata
            essential_metadata = {
                "intent": response["metadata"].get("intent"),
                "conversation_id": response["metadata"].get("conversation_id"),
                "timestamp": response["metadata"].get("timestamp"),
                "context_sources": response["metadata"].get("context_sources", [])
            }
            response["metadata"] = essential_metadata
        
        logger.info(f"Chat response generated successfully for conversation: {request.conversation_id}")
        return response
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")

@router.post("/extract-keywords")
async def extract_keywords(text: str = Body(..., embed=True)):
    """
    Extract keywords from text using the keyword extractor.
    
    This endpoint is primarily for debugging the keyword extraction.
    """
    try:
        # Extract keywords from the text
        keywords = extract_keywords_from_query(text)
        
        # Return keywords and metadata
        return {
            "text": text,
            "keywords": keywords,
            "count": len(keywords),
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error extracting keywords: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error extracting keywords: {str(e)}")

class SearchNewsRequest(BaseModel):
    """Request model for news search endpoint"""
    query: str
    limit: Optional[int] = 5

@router.post("/search-news")
async def search_news(request: SearchNewsRequest):
    """
    Search news articles based on query and keywords
    """
    try:
        # Extract keywords from query
        keywords = extract_keywords_from_news_query(request.query)
        
        # Get news data from different sources
        news_data = get_news_context(query=request.query, limit=20)
        
        # Collect all news articles
        all_news = []
        
        # Add crypto news
        if news_data.get("crypto"):
            all_news.extend(news_data["crypto"])
        
        # Add macro news
        if news_data.get("macro"):
            for category, articles in news_data["macro"].items():
                all_news.extend(articles)
        
        # Add Reddit posts
        if news_data.get("reddit"):
            all_news.extend(news_data["reddit"])
        
        # Sort by timestamp (newest first)
        all_news.sort(
            key=lambda x: x.get("timestamp", "0") if x.get("timestamp") else "0", 
            reverse=True
        )
        
        # Limit to requested number
        limited_news = all_news[:request.limit]
        
        # Return results
        return {
            "query": request.query,
            "keywords": keywords,
            "news": limited_news,
            "total_found": len(all_news),
            "returned": len(limited_news),
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error searching news: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching news: {str(e)}")

@router.get("/health")
async def health_check():
    """Check if the AI service is healthy"""
    try:
        # Get the OpenAI service
        openai_service = get_openai_service()
        
        # Check if the API key is available
        if not openai_service.api_key:
            return {
                "status": "unhealthy",
                "message": "OpenAI API key not configured",
                "timestamp": datetime.now().isoformat()
            }
        
        # Check if clients are initialized
        if not openai_service.async_client or not openai_service.client:
            return {
                "status": "degraded",
                "message": "OpenAI clients not fully initialized",
                "timestamp": datetime.now().isoformat()
            }
        
        # All checks passed
        return {
            "status": "healthy",
            "message": "AI service is operational",
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Health check failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

def parse_query_for_market_data(message, market_data, portfolio):
    """
    Parse query to detect requests for market data and add the relevant data to the context
    """
    logger.info("Parsing query for market data")
    
    message_lower = message.lower()
    response = ""
    
    # Check for portfolio-related queries
    portfolio_related_terms = [
        "portfolio value", "portfolio worth", "my portfolio", 
        "my holdings", "my coins", "my crypto", "my assets",
        "what's the value", "value of the portfolio", "value of my portfolio",
        "what is the value of the portfolio"
    ]
    
    is_portfolio_query = any(term in message_lower for term in portfolio_related_terms)
    
    # Handle portfolio data specifically for portfolio-related queries
    if is_portfolio_query:
        logger.info("Detected portfolio-related query")
        
        if portfolio and isinstance(portfolio, dict):
            has_portfolio_data = portfolio.get('hasData', False) or (
                portfolio.get('assets') and len(portfolio.get('assets', [])) > 0
            )
            
            if has_portfolio_data:
                # Portfolio data is available, add it to the response
                response += "\nPORTFOLIO DATA:\n"
                response += f"Total Portfolio Value: ${portfolio.get('totalValue', 0):,.2f}\n"
                response += f"Total Cost Basis: ${portfolio.get('totalCost', 0):,.2f}\n"
                response += f"Total Profit/Loss: ${portfolio.get('absoluteProfit', 0):,.2f}\n"
                
                if portfolio.get('assets'):
                    response += "\nHoldings:\n"
                    for asset in portfolio.get('assets', []):
                        response += f"- {asset.get('name', 'Unknown')} ({asset.get('symbol', 'Unknown')}): "
                        response += f"{asset.get('amount', 0)} tokens, "
                        response += f"value: ${asset.get('value', 0):,.2f}\n"
                
                logger.info("Added portfolio data to response")
            else:
                # No portfolio data available
                response += "\nPORTFOLIO DATA:\n"
                response += "No portfolio data is available. Please add assets to your portfolio first.\n"
                response += "You can add assets by going to the Portfolio section and clicking 'Add Asset'.\n"
                logger.info("No portfolio data available for this query")
    
    # Extract query terms for potential coin names
    query_terms = message_lower.split()
    logger.info(f"Initial query terms: {query_terms}")
    
    # Special handling for popular meme coins and tokens that might be missed
    meme_coins_map = {
        "pepe": ["pepe", "pepecoin"],
        "doge": ["dogecoin", "doge"],
        "shib": ["shiba", "shiba inu", "shibainu"]
    }
    
    # Check if any meme coins are mentioned in the message
    for coin, variants in meme_coins_map.items():
        if coin in message_lower or any(variant in message_lower for variant in variants):
            if coin not in query_terms:
                query_terms.append(coin)
                logger.info(f"Added meme coin term: {coin}")
    
    # If we have market data to work with
    if market_data and isinstance(market_data, dict) and "coins" in market_data:
        all_coins = market_data["coins"]
        logger.info(f"Market data contains {len(all_coins)} coins")
        
        # Extract key terms that might be coin names or symbols
        # Skip common words that aren't likely to be coin names
        common_words = ["price", "of", "the", "is", "what", "how", "much", "worth", "cost", 
                        "value", "market", "cap", "about", "tell", "me", "current"]
        coin_query_terms = [term for term in query_terms if len(term) >= 2 and term not in common_words]
        logger.info(f"Filtered coin query terms: {coin_query_terms}")
        
        # Directly search for coins by exact name/symbol match first
        matches = []
        
        # First pass: look for exact matches on symbol or name
        for coin in all_coins:
            coin_symbol = coin.get('symbol', '').lower()
            coin_name = coin.get('name', '').lower()
            coin_id = coin.get('id', '').lower()
            
            for term in coin_query_terms:
                term_lower = term.lower()
                # Check for exact matches
                if (term_lower == coin_symbol or 
                    term_lower == coin_name or 
                    term_lower == coin_id):
                    # Add exact matches to the front of the list
                    matches.insert(0, {'coin': coin, 'match_type': 'exact', 'term': term_lower})
                    logger.info(f"Found exact match: {term} -> {coin.get('name')} ({coin.get('symbol')})")
                    
                # Special handling for PEPE and other meme coins - more aggressive matching
                elif term_lower in ["pepe", "pepecoin"] and ("pepe" in coin_symbol or "pepe" in coin_name):
                    matches.insert(0, {'coin': coin, 'match_type': 'exact', 'term': term_lower})
                    logger.info(f"Found special PEPE match: {term} -> {coin.get('name')} ({coin.get('symbol')})")
        
        # Second pass: If no exact matches, try partial matches
        if not matches:
            for coin in all_coins:
                coin_symbol = coin.get('symbol', '').lower()
                coin_name = coin.get('name', '').lower()
                coin_id = coin.get('id', '').lower()
                
                for term in coin_query_terms:
                    term_lower = term.lower()
                    # Check for partial matches
                    if (term_lower in coin_symbol or
                        term_lower in coin_name or
                        term_lower in coin_id or
                        # Add more aggressive matching for common terms
                        (term_lower in ["pepe"] and ("pepe" in coin_symbol or "pepe" in coin_name)) or
                        (term_lower in ["doge"] and ("doge" in coin_symbol or "dog" in coin_name)) or
                        (term_lower in ["shib"] and ("shib" in coin_symbol or "shib" in coin_name))):
                        matches.append({'coin': coin, 'match_type': 'partial', 'term': term_lower})
                        logger.info(f"Found partial match: {term} -> {coin.get('name')} ({coin.get('symbol')})")

        # Add matched coin data to the response
        if matches:
            logger.info(f"Found {len(matches)} matches for query terms")
            
            # Group matches by match type
            exact_matches = [m for m in matches if m['match_type'] == 'exact']
            partial_matches = [m for m in matches if m['match_type'] == 'partial']
            
            # Use exact matches if available, otherwise use partial matches
            used_matches = exact_matches if exact_matches else partial_matches
            
            # Special debug for PEPE coin
            pepe_matches = [m for m in used_matches if "pepe" in m['coin'].get('name', '').lower() or "pepe" in m['coin'].get('symbol', '').lower()]
            if "pepe" in message_lower and pepe_matches:
                logger.info(f"PEPE matches found: {pepe_matches}")
            elif "pepe" in message_lower:
                logger.warning(f"User asked about PEPE but no matches found in market data")
                # Search all coins directly to confirm if PEPE is in the dataset
                pepe_coins = [c for c in all_coins if "pepe" in c.get('name', '').lower() or "pepe" in c.get('symbol', '').lower()]
                logger.info(f"Direct search for PEPE in all coins: {pepe_coins}")
            
            # Limit to top 3 matches to avoid overwhelming the response
            for match in used_matches[:3]:
                coin = match['coin']
                term = match['term']
                
                name = coin.get('name', 'Unknown')
                symbol = coin.get('symbol', '').upper()
                price = coin.get('current_price', 'unavailable')
                market_cap = coin.get('market_cap', 'unavailable')
                rank = coin.get('market_cap_rank', 'unavailable')
                price_change_24h = coin.get('price_change_percentage_24h', 'unavailable')
                
                response += f"\n{name} ({symbol}) Data:\n"
                response += f"Current Price: ${price}\n"
                if market_cap != 'unavailable':
                    response += f"Market Cap: ${market_cap:,}\n"
                else:
                    response += f"Market Cap: unavailable\n"
                    
                response += f"Market Cap Rank: #{rank}\n"
                
                if price_change_24h != 'unavailable':
                    direction = "⬆️" if price_change_24h > 0 else "⬇️"
                    response += f"24h Change: {direction} {abs(price_change_24h):.2f}%\n"
                
                logger.info(f"Added {name} ({symbol}) data to response")
        else:
            # No matches found
            query_string = ", ".join(coin_query_terms)
            response += f"\nCOIN NOT FOUND:\nThe cryptocurrency you asked about (search terms: {query_string}) "
            response += "was not found in the market data. Please verify the cryptocurrency symbol or name "
            response += "and try again. The system has data for the top 500 cryptocurrencies by market cap.\n"
            logger.info(f"No matches found for query terms: {coin_query_terms}")
        
        # Now let's add relevant news if available in context
        if 'news_data' in locals() or 'news_data' in globals():
            # Use existing news_data if available
            pass
        # Define a fallback news_data structure if none is available
        else:
            # Create an empty news data structure
            news_data = {"crypto": [], "macro": {}, "reddit": []}
            
            # Collect all news items across all categories
            all_news_items = []
            
            # Collect all news titles
            if hasattr(news_data, 'crypto') and isinstance(news_data.crypto, list):
                all_news_items.extend(news_data.crypto)
                
            if hasattr(news_data, 'macro'):
                macro_data = news_data.macro
                if isinstance(macro_data, dict):
                    for category, items in macro_data.items():
                        if isinstance(items, list):
                            all_news_items.extend(items)
                elif isinstance(macro_data, list):
                    all_news_items.extend(macro_data)
                    
            if hasattr(news_data, 'reddit') and isinstance(news_data.reddit, list):
                all_news_items.extend(news_data.reddit)
            
            # Find relevant news that match key terms in the query
            relevant_news = []
            for item in all_news_items:
                if isinstance(item, dict) and "title" in item:
                    title_lower = item.get("title", "").lower()
                    # Check if any query term appears in the title
                    matches_count = sum(1 for term in query_terms if term in title_lower)
                    if matches_count > 0:
                        # Add a relevance score and a unique identifier
                        relevant_news.append((matches_count, item))
            
            # Sort by relevance score (most relevant first)
            relevant_news.sort(key=lambda x: x[0], reverse=True)
            
            # Add relevant news if any found
            if relevant_news:
                response += "\nRELEVANT NEWS BASED ON YOUR QUERY:\n"
                for score, item in relevant_news[:5]:  # Show top 5 most relevant
                    title = item.get("title", "N/A")
                    source = item.get("source", "Unknown source")
                    url = item.get("url", "")
                    response += f"- {title} (Source: {source})\n"
                    if url:
                        response += f"  URL: {url}\n"
                    response += "\n"
        
        # Add the user's message at the end
        response += f"\n=== USER QUESTION ===\n{message}\n\n"
        
        return response
    else:
        logger.warning("No market data found to process")
        return "No market data found to process"

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_content(request: AIAnalysisRequest):
    """
    Analyze content using AI
    """
    try:
        analysis_type = request.analysis_type.lower()
        
        if analysis_type == "sentiment":
            result = await analyze_sentiment(request)
            return {"analysis_type": "sentiment", "result": result}
        elif analysis_type == "prediction":
            result = await predict_market(request)
            return {"analysis_type": "prediction", "result": result}
        elif analysis_type == "insight":
            result = await generate_insight(request)
            return {"analysis_type": "insight", "result": result}
        elif analysis_type == "recommendation":
            result = await generate_recommendation(request)
            return {"analysis_type": "recommendation", "result": result}
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported analysis type: {analysis_type}")
    
    except Exception as e:
        logger.error(f"Error analyzing content: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing content: {str(e)}")

@router.get("/sentiment/{symbol}", response_model=SentimentAnalysis)
async def get_sentiment(
    symbol: str = Path(..., description="Cryptocurrency symbol"),
    time_period: str = Query("24h", description="Time period (24h, 7d, 30d)")
):
    """
    Get sentiment analysis for a specific cryptocurrency
    """
    try:
        symbol = symbol.upper()
        
        # Generate mock sentiment data
        sentiment_score = random.uniform(-1.0, 1.0)
        
        if sentiment_score > 0.3:
            sentiment_label = "POSITIVE"
        elif sentiment_score < -0.3:
            sentiment_label = "NEGATIVE"
        else:
            sentiment_label = "NEUTRAL"
        
        sources_analyzed = random.randint(50, 500)
        confidence = random.uniform(0.7, 0.95)
        
        return SentimentAnalysis(
            symbol=symbol,
            sentiment_score=sentiment_score,
            sentiment_label=sentiment_label,
            confidence=confidence,
            sources_analyzed=sources_analyzed,
            time_period=time_period,
            analyzed_at=datetime.now()
        )
    
    except Exception as e:
        logger.error(f"Error fetching sentiment for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching sentiment: {str(e)}")

async def analyze_sentiment(request: AIAnalysisRequest) -> SentimentAnalysis:
    """
    Analyze sentiment of provided content
    """
    content_type = request.content_type.lower()
    
    if content_type == "text":
        text = request.content
        
        # Generate mock sentiment data for the text
        sentiment_score = random.uniform(-1.0, 1.0)
        
        if sentiment_score > 0.3:
            sentiment_label = "POSITIVE"
        elif sentiment_score < -0.3:
            sentiment_label = "NEGATIVE"
        else:
            sentiment_label = "NEUTRAL"
        
        confidence = random.uniform(0.6, 0.9)
        
        return SentimentAnalysis(
            text=text[:100] + "..." if len(text) > 100 else text,
            sentiment_score=sentiment_score,
            sentiment_label=sentiment_label,
            confidence=confidence,
            analyzed_at=datetime.now()
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported content type for sentiment analysis: {content_type}")

@router.get("/predict/{symbol}", response_model=MarketPrediction)
async def get_prediction(
    symbol: str = Path(..., description="Cryptocurrency symbol"),
    time_frame: str = Query("24h", description="Time frame (24h, 7d, 30d)")
):
    """
    Get price prediction for a specific cryptocurrency
    """
    try:
        symbol = symbol.upper()
        
        # Load current price data
        market_data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "market_data.json")
        
        try:
            with open(market_data_path, 'r') as f:
                market_data = json.load(f)
            
            # Find the specific cryptocurrency
            price_data = next(
                (p for p in market_data.get("prices", []) if p.get("symbol", "").upper() == symbol),
                None
            )
            
            if not price_data:
                raise HTTPException(status_code=404, detail=f"Price data for {symbol} not found")
            
            current_price = price_data.get("priceUsd", 1000.0)
        except Exception:
            # Fallback to dummy data if file can't be read
            current_price = 1000.0 if symbol == "BTC" else 100.0
        
        # Generate prediction data
        if time_frame == "24h":
            # Generate prediction with smaller variation for short term
            prediction_date = datetime.now() + timedelta(days=1)
            prediction_price = current_price * (1 + random.uniform(-0.05, 0.08))
            confidence = random.uniform(0.7, 0.9)
        elif time_frame == "7d":
            # Medium term prediction
            prediction_date = datetime.now() + timedelta(days=7)
            prediction_price = current_price * (1 + random.uniform(-0.15, 0.2))
            confidence = random.uniform(0.6, 0.8)
        else:  # 30d
            # Longer term has more variation and lower confidence
            prediction_date = datetime.now() + timedelta(days=30)
            prediction_price = current_price * (1 + random.uniform(-0.3, 0.4))
            confidence = random.uniform(0.5, 0.7)
        
        features_used = [
            "price_history",
            "volume_trends",
            "market_sentiment",
            "technical_indicators",
            "social_media_data"
        ]
        
        return MarketPrediction(
            symbol=symbol,
            time_frame=time_frame,
            prediction_price=prediction_price,
            confidence=confidence,
            prediction_date=prediction_date,
            generated_at=datetime.now(),
            model_version="v1.2.3",
            features_used=features_used
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating prediction for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating prediction: {str(e)}")

async def predict_market(request: AIAnalysisRequest) -> MarketPrediction:
    """
    Generate market prediction based on request
    """
    content_type = request.content_type.lower()
    
    if content_type == "market_data":
        # Extract symbol and time frame from content
        content = request.content
        symbol = content.get("symbol", "BTC").upper()
        time_frame = content.get("time_frame", "24h")
        
        # Generate prediction based on the same logic as the GET endpoint
        return await get_prediction(symbol, time_frame)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported content type for market prediction: {content_type}")

@router.get("/insights", response_model=List[MarketInsight])
async def get_insights(
    symbols: Optional[str] = Query(None, description="Comma-separated list of cryptocurrency symbols"),
    categories: Optional[str] = Query(None, description="Comma-separated categories (technical, fundamental, sentiment, news)"),
    limit: int = Query(5, description="Number of insights to return")
):
    """
    Get AI-generated market insights
    """
    try:
        # Parse parameters
        symbol_list = []
        if symbols:
            symbol_list = [s.strip().upper() for s in symbols.split(",")]
        
        category_list = []
        if categories:
            category_list = [c.strip().lower() for c in categories.split(",")]
        
        # Default symbols for when none are specified
        if not symbol_list:
            symbol_list = ["BTC", "ETH", "SOL", "DOT", "LINK", "ADA"]
        
        # Default categories when none are specified
        if not category_list:
            category_list = ["technical", "fundamental", "sentiment", "news", "on-chain"]
        
        # Generate mock insights
        insights = []
        
        insight_titles = [
            "Accumulation phase detected",
            "Bullish divergence forming",
            "Increased institutional interest",
            "Bearish sentiment reaching extreme levels",
            "Strong resistance level testing",
            "Major protocol upgrade approaching",
            "Exchange flows indicate selling pressure",
            "Whale activity intensifying",
            "Market sentiment turning positive",
            "Technical breakout imminent"
        ]
        
        for _ in range(min(limit, 10)):
            # Randomly select symbols and categories for this insight
            insight_symbols = random.sample(symbol_list, min(random.randint(1, 3), len(symbol_list)))
            insight_categories = random.sample(category_list, min(random.randint(1, 3), len(category_list)))
            
            # Generate mock content based on selected symbols and categories
            symbol_text = ", ".join(insight_symbols)
            category_text = " and ".join(insight_categories)
            title = random.choice(insight_titles)
            content = f"Analysis of {symbol_text} shows significant {category_text} developments. "
            content += "Recent data indicates changing market conditions that suggest potential price movement. "
            content += "Key metrics to watch include volume trends, social sentiment, and technical indicator convergence."
            
            # Generate random sources
            sources = []
            possible_sources = ["TradingView", "CryptoQuant", "Glassnode", "Santiment", "CoinMetrics", "Messari", "News Analysis"]
            num_sources = random.randint(1, 4)
            sources = random.sample(possible_sources, num_sources)
            
            insights.append(MarketInsight(
                id=f"insight-{uuid.uuid4()}",
                title=f"{symbol_text} {title}",
                content=content,
                symbols=insight_symbols,
                categories=insight_categories,
                generated_at=datetime.now() - timedelta(hours=random.randint(0, 48)),
                confidence=random.uniform(0.6, 0.95),
                sources=sources
            ))
        
        # Sort by most recent
        insights.sort(key=lambda x: x.generated_at, reverse=True)
        
        return insights
    
    except Exception as e:
        logger.error(f"Error generating market insights: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating market insights: {str(e)}")

async def generate_insight(request: AIAnalysisRequest) -> MarketInsight:
    """
    Generate market insight based on request
    """
    content_type = request.content_type.lower()
    
    if content_type in ["market_data", "news", "portfolio"]:
        content = request.content
        
        # Extract symbols from content
        symbols = []
        if isinstance(content, dict) and "symbols" in content:
            symbols = [s.upper() for s in content.get("symbols", [])]
        elif isinstance(content, dict) and "symbol" in content:
            symbols = [content.get("symbol", "BTC").upper()]
        else:
            symbols = ["BTC", "ETH"]  # Default symbols
        
        # Generate a mock insight
        insight_titles = [
            "Accumulation phase detected",
            "Bullish divergence forming",
            "Increased institutional interest",
            "Market cycle analysis"
        ]
        
        title = random.choice(insight_titles)
        symbol_text = ", ".join(symbols)
        
        # Generate mock content
        content_text = f"Analysis of {symbol_text} shows interesting market developments. "
        content_text += "Recent data indicates changing market conditions that suggest potential price movement. "
        content_text += "Key metrics to watch include volume trends, social sentiment, and technical indicator convergence."
        
        return MarketInsight(
            id=f"insight-{uuid.uuid4()}",
            title=f"{symbol_text} {title}",
            content=content_text,
            symbols=symbols,
            categories=["technical", "sentiment"],
            generated_at=datetime.now(),
            confidence=random.uniform(0.7, 0.9),
            sources=["TradingView", "CryptoQuant", "News Analysis"]
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported content type for market insight: {content_type}")

@router.get("/recommendations", response_model=PortfolioRecommendation)
async def get_recommendations(
    risk_profile: str = Query("moderate", description="Risk profile (conservative, moderate, aggressive)"),
    user_id: str = Query("user123", description="User ID")
):
    """
    Get AI-generated portfolio recommendations
    """
    try:
        # Validate risk profile
        if risk_profile.lower() not in ["conservative", "moderate", "aggressive"]:
            risk_profile = "moderate"
        
        # Generate recommendations based on risk profile
        recommendations = []
        
        if risk_profile.lower() == "conservative":
            recommendations = [
                {"symbol": "BTC", "name": "Bitcoin", "allocation": 30.0},
                {"symbol": "ETH", "name": "Ethereum", "allocation": 20.0},
                {"symbol": "USDC", "name": "USD Coin", "allocation": 40.0},
                {"symbol": "SOL", "name": "Solana", "allocation": 5.0},
                {"symbol": "BNB", "name": "Binance Coin", "allocation": 5.0}
            ]
            expected_return = 15.5
            rationale = "This conservative allocation prioritizes stability with a high stablecoin allocation while maintaining exposure to established cryptocurrencies."
            
        elif risk_profile.lower() == "moderate":
            recommendations = [
                {"symbol": "BTC", "name": "Bitcoin", "allocation": 35.0},
                {"symbol": "ETH", "name": "Ethereum", "allocation": 30.0},
                {"symbol": "SOL", "name": "Solana", "allocation": 15.0},
                {"symbol": "DOT", "name": "Polkadot", "allocation": 10.0},
                {"symbol": "USDC", "name": "USD Coin", "allocation": 10.0}
            ]
            expected_return = 25.5
            rationale = "This balanced allocation provides growth potential with a moderate risk level, focusing on established layer 1 protocols and maintaining some stablecoin reserves."
            
        else:  # aggressive
            recommendations = [
                {"symbol": "BTC", "name": "Bitcoin", "allocation": 30.0},
                {"symbol": "ETH", "name": "Ethereum", "allocation": 25.0},
                {"symbol": "SOL", "name": "Solana", "allocation": 15.0},
                {"symbol": "AVAX", "name": "Avalanche", "allocation": 10.0},
                {"symbol": "DOT", "name": "Polkadot", "allocation": 10.0},
                {"symbol": "LINK", "name": "Chainlink", "allocation": 5.0},
                {"symbol": "MATIC", "name": "Polygon", "allocation": 5.0}
            ]
            expected_return = 35.8
            rationale = "This aggressive allocation maximizes growth potential with a focus on high-performance blockchain protocols and essential infrastructure, suitable for investors comfortable with higher volatility."
        
        return PortfolioRecommendation(
            user_id=user_id,
            recommendations=recommendations,
            risk_profile=risk_profile.lower(),
            expected_return=expected_return,
            generated_at=datetime.now(),
            rationale=rationale
        )
    
    except Exception as e:
        logger.error(f"Error generating portfolio recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating portfolio recommendations: {str(e)}")

async def generate_recommendation(request: AIAnalysisRequest) -> PortfolioRecommendation:
    """
    Generate portfolio recommendation based on request
    """
    content_type = request.content_type.lower()
    
    if content_type == "portfolio":
        content = request.content
        
        # Extract parameters from content
        risk_profile = content.get("risk_profile", "moderate").lower()
        user_id = content.get("user_id", "user123")
        
        # Use the same logic as the GET endpoint
        return await get_recommendations(risk_profile, user_id)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported content type for portfolio recommendation: {content_type}")

@router.get("/health", response_model=Dict[str, Any])
async def ai_health_check():
    """
    Check if the AI service is properly configured and connected to OpenAI.
    """
    try:
        # Check if OpenAI API key is set
        api_key_set = openai_service.api_key is not None and len(openai_service.api_key) > 0
        
        # Check if OpenAI client is initialized
        client_initialized = openai_service.client is not None and openai_service.async_client is not None
        
        # Return health status
        return {
            "status": "ok" if api_key_set and client_initialized else "error",
            "api_key_configured": api_key_set,
            "client_initialized": client_initialized,
            "timestamp": datetime.now().isoformat(),
            "api_base": os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1"),
            "models_available": ["gpt-4-turbo-preview", "gpt-3.5-turbo"],
            "port": os.getenv("PORT", "8000")
        }
    except Exception as e:
        logger.error(f"Error checking AI health: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.post("/query")
async def process_query(request: dict = Body(...)):
    """
    Process a user query using OpenAI with appropriate context
    """
    try:
        # Extract parameters from request
        query = request.get("query", "")
        model = request.get("model", "gpt-4-turbo-preview")
        debug_mode = request.get("debug_mode", False)
        user_id = request.get("user_id")
        
        if not query or not query.strip():
            return {
                "message": "Please provide a query",
                "status": "error",
                "error_type": "missing_query"
            }
        
        # Detailed logging for debugging the pipeline
        logger.info(f"Processing query: '{query}', model: {model}, debug_mode: {debug_mode}")
        
        # Step 1: Classify intent to determine how to process the query
        intent_type, confidence = intent_classifier.classify(query)
        logger.info(f"Query classified as {intent_type.name} with confidence {confidence:.2f}")
        
        # Initialize context sources and data
        context_sources = []
        context_data = {
            "_meta": {
                "intent": intent_type.name,
                "timestamp": datetime.now().isoformat(),
                "query": query
            }
        }
        
        # Step 2: Get market data for context
        try:
            market_data = load_market_data()
            if market_data:
                context_data["market"] = market_data
                context_sources.append("market")
                logger.info(f"Loaded market data with {len(market_data.get('coins', []))} coins")
            else:
                logger.warning("No market data available")
        except Exception as e:
            logger.error(f"Error loading market data: {str(e)}")
        
        # Step 3: Get portfolio data if relevant and available
        if user_id and intent_type in [IntentType.PORTFOLIO_ANALYSIS, IntentType.RISK_ASSESSMENT]:
            try:
                # In a real implementation, this would load actual portfolio data
                # For now, we'll use placeholder data
                portfolio_data = {
                    "total_value": 10000,
                    "assets": [
                        {"symbol": "BTC", "name": "Bitcoin", "amount": 0.15, "value": 7500},
                        {"symbol": "ETH", "name": "Ethereum", "amount": 1.5, "value": 3000}
                    ]
                }
                context_data["portfolio"] = portfolio_data
                context_sources.append("portfolio")
                logger.info("Loaded portfolio data for context")
            except Exception as e:
                logger.error(f"Error loading portfolio data: {str(e)}")
        
        # Step 4: Get news data if relevant
        if intent_type in [IntentType.NEWS_QUERY, IntentType.MARKET_PRICE]:
            try:
                news_data = get_news_context(query=query, limit=5)
                if news_data:
                    context_data["news"] = news_data
                    context_sources.append("news")
                    logger.info(f"Loaded news data with {len(news_data.get('crypto', []))} crypto news items")
            except Exception as e:
                logger.error(f"Error loading news data: {str(e)}")
        
        # Step 5: Get appropriate prompt template for the intent
        prompt_template = get_prompt_for_intent(intent_type)
        
        # Step 6: Process with OpenAI using the prepared context
        try:
            response = await openai_service.process_with_context(
                messages=[
                    {"role": "system", "content": prompt_template},
                    {"role": "user", "content": query}
                ],
                context=context_data,
                model=model
            )
            
            # Extract answer from response
            if isinstance(response, dict) and "answer" in response:
                answer_text = response["answer"]
                metadata = response.get("metadata", {})
            else:
                answer_text = str(response)
                metadata = {
                    "intent": intent_type.name,
                    "prompt_used": intent_type.name + "_PROMPT",
                    "context_sources": context_sources
                }
            
            # Return the response with or without metadata based on debug flag
            if debug_mode:
                return {
                    "message": answer_text,
                    "status": "success",
                    "intent": intent_type.name,
                    "context_sources": context_sources,
                    "metadata": metadata
                }
            else:
                return {
                    "message": answer_text,
                    "status": "success"
                }
                
        except Exception as e:
            logger.error(f"Error processing query with OpenAI: {str(e)}")
            import traceback
            logger.error(f"Detailed traceback: {traceback.format_exc()}")
            
            return {
                "message": f"I encountered an error while processing your request: {str(e)}",
                "status": "error",
                "error_type": "ai_processing_error"
            }
    
    except Exception as e:
        logger.error(f"Error in query endpoint: {str(e)}")
        import traceback
        logger.error(f"Detailed traceback: {traceback.format_exc()}")
        
        return {
            "message": f"An error occurred: {str(e)}",
            "status": "error",
            "error_type": "server_error"
        }

@router.post("/debug")
async def run_debug_tests():
    """Debug endpoint to test AI components and check for errors"""
    report = {
        "timestamp": datetime.now().isoformat(),
        "status": "running",
        "tests": {}
    }
    
    # Test intent classification
    try:
        test_queries = {
            "portfolio": "What is my portfolio value?",
            "news": "Any Bitcoin news?",
            "market": "What is the price of Bitcoin?",
            "risk": "What's my risk exposure?",
            "tax": "What are the tax implications?",
            "trade": "Show my trade history"
        }
        
        classification_results = {}
        for test_type, query in test_queries.items():
            try:
                intent_type, confidence = intent_classifier.classify(query)
                classification_results[test_type] = {
                    "query": query,
                    "intent": intent_type.name if hasattr(intent_type, "name") else str(intent_type),
                    "confidence": confidence,
                    "success": True
                }
            except Exception as e:
                classification_results[test_type] = {
                    "query": query,
                    "error": str(e),
                    "success": False
                }
        
        report["tests"]["intent_classification"] = {
            "status": "success",
            "results": classification_results
        }
    except Exception as e:
        report["tests"]["intent_classification"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Test IntentType enum values
    try:
        intent_types = {name: item.name for name, item in vars(IntentType).items() 
                        if isinstance(item, IntentType)}
        
        report["tests"]["intent_types"] = {
            "status": "success",
            "available_types": intent_types
        }
    except Exception as e:
        report["tests"]["intent_types"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Check context providers
    try:
        providers = {
            "market": hasattr(openai_service, "market_context_provider"),
            "news": hasattr(openai_service, "news_context_provider"),
            "portfolio": hasattr(openai_service, "portfolio_context_provider")
        }
        
        report["tests"]["context_providers"] = {
            "status": "success",
            "providers": providers
        }
    except Exception as e:
        report["tests"]["context_providers"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Check for any string replacements in code
    try:
        replacements = {
            "PORTFOLIO_QUERY": "References to PORTFOLIO_QUERY should be PORTFOLIO_ANALYSIS",
            "MARKET_QUERY": "References to MARKET_QUERY should be MARKET_PRICE",
            "PRICE_QUERY": "References to PRICE_QUERY should be MARKET_PRICE",
            "PERFORMANCE_QUERY": "References to PERFORMANCE_QUERY should be PORTFOLIO_ANALYSIS",
            "RECOMMENDATION": "References to RECOMMENDATION may need to be updated"
        }
        
        report["tests"]["string_replacements"] = {
            "status": "success",
            "replacements_needed": replacements
        }
    except Exception as e:
        report["tests"]["string_replacements"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Check environment
    try:
        import platform
        import sys
        env = {
            "python_version": sys.version,
            "platform": platform.platform(),
            "cwd": os.getcwd(),
            "api_key_set": bool(openai_service.api_key),
            "client_initialized": openai_service.client is not None
        }
        
        report["tests"]["environment"] = {
            "status": "success",
            "env": env
        }
    except Exception as e:
        report["tests"]["environment"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Set final status
    failed_tests = [t for t, data in report["tests"].items() if data["status"] == "error"]
    report["status"] = "error" if failed_tests else "success"
    report["failed_tests"] = failed_tests
    
    return report 