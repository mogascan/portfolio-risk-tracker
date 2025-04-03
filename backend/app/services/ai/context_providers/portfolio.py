"""
Portfolio context provider for AI queries
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from app.core.logging import get_logger
from app.services.ai.context_providers.base import BaseContextProvider
from app.services.ai.utils.keyword_extractor import extract_keywords_from_query
from app.services.portfolio.portfolio_service import PortfolioService

# Initialize logger
logger = get_logger(__name__)

class PortfolioContextProvider(BaseContextProvider):
    """
    Context provider for portfolio data.
    
    Retrieves and formats portfolio information based on the user's query.
    """
    
    def __init__(self, portfolio_service: PortfolioService = None):
        """Initialize the portfolio context provider"""
        super().__init__()
        self.portfolio_service = portfolio_service or PortfolioService()
        logger.info("Portfolio context provider initialized")
    
    async def get_context(self, query: str, token_budget: int = 2000) -> Dict[str, Any]:
        """
        Get portfolio context for a query.
        
        Args:
            query: User's query text
            token_budget: Maximum tokens to use
            
        Returns:
            Dictionary containing portfolio context data
        """
        logger.info(f"Getting portfolio context for query: '{query}' with token budget: {token_budget}")
        
        # Extract keywords from query
        keywords = extract_keywords_from_query(query)
        logger.info(f"Extracted {len(keywords)} keywords: {keywords}")
        
        # Initialize structure to hold portfolio data
        portfolio_data = {
            "overview": {},
            "holdings": [],
            "transactions": [],
            "performance": {},
            "allocation": {},
            "targeted_holdings": [],
            "keywords_used": keywords,
            "metadata": {
                        "query_time": datetime.now().isoformat(),
                "tokens_used": 0
            }
        }
        
        # Determine what aspects of the portfolio to include based on keywords
        include_transactions = self._should_include_transactions(keywords)
        include_performance = self._should_include_performance(keywords)
        include_allocation = self._should_include_allocation(keywords)
        
        # Get portfolio overview (always include this)
        overview = await self._get_portfolio_overview()
        if overview:
            portfolio_data["overview"] = overview
        
        # Get holdings (always include this)
        holdings = await self._get_holdings()
        if holdings:
            portfolio_data["holdings"] = holdings
            
            # Check if any specific holdings were mentioned in the query
            mentioned_holdings = self._find_mentioned_holdings(holdings, keywords)
            if mentioned_holdings:
                portfolio_data["targeted_holdings"] = mentioned_holdings
                logger.info(f"Found {len(mentioned_holdings)} holdings mentioned in query")
        
        # Track token usage
        tokens_used = self._estimate_tokens(portfolio_data)
        
        # Add performance data if requested and within token budget
        if include_performance and tokens_used < token_budget - 300:
            performance = await self._get_performance()
            if performance:
                portfolio_data["performance"] = performance
                tokens_used = self._estimate_tokens(portfolio_data)
        
        # Add allocation data if requested and within token budget
        if include_allocation and tokens_used < token_budget - 200:
            allocation = await self._get_allocation()
            if allocation:
                portfolio_data["allocation"] = allocation
                tokens_used = self._estimate_tokens(portfolio_data)
        
        # Add transaction history if requested and within token budget
        if include_transactions and tokens_used < token_budget - 500:
            # Get recent transactions relevant to the query
            transactions = await self._get_transactions(keywords)
            if transactions:
                # Limit transactions to fit within budget
                max_transactions = min(len(transactions), 10)  # Limit to 10 max
                portfolio_data["transactions"] = transactions[:max_transactions]
                tokens_used = self._estimate_tokens(portfolio_data)
        
        # Update metadata with token usage
        portfolio_data["metadata"]["tokens_used"] = tokens_used
        
        # Check if context is empty or insufficient
        has_overview = bool(portfolio_data.get("overview"))
        has_holdings = bool(portfolio_data.get("holdings"))
        
        if not has_overview and not has_holdings:
            warning_msg = f"Portfolio context for query '{query}' is empty or insufficient"
            logger.warning(warning_msg)
            portfolio_data["metadata"]["warning"] = warning_msg
            
            # For portfolio queries, this is a critical error
            if any(kw in query.lower() for kw in ["portfolio", "holding", "my", "own", "have", "value"]):
                raise ValueError(f"Empty portfolio context for query: {query}. No holdings or overview data could be fetched.")
        
        logger.info(f"Portfolio context generated with ~{tokens_used} tokens")
        return portfolio_data
    
    async def get_fallback_context(self, query: str, token_budget: int = 500) -> Dict[str, Any]:
        """
        Get minimal portfolio context for fallback use.
        
        Args:
            query: User's query
            token_budget: Maximum tokens to use
            
        Returns:
            Dictionary with minimal portfolio context
        """
        logger.info(f"Getting fallback portfolio context with budget: {token_budget}")
        
        # Create a simplified context with just the most important data
        context = {
            "overview": {},
            "top_holdings": []
        }
        
        # Get portfolio overview
        overview = await self._get_portfolio_overview()
        if overview:
            context["overview"] = overview
        
        # Get top holdings only
        holdings = await self._get_holdings()
        if holdings:
            # Sort by value and take top 3
            sorted_holdings = sorted(holdings, key=lambda x: x.get("value", 0), reverse=True)
            context["top_holdings"] = sorted_holdings[:3]
        
        return context
    
    def _should_include_transactions(self, keywords: List[str]) -> bool:
        """
        Determine if transaction history should be included based on keywords.
        
        Args:
            keywords: Keywords extracted from query
            
        Returns:
            True if transactions should be included
        """
        transaction_keywords = {
            "transaction", "transactions", "history", "purchase", "bought", "sold", 
            "buy", "sell", "trade", "trading", "deposit", "withdrawal", "transfer"
        }
        
        return any(kw.lower() in transaction_keywords for kw in keywords)
    
    def _should_include_performance(self, keywords: List[str]) -> bool:
        """
        Determine if performance data should be included based on keywords.
        
        Args:
            keywords: Keywords extracted from query
            
        Returns:
            True if performance should be included
        """
        performance_keywords = {
            "performance", "return", "returns", "profit", "loss", "gain", "roi", 
            "growth", "value", "earning", "earnings", "change", "pnl", "yield"
        }
        
        return any(kw.lower() in performance_keywords for kw in keywords)
    
    def _should_include_allocation(self, keywords: List[str]) -> bool:
        """
        Determine if allocation data should be included based on keywords.
        
        Args:
            keywords: Keywords extracted from query
            
        Returns:
            True if allocation should be included
        """
        allocation_keywords = {
            "allocation", "distribution", "breakdown", "diversification", "spread", 
            "asset", "assets", "balance", "split", "percentage", "percent", "composition"
        }
        
        return any(kw.lower() in allocation_keywords for kw in keywords)
    
    def _find_mentioned_holdings(self, holdings: List[Dict[str, Any]], keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Find holdings that are mentioned in the query keywords.
        
        Args:
            holdings: List of portfolio holdings
            keywords: Keywords extracted from query
            
        Returns:
            List of holdings that match keywords
        """
        mentioned_holdings = []
        
        for holding in holdings:
            coin_name = holding.get("name", "").lower()
            coin_symbol = holding.get("symbol", "").lower()
            coin_id = holding.get("id", "").lower()
            
            # Check if any keyword matches this holding
            for keyword in keywords:
                keyword_lower = keyword.lower()
                if (keyword_lower in coin_name or 
                    keyword_lower == coin_symbol or 
                    keyword_lower in coin_id or
                    coin_symbol in keyword_lower):
                    mentioned_holdings.append(holding)
                    logger.info(f"Matched holding '{coin_name} ({coin_symbol})' with keyword '{keyword}'")
                    break
        
        return mentioned_holdings
    
    async def _get_portfolio_overview(self) -> Dict[str, Any]:
        """
        Get portfolio overview data.
        
        Returns:
            Dictionary with portfolio overview
        """
        try:
            overview = await self.portfolio_service.get_portfolio_overview()
            if overview:
                return {
                    "total_value": overview.get("total_value"),
                    "daily_change_percent": overview.get("daily_change_percent"),
                    "daily_change_value": overview.get("daily_change_value"),
                    "total_assets": overview.get("total_assets"),
                    "last_updated": overview.get("last_updated")
                }
                return {}
        except Exception as e:
            logger.error(f"Error getting portfolio overview: {str(e)}")
            return {}

    async def _get_holdings(self) -> List[Dict[str, Any]]:
        """
        Get portfolio holdings.
        
        Returns:
            List of portfolio holdings
        """
        try:
            holdings = await self.portfolio_service.get_holdings()
            if holdings:
                formatted_holdings = []
                for holding in holdings:
                    formatted_holding = {
                        "id": holding.get("id"),
                        "name": holding.get("name"),
                        "symbol": holding.get("symbol"),
                        "amount": holding.get("amount"),
                        "value": holding.get("value"),
                        "price": holding.get("price"),
                        "daily_change_percent": holding.get("daily_change_percent"),
                        "allocation_percent": holding.get("allocation_percent")
                    }
                    formatted_holdings.append(formatted_holding)
                return formatted_holdings
            return []
        except Exception as e:
            logger.error(f"Error getting portfolio holdings: {str(e)}")
            return []

    async def _get_transactions(self, keywords: List[str] = None) -> List[Dict[str, Any]]:
        """
        Get transaction history, filtered by keywords if provided.
        
        Args:
            keywords: Keywords to filter transactions
            
        Returns:
            List of transactions
        """
        try:
            all_transactions = await self.portfolio_service.get_transactions(limit=20)
            
            # If keywords provided, filter transactions that might be relevant
            if keywords and all_transactions:
                # Extract specific coin names/symbols from keywords
                coin_keywords = set()
                for kw in keywords:
                    kw_lower = kw.lower()
                    # Common cryptocurrency names and symbols
                    if kw_lower in {"bitcoin", "btc", "ethereum", "eth", "solana", "sol", 
                                    "cardano", "ada", "usdt", "tether", "usdc", "bnb", 
                                    "xrp", "doge", "dogecoin", "polkadot", "dot", "polygon", "matic"}:
                        coin_keywords.add(kw_lower)
                
                # Look for transaction types in keywords
                transaction_types = set()
                type_keywords = {
                    "buy": "purchase", "purchase": "purchase", "bought": "purchase",
                    "sell": "sale", "sold": "sale", "trade": "trade",
                    "deposit": "deposit", "withdrawal": "withdrawal", "transfer": "transfer"
                }
                
                for kw in keywords:
                    kw_lower = kw.lower()
                    if kw_lower in type_keywords:
                        transaction_types.add(type_keywords[kw_lower])
                
                # Filter transactions
                filtered_transactions = []
                for tx in all_transactions:
                    tx_coin = tx.get("coin_id", "").lower()
                    tx_symbol = tx.get("symbol", "").lower()
                    tx_type = tx.get("type", "").lower()
                    
                    # Include if coin matches or transaction type matches
                    if (not coin_keywords and not transaction_types) or \
                       (coin_keywords and (tx_coin in coin_keywords or tx_symbol in coin_keywords)) or \
                       (transaction_types and tx_type in transaction_types):
                        filtered_transactions.append(tx)
                
                logger.info(f"Filtered {len(filtered_transactions)} transactions from {len(all_transactions)} total based on keywords")
                return filtered_transactions
            
            return all_transactions
        except Exception as e:
            logger.error(f"Error getting transaction history: {str(e)}")
            return []
    
    async def _get_performance(self) -> Dict[str, Any]:
        """
        Get portfolio performance data.
        
        Returns:
            Dictionary with performance data
        """
        try:
            performance = await self.portfolio_service.get_performance()
            if performance:
                return {
                    "total_profit_loss": performance.get("total_profit_loss"),
                    "percent_change": performance.get("percent_change"),
                    "daily_change": performance.get("daily_change"),
                    "weekly_change": performance.get("weekly_change"),
                    "monthly_change": performance.get("monthly_change"),
                    "yearly_change": performance.get("yearly_change"),
                    "best_performing_asset": performance.get("best_performing_asset"),
                    "worst_performing_asset": performance.get("worst_performing_asset")
                }
            return {}
        except Exception as e:
            logger.error(f"Error getting portfolio performance: {str(e)}")
            return {}

    async def _get_allocation(self) -> Dict[str, Any]:
        """
        Get portfolio allocation data.
        
        Returns:
            Dictionary with allocation data
        """
        try:
            allocation = await self.portfolio_service.get_allocation()
            if allocation:
                return {
                    "by_asset": allocation.get("by_asset"),
                    "by_category": allocation.get("by_category"),
                    "by_risk": allocation.get("by_risk")
                }
            return {}
        except Exception as e:
            logger.error(f"Error getting portfolio allocation: {str(e)}")
            return {}
    
    def _estimate_tokens(self, data: Dict[str, Any]) -> int:
        """
        Estimate the number of tokens used by the data.
        
        Args:
            data: Dictionary of data to estimate tokens for
            
        Returns:
            Estimated token count
        """
        # Serialize to JSON string and count roughly 4 chars per token
        import json
        json_str = json.dumps(data)
        return len(json_str) // 4 