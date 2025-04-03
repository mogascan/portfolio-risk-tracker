# backend/app/services/ai/openai_service.py
import logging
import os
import json
from typing import Dict, List, Any, Optional, Tuple
from openai import AsyncOpenAI, OpenAI # type: ignore
from dotenv import load_dotenv # type: ignore
import sys
from datetime import datetime

# Import context providers
from app.services.ai.context_providers import (
    MarketContextProvider, 
    NewsContextProvider, 
    PortfolioContextProvider
)

# Import keyword extractor
from app.services.ai.utils.keyword_extractor import extract_keywords_from_query

# Add correct paths for imports
try:
    # Try absolute imports first
    from app.config import settings
    from app.services.portfolio.portfolio_analysis import PortfolioAnalysis
    from app.services.ai.intent_classifier import IntentClassifier, IntentType
    from app.services.ai.prompt_templates import get_prompt_for_intent
except ImportError:
    try:
        # Try relative imports next
        from ....app.config import settings  # Relative import
        from ..portfolio.portfolio_analysis import PortfolioAnalysis
        from .intent_classifier import IntentClassifier, IntentType
        from .prompt_templates import get_prompt_for_intent
    except ImportError:
        try:
            # Try path adjustment if imports still fail
            import importlib.util
            
            # Get the current file's directory and construct paths
            current_dir = os.path.dirname(os.path.abspath(__file__))
            backend_dir = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
            
            # Add the backend directory to sys.path if it's not already there
            if backend_dir not in sys.path:
                sys.path.append(backend_dir)
            
            # Now try imports again
            from app.config import settings
            from app.services.portfolio.portfolio_analysis import PortfolioAnalysis
            from app.services.ai.intent_classifier import IntentClassifier, IntentType
            from app.services.ai.prompt_templates import get_prompt_for_intent
        except ImportError as e:
            logging.error(f"Error: Couldn't import required modules. {str(e)}")
            
            # Define fallbacks to prevent crashes
            class PortfolioAnalysis:
                async def get_portfolio_context(self):
                    return "Portfolio data unavailable due to import error."
                async def get_asset_analysis(self, symbol):
                    return f"Analysis for {symbol} unavailable due to import error."
                async def get_market_overview(self):
                    return "Market overview unavailable due to import error."
            
            class IntentType:
                GENERAL_QUERY = "general"
            
            def get_prompt_for_intent(intent_type):
                return "You are a crypto assistant. Due to a technical issue, specialized prompts are unavailable."
            
            # Mock settings
            class Settings:
                OPENAI_API_KEY = None
            settings = Settings()

# Load environment variables
load_dotenv()

# Configure logger
logger = logging.getLogger(__name__)

class OpenAIService:
    """
    Service for interacting with OpenAI API.
    
    Provides methods for processing AI requests with appropriate context
    based on user queries and intent classification.
    """
    
    def __init__(self):
        """Initialize the OpenAI service with necessary components"""
        logger.info("Initializing OpenAIService")
        
        # Try different ways to get the API key
        self.api_key = os.getenv('OPENAI_API_KEY') or os.environ.get('OPENAI_API_KEY') or settings.OPENAI_API_KEY
        
        if not self.api_key:
            logger.error("OPENAI_API_KEY not found in environment variables")
        else:
            logger.info(f"Found API key (starts with): {self.api_key[:5] if self.api_key else None}...")
            
        # Initialize clients
        self.client = None
        self.async_client = None
        self._initialize_client()
        
        # Initialize context providers
        self.market_context_provider = MarketContextProvider()
        self.news_context_provider = NewsContextProvider()
        self.portfolio_context_provider = PortfolioContextProvider()
        
        # Initialize the intent classifier
        self.intent_classifier = IntentClassifier()
        
        # Initialize context registry
        self._initialize_context_registry()
        
        logger.info("OpenAIService fully initialized")
    
    def _initialize_client(self):
        """Initialize OpenAI client with API key"""
        try:
            if self.api_key:
                # Initialize both async and sync clients
                self.client = OpenAI(api_key=self.api_key)
                self.async_client = AsyncOpenAI(api_key=self.api_key)
                logger.info("OpenAI client initialized successfully")
            else:
                logger.error("OpenAI API key not found in environment variables")
        except Exception as e:
            logger.error(f"Error initializing OpenAI client: {str(e)}")
    
    async def process_with_context(self, 
                                messages: List[Dict[str, str]], 
                                context: Dict[str, Any] = None,
                                model: str = "gpt-4-turbo-preview",
                                temperature: float = 0.7,
                                max_tokens: int = 1000) -> Dict[str, Any]:
        """
        Process a request with context information by formatting it for the LLM.
        
        Args:
            messages: List of message objects with role and content
            context: Dictionary of context information to include in the prompt
            model: Model to use for completion
            temperature: Temperature for response generation
            max_tokens: Maximum tokens in the response
            
        Returns:
            Dictionary with answer and metadata
        """
        start_time = datetime.now()
        logger.info(f"Processing request with context using model {model}")
        
        if not self.async_client:
            return self._create_error_response("AI service is not properly configured. Please check your API key.")
        
        try:
            # Format the context as text for the prompt
            if context:
                context_text = self._format_context_for_prompt(context)
                
                # Add context to the system message if present, or create a new system message
                if messages and messages[0]["role"] == "system":
                    # Prepend context to existing system message
                    messages[0]["content"] = f"Context Information:\n{context_text}\n\n{messages[0]['content']}"
                else:
                    # Create new system message with context
                    messages.insert(0, {"role": "system", "content": f"Context Information:\n{context_text}"})
            
            # Make the API call
            context_sources = []
            if context:
                # Track which context sources were used
                for key in context.keys():
                    context_sources.append(key)
                
            logger.info(f"Calling OpenAI with model {model} and context sources: {context_sources}")
            response = await self.async_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Extract the response
            answer = response.choices[0].message.content
            
            # Calculate processing time
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            # Attempt to extract intent from context metadata
            intent = "UNKNOWN"
            if context and "_meta" in context and "intent" in context["_meta"]:
                intent = context["_meta"]["intent"]
            
            # Return the response with metadata
            return {
                "answer": answer,
                "metadata": {
                    "context_sources": context_sources,
                    "processing_time_seconds": processing_time,
                    "model": model,
                    "intent": intent,
                    "timestamp": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error in process_with_context: {str(e)}")
            return self._create_error_response(f"I encountered an error while processing your request: {str(e)}")
    
    async def chat_completion(self, 
                             messages: List[Dict[str, str]], 
                             model: str = "gpt-4-turbo-preview", 
                             temperature: float = 0.7,
                             max_tokens: int = 1000,
                             **kwargs) -> Any:
        """
        Send a chat completion request to OpenAI asynchronously
        
        Args:
            messages: List of message objects with role and content
            model: Model to use for completion
            temperature: Temperature for response generation
            max_tokens: Maximum tokens in the response
            **kwargs: Additional parameters to pass to the API
            
        Returns:
            The completion response from OpenAI
        """
        if not self.async_client:
            logger.error("Async client is not initialized, cannot perform chat completion")
            raise ValueError("OpenAI async client is not initialized")
            
        try:
            logger.info(f"Sending async chat completion request with model {model}")
            
            # Add default parameters if not in kwargs
            if 'temperature' not in kwargs:
                kwargs['temperature'] = temperature
            if 'max_tokens' not in kwargs:
                kwargs['max_tokens'] = max_tokens
            
            response = await self.async_client.chat.completions.create(
                model=model,
                messages=messages,
                **kwargs
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error in async chat completion: {str(e)}")
            raise e

    async def process_query(self, 
                           query: str, 
                           conversation_id: str = None,
                           model: str = "gpt-4-turbo-preview",
                           token_budget: int = 6000) -> Dict[str, Any]:
        """
        Process a user query with appropriate context based on intent
        
        Args:
            query: User's query text
            conversation_id: Optional ID for conversation tracking
            model: Model to use for completion
            token_budget: Maximum tokens for context
            
        Returns:
            Dictionary with response and metadata
        """
        start_time = datetime.now()
        
        if not self.async_client:
            return self._create_error_response("AI service is not properly configured. Please check your API key.")
        
        try:
            # Extract keywords from query for better context retrieval
            keywords = extract_keywords_from_query(query)
            logger.info(f"Extracted keywords: {keywords}")
            
            # Classify the query to determine the appropriate prompt and context
            intent_type, confidence = self.intent_classifier.classify(query)
            logger.info(f"Classified query as {intent_type.name} with confidence {confidence:.2f}")
            
            # Get context based on intent type
            context_data, context_sources = await self._get_context_for_intent(query, intent_type, token_budget)
            
            # Check if we have valid context data - early exit if missing critical context
            debug_enabled = os.getenv('DEBUG_AI', 'false').lower() == 'true'
            
            if "_meta" in context_data and "missing_critical_sources" in context_data["_meta"]:
                missing = context_data["_meta"]["missing_critical_sources"]
                error_msg = f"Missing critical context sources: {missing}"
                logger.error(error_msg)
                
                # Only return error for missing critical context if not in debug mode
                if not debug_enabled:
                    return self._create_error_response(
                        f"I don't have enough information to answer your question about {missing[0]}. " + 
                        "The data source is currently unavailable."
                    )
            
            # Format the context as text for the prompt
            context_text = self._format_context_for_prompt(context_data)
            
            # Check if context is empty
            if not context_text or context_text.strip() == "":
                logger.warning("Context text is empty after formatting")
                
                # Only return error for empty context if not in debug mode
                if not debug_enabled:
                    return self._create_error_response(
                        f"I don't have enough information to answer your {intent_type.name.lower().replace('_', ' ')} question. " +
                        "Please try a different question or try again later."
                    )
            
            # Get the appropriate prompt for this intent
            system_prompt = get_prompt_for_intent(intent_type)
            logger.debug(f"Using prompt template for intent {intent_type.name}")
            
            # Create messages for the chat completion
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context Information:\n{context_text}\n\nUser Query: {query}"}
            ]
            
            # Make the API call
            logger.info(f"Calling OpenAI with model {model}, intent {intent_type.name}, and {len(context_sources)} context sources")
            response = await self.async_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            # Extract the response
            answer = response.choices[0].message.content
            
            # Calculate processing time
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            # Prepare extended metadata
            metadata = {
                "intent": intent_type.name,
                "confidence": confidence,
                "prompt_used": intent_type.name + "_PROMPT", 
                "context_sources": context_sources,
                "keywords": keywords,
                "processing_time_seconds": processing_time,
                "conversation_id": conversation_id,
                "timestamp": datetime.now().isoformat()
            }
            
            # Include debug info from context if available
            if "_meta" in context_data:
                metadata["context_meta"] = context_data["_meta"]
            
            # Include full context data for debugging if enabled
            if debug_enabled:
                metadata["debug_context"] = context_data
                metadata["debug_context_length"] = len(context_text)
            
            # Return the response with metadata
            return {
                "answer": answer,
                "metadata": metadata
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return self._create_error_response(f"I encountered an error while processing your request: {str(e)}")
    
    async def _get_context_for_intent(self, 
                                     query: str, 
                                     intent_type: IntentType, 
                                     token_budget: int) -> Tuple[Dict[str, Any], List[str]]:
        """
        Get appropriate context data based on intent type
        
        Args:
            query: User's query text
            intent_type: Classified intent type
            token_budget: Maximum tokens for context
            
        Returns:
            Tuple of (context_data, context_sources)
        """
        context_data = {}
        context_sources = []
        expected_sources = []  # Track what sources we expect for this intent
        
        # Add metadata about the intent
        context_data["_meta"] = {
            "intent": intent_type.name,
            "token_budget": token_budget,
            "timestamp": datetime.now().isoformat()
        }
        
        # Allocate token budget for different providers based on intent
        if intent_type == IntentType.PORTFOLIO_ANALYSIS:
            # Portfolio-focused query
            portfolio_budget = int(token_budget * 0.7)
            market_budget = int(token_budget * 0.2)
            news_budget = int(token_budget * 0.1)
            expected_sources.append("portfolio")  # Portfolio is critical for this intent
        elif intent_type in [IntentType.MARKET_PRICE, IntentType.MARKET_ANALYSIS]:
            # Market-focused query
            portfolio_budget = int(token_budget * 0.2)
            market_budget = int(token_budget * 0.7)
            news_budget = int(token_budget * 0.1)
            expected_sources.append("market")  # Market is critical for this intent
        elif intent_type == IntentType.NEWS_QUERY:
            # News-focused query
            portfolio_budget = int(token_budget * 0.1)
            market_budget = int(token_budget * 0.2)
            news_budget = int(token_budget * 0.7)
            expected_sources.append("news")  # News is critical for this intent
        else:
            # General or other intent type - balanced allocation
            portfolio_budget = int(token_budget * 0.4)
            market_budget = int(token_budget * 0.3)
            news_budget = int(token_budget * 0.3)
        
        # Get portfolio context if relevant to the intent
        if intent_type in [IntentType.PORTFOLIO_ANALYSIS, IntentType.GENERAL_QUERY, 
                          IntentType.RISK_ASSESSMENT, IntentType.TAX_ANALYSIS]:
            try:
                portfolio_context = await self.portfolio_context_provider.get_context(
                    query=query, 
                    token_budget=portfolio_budget
                )
                context_data["portfolio"] = portfolio_context
                context_sources.append("portfolio")
                logger.debug(f"Added portfolio context for intent {intent_type.name}")
            except Exception as e:
                logger.error(f"Error getting portfolio context: {str(e)}")
                # Add fallback context if main context retrieval fails
                try:
                    portfolio_context = await self.portfolio_context_provider.get_fallback_context(
                        query=query, 
                        token_budget=min(500, portfolio_budget)
                    )
                    context_data["portfolio"] = portfolio_context
                    context_sources.append("portfolio_fallback")
                    logger.debug(f"Added fallback portfolio context for intent {intent_type.name}")
                except Exception as fallback_err:
                    logger.error(f"Error getting fallback portfolio context: {str(fallback_err)}")
                    context_data["_meta"]["portfolio_error"] = str(e)
        
        # Get market context if relevant to the intent
        if intent_type in [IntentType.MARKET_PRICE, IntentType.MARKET_ANALYSIS, IntentType.GENERAL_QUERY, 
                          IntentType.TRADE_HISTORY, IntentType.TAX_ANALYSIS]:
            try:
                # Determine if we should include full market data
                include_all = intent_type in [IntentType.MARKET_PRICE, IntentType.MARKET_ANALYSIS, IntentType.TRADE_HISTORY]
                
                market_context = await self.market_context_provider.get_context(
                    query=query, 
                    token_budget=market_budget,
                    include_all=include_all
                )
                context_data["market"] = market_context
                context_sources.append("market")
                logger.debug(f"Added market context for intent {intent_type.name}")
            except Exception as e:
                logger.error(f"Error getting market context: {str(e)}")
                # Add fallback context if main context retrieval fails
                try:
                    market_context = await self.market_context_provider.get_fallback_context(
                        query=query, 
                        token_budget=min(500, market_budget)
                    )
                    context_data["market"] = market_context
                    context_sources.append("market_fallback")
                    logger.debug(f"Added fallback market context for intent {intent_type.name}")
                except Exception as fallback_err:
                    logger.error(f"Error getting fallback market context: {str(fallback_err)}")
                    context_data["_meta"]["market_error"] = str(e)
        
        # Get news context if relevant to the intent
        if intent_type in [IntentType.NEWS_QUERY, IntentType.GENERAL_QUERY, 
                          IntentType.MARKET_PRICE, IntentType.MARKET_ANALYSIS]:
            try:
                news_context = await self.news_context_provider.get_context(
                    query=query, 
                    token_budget=news_budget,
                    intent_type=intent_type
                )
                context_data["news"] = news_context
                context_sources.append("news")
                logger.debug(f"Added news context for intent {intent_type.name}")
            except Exception as e:
                logger.error(f"Error getting news context: {str(e)}")
                # Add fallback context if main context retrieval fails
                try:
                    news_context = await self.news_context_provider.get_fallback_context(
                        query=query, 
                        token_budget=min(500, news_budget)
                    )
                    context_data["news"] = news_context
                    context_sources.append("news_fallback")
                    logger.debug(f"Added fallback news context for intent {intent_type.name}")
                except Exception as fallback_err:
                    logger.error(f"Error getting fallback news context: {str(fallback_err)}")
                    context_data["_meta"]["news_error"] = str(e)
        
        # Add debug info in metadata
        if "_meta" in context_data:
            context_data["_meta"]["context_sources"] = context_sources
            context_data["_meta"]["expected_sources"] = expected_sources
            
            # Check for missing critical sources
            missing_critical = [src for src in expected_sources if src not in context_sources]
            if missing_critical:
                warning_msg = f"Missing critical context sources for {intent_type.name}: {missing_critical}"
                logger.warning(warning_msg)
                context_data["_meta"]["missing_critical_sources"] = missing_critical
                context_data["_meta"]["warning"] = warning_msg
            
            # Check if any context source is empty
            empty_sources = []
            for source in context_sources:
                base_source = source.replace("_fallback", "")  # Handle fallback source names
                if base_source in context_data and (
                    context_data[base_source] is None or 
                    (isinstance(context_data[base_source], dict) and not any(context_data[base_source].values())) or
                    (isinstance(context_data[base_source], list) and len(context_data[base_source]) == 0)
                ):
                    empty_sources.append(source)
                
            if empty_sources:
                warning_msg = f"Empty context sources: {empty_sources}"
                logger.warning(warning_msg)
                context_data["_meta"]["empty_sources"] = empty_sources
                context_data["_meta"]["warning"] = warning_msg
        
        return context_data, context_sources
    
    def _format_context_for_prompt(self, context_data: Dict[str, Any]) -> str:
        """
        Format context data as text for inclusion in prompt
        
        Args:
            context_data: Dictionary of context information
            
        Returns:
            Formatted text for prompt
        """
        # Create an array to hold all the formatted sections
        formatted_sections = []
        
        logger.debug(f"Formatting context data with keys: {list(context_data.keys())}")
        
        # Check for portfolio context
        if "portfolio" in context_data:
            portfolio = context_data["portfolio"]
            portfolio_section = "PORTFOLIO DATA:\n"
            
            if isinstance(portfolio, dict):
                # Add total value if available
                if "total_value" in portfolio:
                    portfolio_section += f"Total Portfolio Value: ${portfolio['total_value']:,.2f}\n"
                elif "totalValue" in portfolio:
                    portfolio_section += f"Total Portfolio Value: ${portfolio['totalValue']:,.2f}\n"
                    
                # Add other portfolio metrics if available
                metrics = {
                    "total_cost": "Total Cost Basis",
                    "totalCost": "Total Cost Basis",
                    "absolute_profit": "Total Profit/Loss",
                    "absoluteProfit": "Total Profit/Loss",
                    "percent_change": "Percent Change",
                    "percentChange": "Percent Change"
                }
                
                for key, label in metrics.items():
                    if key in portfolio and portfolio[key] is not None:
                        if isinstance(portfolio[key], (int, float)):
                            if key.endswith("percent") or key.endswith("Percent") or key.endswith("Change"):
                                portfolio_section += f"{label}: {portfolio[key]:.2f}%\n"
                            else:
                                portfolio_section += f"{label}: ${portfolio[key]:,.2f}\n"
                
                # Add assets if available
                if "assets" in portfolio and portfolio["assets"]:
                    portfolio_section += "\nHoldings:\n"
                    
                    # Sort assets by value (descending)
                    assets = sorted(portfolio["assets"], 
                                   key=lambda x: x.get("value", 0) if isinstance(x, dict) else 0, 
                                   reverse=True)
                    
                    for asset in assets:
                        if isinstance(asset, dict):
                            name = asset.get("name", "Unknown")
                            symbol = asset.get("symbol", "???")
                            amount = asset.get("amount", 0)
                            value = asset.get("value", 0)
                            
                            portfolio_section += f"- {name} ({symbol}): {amount:,.6f} tokens"
                            if isinstance(value, (int, float)):
                                portfolio_section += f", value: ${value:,.2f}\n"
                            else:
                                portfolio_section += "\n"
                
                # Add fallback message if no assets
                elif not portfolio.get("assets") or len(portfolio.get("assets", [])) == 0:
                    portfolio_section += "\nNo assets in portfolio.\n"
            
            # Add fallback message if portfolio data is not available
            else:
                portfolio_section += "No portfolio data available or unable to parse portfolio data.\n"
            
            formatted_sections.append(portfolio_section)
            logger.debug(f"Added portfolio section: {len(portfolio_section)} chars")
        
        # Check for market context
        if "market" in context_data:
            market = context_data["market"]
            market_section = "MARKET DATA:\n"
            
            if isinstance(market, dict):
                # Add global market stats if available
                if "global" in market and isinstance(market["global"], dict):
                    global_data = market["global"]
                    market_section += "Global Market Data:\n"
                    
                    # Add total market cap if available
                    if "total_market_cap" in global_data:
                        market_cap = global_data["total_market_cap"]
                        if isinstance(market_cap, (int, float)):
                            market_section += f"Total Market Cap: ${market_cap:,.0f}\n"
                    
                    # Add 24h volume if available
                    if "total_volume_24h" in global_data:
                        volume = global_data["total_volume_24h"]
                        if isinstance(volume, (int, float)):
                            market_section += f"24h Volume: ${volume:,.0f}\n"
                    
                    # Add BTC dominance if available
                    if "btc_dominance" in global_data:
                        dominance = global_data["btc_dominance"]
                        if isinstance(dominance, (int, float)):
                            market_section += f"BTC Dominance: {dominance:.2f}%\n"
                
                # Add top coins if available
                if "coins" in market and isinstance(market["coins"], list):
                    coins = market["coins"]
                    market_section += f"\nTop Cryptocurrencies (out of {len(coins)}):\n"
                    
                    # Show top 5 coins
                    for idx, coin in enumerate(coins[:5]):
                        if isinstance(coin, dict):
                            name = coin.get("name", "Unknown")
                            symbol = coin.get("symbol", "???").upper()
                            price = coin.get("current_price", 0)
                            change_24h = coin.get("price_change_percentage_24h", 0)
                            
                            market_section += f"{idx+1}. {name} ({symbol}): "
                            if isinstance(price, (int, float)):
                                market_section += f"${price:,.6f}" if price < 1 else f"${price:,.2f}"
                            
                            if isinstance(change_24h, (int, float)):
                                direction = "+" if change_24h >= 0 else ""
                                market_section += f" ({direction}{change_24h:.2f}%)\n"
                            else:
                                market_section += "\n"
                
                # Add market trends if available
                if "trends" in market and isinstance(market["trends"], dict):
                    trends = market["trends"]
                    market_section += "\nMarket Trends:\n"
                    
                    for key, value in trends.items():
                        market_section += f"- {key.replace('_', ' ').title()}: {value}\n"
            
            # Add fallback message if market data is not available
            else:
                market_section += "No market data available or unable to parse market data.\n"
            
            formatted_sections.append(market_section)
            logger.debug(f"Added market section: {len(market_section)} chars")
        
        # Check for news context
        if "news" in context_data:
            news = context_data["news"]
            news_section = "RECENT NEWS:\n"
            
            # Validate news data structure and handle both attribute and dictionary access
            crypto_news = []
            if isinstance(news, dict):
                # Dictionary-style access
                if "crypto" in news and isinstance(news["crypto"], list):
                    crypto_news = news["crypto"]
                    
                # Process macro and reddit news
                macro_data = news.get("macro", {})
                reddit_data = news.get("reddit", [])
            # Fallback in case news is not a dictionary
            else:
                news_section += "No valid news data available or unable to parse news data.\n"
                crypto_news = []
                macro_data = {}
                reddit_data = []
            
            # Add crypto news
            if crypto_news:
                news_section += "\nCrypto News Headlines:\n"
                for idx, item in enumerate(crypto_news[:5]):
                    if isinstance(item, dict):
                        title = item.get("title", "No title")
                        source = item.get("source", "Unknown source")
                        news_section += f"{idx+1}. {title} (Source: {source})\n"
            
            # Add macro news by category
            if isinstance(macro_data, dict) and macro_data:
                for category, items in macro_data.items():
                    if isinstance(items, list) and items:
                        news_section += f"\n{category.title()} News:\n"
                        for idx, item in enumerate(items[:3]):
                            if isinstance(item, dict):
                                title = item.get("title", "No title")
                                source = item.get("source", "Unknown source")
                                news_section += f"{idx+1}. {title} (Source: {source})\n"
            elif isinstance(macro_data, list) and macro_data:
                news_section += "\nMacro News:\n"
                for idx, item in enumerate(macro_data[:5]):
                    if isinstance(item, dict):
                        title = item.get("title", "No title")
                        source = item.get("source", "Unknown source")
                        news_section += f"{idx+1}. {title} (Source: {source})\n"
            
            # Add reddit posts
            if isinstance(reddit_data, list) and reddit_data:
                news_section += "\nReddit Discussions:\n"
                for idx, item in enumerate(reddit_data[:3]):
                    if isinstance(item, dict):
                        title = item.get("title", "No title")
                        subreddit = item.get("subreddit", "Unknown subreddit")
                        news_section += f"{idx+1}. {title} (r/{subreddit})\n"
            
            # Add keywords that were used for searching
            if isinstance(news, dict) and "keywords_used" in news and news["keywords_used"]:
                keywords = news["keywords_used"]
                news_section += f"News Search Keywords: {', '.join(keywords)}\n\n"
            
            # Add fallback message if no news found
            if isinstance(news, dict) and "fallback_message" in news:
                news_section += f"Note: {news['fallback_message']}\n\n"
            
            formatted_sections.append(news_section)
            logger.debug(f"Added news section: {len(news_section)} chars")
        
        # Add metadata section if debug is enabled
        debug_enabled = os.getenv('DEBUG_AI', 'false').lower() == 'true'
        if debug_enabled and "_meta" in context_data:
            meta_section = "\nDEBUG METADATA:\n"
            meta_data = context_data["_meta"]
            for key, value in meta_data.items():
                if key != "context_debug":  # Skip the raw context debug data
                    meta_section += f"{key}: {value}\n"
            formatted_sections.append(meta_section)
            logger.debug("Added debug metadata section")
        
        # Join all sections and return the formatted context
        formatted_context = "\n".join(formatted_sections)
        
        # Check if the formatted context is empty or too short
        context_length = len(formatted_context)
        if context_length == 0:
            warning_msg = "Formatted context is empty"
            logger.warning(warning_msg)
            return "NO CONTEXT AVAILABLE. The system could not retrieve any relevant information for your query."
        
        if context_length < 50 and not debug_enabled:
            warning_msg = f"Formatted context is very short ({context_length} chars)"
            logger.warning(warning_msg)
            return f"{formatted_context}\n\nWARNING: Limited context available for this query."
        
        logger.info(f"Formatted context with {context_length} characters across {len(formatted_sections)} sections")
        return formatted_context
    
    def _create_error_response(self, error_message: str) -> Dict[str, Any]:
        """
        Create a standardized error response
        
        Args:
            error_message: Error message to include
            
        Returns:
            Error response dictionary
        """
        return {
            "answer": error_message,
            "metadata": {
                "intent": "ERROR",
                "prompt_used": "ERROR",
                "context_sources": [],
                "error": True,
                "timestamp": datetime.now().isoformat()
            }
        }

    def _initialize_context_registry(self):
        """Initialize context registry with providers and supported intents"""
        from app.services.ai.context_registry import ContextRegistry, ContextPriority
        
        # Get global context registry
        self.context_registry = ContextRegistry()
        
        # Register market context provider
        self.context_registry.register_provider(
            provider_id="market",
            provider_instance=self.market_context_provider,
            supports_intents=[
                IntentType.MARKET_PRICE,
                IntentType.MARKET_ANALYSIS,  # Add explicit support for MARKET_ANALYSIS
                IntentType.GENERAL_QUERY,
                IntentType.TRADE_HISTORY,
                IntentType.TAX_ANALYSIS
            ],
            priority=ContextPriority.HIGH,
            max_tokens=2000
        )
        
        # Register portfolio context provider
        self.context_registry.register_provider(
            provider_id="portfolio",
            provider_instance=self.portfolio_context_provider,
            supports_intents=[
                IntentType.PORTFOLIO_ANALYSIS,  # Main intent type for portfolio
                IntentType.GENERAL_QUERY,
                IntentType.RISK_ASSESSMENT,
                IntentType.TAX_ANALYSIS
            ],
            priority=ContextPriority.HIGH,
            max_tokens=2000
        )
        
        # Register news context provider
        self.context_registry.register_provider(
            provider_id="news",
            provider_instance=self.news_context_provider,
            supports_intents=[
                IntentType.NEWS_QUERY,
                IntentType.GENERAL_QUERY,
                IntentType.MARKET_PRICE,
                IntentType.MARKET_ANALYSIS  # Add support for MARKET_ANALYSIS
            ],
            priority=ContextPriority.MEDIUM,
            max_tokens=1500
        )
        
        logger.info("Context registry initialized with providers")

# Global instance of the OpenAI service
_openai_service_instance = None

def get_openai_service():
    """
    Get or initialize the global OpenAI service instance
    """
    global _openai_service_instance
    if _openai_service_instance is None:
        _openai_service_instance = OpenAIService()
    return _openai_service_instance

def get_openai_client():
    """
    Get an initialized OpenAI client instance
    """
    service = get_openai_service()
    if service.async_client is None:
        service._initialize_client()
    return service.async_client
