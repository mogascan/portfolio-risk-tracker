# backend/app/services/ai/portfolio_analysis.py
import logging
import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

# In a real application, these would be actual service imports
# from app.services.exchanges.binance import BinanceService
# from app.services.exchanges.coinbase import CoinbaseService
# from app.services.blockchain.eth import EthereumService
# from app.services.market_data.coingecko import CoinGeckoService

logger = logging.getLogger(__name__)

class PortfolioAnalysisService:
    """Service for analyzing portfolio data to provide context for AI"""
    
    def __init__(self):
        self.base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        # In a real application, initialize actual services
        # self.binance_service = BinanceService()
        # self.coinbase_service = CoinbaseService()
        # self.ethereum_service = EthereumService()
        # self.market_data_service = CoinGeckoService()
    
    async def get_portfolio_context(self) -> Dict[str, Any]:
        """
        Get comprehensive portfolio context for AI queries
        
        Returns:
            Dictionary with portfolio context data
        """
        try:
            # Load data from various JSON files
            portfolio_data = self._load_json_file('user_portfolio_holdings.json')
            watchlist_data = self._load_json_file('watchlist.json')
            crypto_news = self._load_json_file('crypto_news.json')
            macro_news = self._load_json_file('macro_news.json')
            social_feeds = self._load_json_file('social_feeds.json')
            
            # Combine all context into a single dictionary
            context = {
                "portfolio": portfolio_data,
                "watchlist": watchlist_data,
                "market_data": {
                    "crypto_news": crypto_news,
                    "macro_news": macro_news,
                    "social_sentiment": social_feeds
                },
                "timestamp": datetime.now().isoformat()
            }
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting portfolio context: {str(e)}")
            # Return mock data if there's an error
            return self._get_mock_portfolio_context()
    
    async def get_asset_data(self, asset_id: str) -> Dict[str, Any]:
        """
        Get detailed data for a specific asset
        
        Args:
            asset_id: The asset to analyze
            
        Returns:
            Dictionary with asset data
        """
        try:
            # Load portfolio data
            portfolio_data = self._load_json_file('user_portfolio_holdings.json')
            
            # Find the specific asset in the portfolio
            asset_data = None
            if isinstance(portfolio_data, dict) and "holdings" in portfolio_data:
                for holding in portfolio_data["holdings"]:
                    if holding.get("asset_id", "").lower() == asset_id.lower():
                        asset_data = holding
                        break
            
            if not asset_data:
                return self._get_mock_asset_data(asset_id)
            
            # Load additional context
            crypto_news = self._load_json_file('crypto_news.json')
            social_feeds = self._load_json_file('social_feeds.json')
            
            # Filter news and social sentiment for this asset
            asset_news = self._filter_news_for_asset(crypto_news, asset_id)
            asset_sentiment = self._filter_sentiment_for_asset(social_feeds, asset_id)
            
            # Combine all asset data
            return {
                "holding": asset_data,
                "news": asset_news,
                "social_sentiment": asset_sentiment,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting asset data: {str(e)}")
            return self._get_mock_asset_data(asset_id)
    
    def _load_json_file(self, filename: str) -> Any:
        """Load data from a JSON file"""
        try:
            file_path = os.path.join(self.base_path, filename)
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            logger.error(f"Error loading {filename}: {str(e)}")
            return {}
    
    def _filter_news_for_asset(self, news_data: Any, asset_id: str) -> List[Dict[str, Any]]:
        """Filter news items relevant to a specific asset"""
        try:
            asset_news = []
            if isinstance(news_data, dict) and "articles" in news_data:
                for article in news_data["articles"]:
                    if asset_id.lower() in article.get("title", "").lower() or \
                       asset_id.lower() in article.get("description", "").lower():
                        asset_news.append(article)
            return asset_news[:5]  # Return only the 5 most recent relevant articles
        except Exception as e:
            logger.error(f"Error filtering news for {asset_id}: {str(e)}")
            return []
    
    def _filter_sentiment_for_asset(self, social_data: Any, asset_id: str) -> Dict[str, Any]:
        """Filter social sentiment data for a specific asset"""
        try:
            sentiment = {
                "positive": 0,
                "neutral": 0,
                "negative": 0,
                "recent_mentions": []
            }
            
            if isinstance(social_data, dict) and "posts" in social_data:
                for post in social_data["posts"]:
                    if asset_id.lower() in post.get("content", "").lower():
                        sentiment[post.get("sentiment", "neutral")] += 1
                        if len(sentiment["recent_mentions"]) < 5:
                            sentiment["recent_mentions"].append({
                                "content": post.get("content"),
                                "sentiment": post.get("sentiment"),
                                "platform": post.get("platform"),
                                "timestamp": post.get("timestamp")
                            })
            
            return sentiment
        except Exception as e:
            logger.error(f"Error filtering sentiment for {asset_id}: {str(e)}")
            return {"positive": 0, "neutral": 0, "negative": 0, "recent_mentions": []}
    
    def _get_mock_portfolio_context(self) -> Dict[str, Any]:
        """Generate mock portfolio context for development"""
        return {
            "portfolio": {
                "total_value": 25000,
                "holdings": [
                    {"asset_id": "btc", "symbol": "BTC", "amount": 0.25, "price": 40000, "value": 10000, "price_change_24h": 2.5},
                    {"asset_id": "eth", "symbol": "ETH", "amount": 2.5, "price": 3000, "value": 7500, "price_change_24h": 3.2},
                    {"asset_id": "usdt", "symbol": "USDT", "amount": 5000, "price": 1, "value": 5000, "price_change_24h": 0.1},
                    {"asset_id": "sol", "symbol": "SOL", "amount": 25, "price": 100, "value": 2500, "price_change_24h": -1.5}
                ]
            },
            "watchlist": ["dot", "link", "ada", "matic"],
            "market_data": {
                "crypto_news": [],
                "macro_news": [],
                "social_sentiment": {}
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def _get_mock_asset_data(self, asset_id: str) -> Dict[str, Any]:
        """Generate mock asset data for development"""
        mock_data = {
            "btc": {
                "holding": {
                    "asset_id": "btc",
                    "symbol": "BTC",
                    "amount": 0.25,
                    "price": 40000,
                    "value": 10000,
                    "price_change_24h": 2.5,
                    "cost_basis": 32000,
                    "unrealized_pnl": 2000
                }
            },
            "eth": {
                "holding": {
                    "asset_id": "eth",
                    "symbol": "ETH",
                    "amount": 2.5,
                    "price": 3000,
                    "value": 7500,
                    "price_change_24h": 3.2,
                    "cost_basis": 2800,
                    "unrealized_pnl": 500
                }
            }
        }
        
        return mock_data.get(asset_id.lower(), {
            "holding": {
                "asset_id": asset_id,
                "symbol": asset_id.upper(),
                "amount": 0,
                "price": 0,
                "value": 0,
                "price_change_24h": 0
            }
        })