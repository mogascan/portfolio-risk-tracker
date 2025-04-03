"""
Market data context provider for AI service.

This module provides cryptocurrency market data as context for AI responses,
focusing on price information, market trends, and related metrics.
"""
import json
import logging
import os
from typing import Dict, List, Any, Optional
from datetime import datetime

from app.core.logging import get_logger
from app.services.ai.context_providers.base import BaseContextProvider
from app.services.market_data import MarketDataService
from app.services.coingecko import CoinGeckoService
from app.services.ai.utils.keyword_extractor import extract_keywords_from_query

# Initialize logger
logger = get_logger(__name__)

class MarketContextProvider(BaseContextProvider):
    """
    Market context provider that retrieves and formats cryptocurrency
    price data and market trends for AI context.
    """
    
    def __init__(self):
        """Initialize the market context provider with necessary services"""
        super().__init__()
        self.market_service = MarketDataService()
        self.coingecko_service = CoinGeckoService()
        
        # Update to use consolidated data directory path
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))), "data")
        self.market_data_file = os.path.join(self.data_dir, "market_data.json")
        logger.info(f"MarketContextProvider initialized with data_dir: {self.data_dir}")
        logger.info(f"Market data file path: {self.market_data_file}")

    async def get_context(self, query: str, token_budget: int, include_all: bool = False) -> Dict[str, Any]:
        """
        Retrieve and format market data based on the query.
        
        Args:
            query: The user's query to target relevant market data
            token_budget: Maximum number of tokens to use
            include_all: Whether to include all market data regardless of query
            
        Returns:
            Dictionary containing market context data
        """
        logger.info(f"Getting market context for query: {query} with token budget: {token_budget}")
        start_time = datetime.now()
        
        # Extract keywords from query
        keywords = extract_keywords_from_query(query)
        logger.info(f"Extracted {len(keywords)} keywords: {keywords}")
        
        # Initialize market data with empty containers
        market_data = {
            "crypto_prices": {},
            "market_indexes": {},
            "trending_coins": [],
            "gainers_losers": {
                "top_gainers": [],
                "top_losers": []
            },
            "global_market_cap": None,
            "bitcoin_dominance": None,
            "eth_gas_price": None,
            "coins_mentioned": []
        }
        
        # Always include global market stats (small token cost)
        global_data = await self._get_global_market_data()
        if global_data:
            market_data.update(global_data)
                        
        # Get top cryptocurrencies by market cap
        coin_ids = []
        tokens_used = self._estimate_tokens(market_data)
        
        # Always include Bitcoin and Ethereum if there's room
        if tokens_used < token_budget - 200:
            bitcoin_data = await self._get_coin_data("bitcoin")
            if bitcoin_data:
                market_data["crypto_prices"]["bitcoin"] = bitcoin_data
                coin_ids.append("bitcoin")
                tokens_used = self._estimate_tokens(market_data)
        
        if tokens_used < token_budget - 200:
            ethereum_data = await self._get_coin_data("ethereum")
            if ethereum_data:
                market_data["crypto_prices"]["ethereum"] = ethereum_data
                coin_ids.append("ethereum")
                tokens_used = self._estimate_tokens(market_data)
        
        # Add coins specifically mentioned in the query
        if not include_all:
            # Extract coin names from keywords
            identified_coins = self._identify_coins_from_keywords(keywords)
            logger.info(f"Identified coins from keywords: {identified_coins}")
                
            # Add data for mentioned coins that we haven't already included
            for coin_id in identified_coins:
                if coin_id not in coin_ids and tokens_used < token_budget - 150:
                    coin_data = await self._get_coin_data(coin_id)
                    if coin_data:
                        market_data["crypto_prices"][coin_id] = coin_data
                        coin_ids.append(coin_id)
                        tokens_used = self._estimate_tokens(market_data)
            
            # Record which coins were mentioned and included
            market_data["coins_mentioned"] = coin_ids
        else:
            # If include_all is True, get all top coins within token budget
            top_coins = await self._get_top_coins(10)
            for coin in top_coins:
                coin_id = coin.get("id")
                if coin_id and coin_id not in coin_ids and tokens_used < token_budget - 150:
                    coin_data = await self._get_coin_data(coin_id)
                    if coin_data:
                        market_data["crypto_prices"][coin_id] = coin_data
                        coin_ids.append(coin_id)
                        tokens_used = self._estimate_tokens(market_data)
        
        # Add trending coins if there's room and the query seems to want trending info
        if (include_all or any(kw in ["trending", "popular", "hot", "hype"] for kw in keywords)) and tokens_used < token_budget - 300:
            trending = await self._get_trending_coins(5)
            if trending:
                market_data["trending_coins"] = trending
                tokens_used = self._estimate_tokens(market_data)
        
        # Add top gainers and losers if there's room and the query seems relevant
        gainers_losers_keywords = ["gainers", "losers", "performing", "performance", "change", "changed", "movers"]
        if (include_all or any(kw in gainers_losers_keywords for kw in keywords)) and tokens_used < token_budget - 300:
            gainers_losers = await self._get_gainers_losers(5)
            if gainers_losers:
                market_data["gainers_losers"] = gainers_losers
                tokens_used = self._estimate_tokens(market_data)
                    
        # Add ETH gas prices if there's room and the query is about gas or fees
        gas_keywords = ["gas", "fee", "fees", "transaction", "eth", "ethereum", "gwei"]
        if (include_all or any(kw in gas_keywords for kw in keywords)) and tokens_used < token_budget - 100:
            gas_data = await self._get_eth_gas_price()
            if gas_data:
                market_data["eth_gas_price"] = gas_data
        
        # Add stock market indexes if there's room and the query seems to want broader market context
        index_keywords = ["stocks", "stock", "market", "index", "indices", "s&p", "dow", "nasdaq", "traditional"]
        if (include_all or any(kw in index_keywords for kw in keywords)) and tokens_used < token_budget - 300:
            indexes = await self._get_market_indexes()
            if indexes:
                market_data["market_indexes"] = indexes
        
        logger.info(f"Market context built with {len(market_data['crypto_prices'])} coins, using approximately {tokens_used} tokens")
        
        # Include metadata about token usage
        market_data["_metadata"] = {  # type: ignore
            "source": "market",
            "status": "live",
            "query_time": start_time.isoformat(),
            "tokens_used": tokens_used,
            "token_budget": token_budget
        }
        
        # Calculate execution time and update metadata
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds()
        market_data["_metadata"]["execution_time_seconds"] = execution_time  # type: ignore
        market_data["_metadata"]["estimated_tokens"] = tokens_used  # type: ignore
        
        logger.info(f"Market context generation completed in {execution_time:.2f} seconds, estimated tokens: {tokens_used}")
        
        # Check if context is empty or insufficient
        has_data = bool(market_data.get("crypto_prices") or market_data.get("trending_coins") or 
                        (market_data.get("gainers_losers", {}).get("top_gainers")) or 
                        (market_data.get("gainers_losers", {}).get("top_losers")))
        
        if not has_data:
            warning_msg = f"Market context for query '{query}' is empty or insufficient"
            logger.warning(warning_msg)
            market_data["_metadata"]["warning"] = warning_msg
            
            if include_all:  # Only raise error if this is supposed to be a full market query
                raise ValueError(f"Empty market context for query: {query}. No price data could be fetched.")
        
        return market_data

    async def get_fallback_context(self, query: str, token_budget: int, requested_symbols: List[str] = None) -> Dict[str, Any]:
        """
        Provide fallback context when main data sources are unavailable.
        
        Args:
            query: The user's query
            token_budget: Maximum tokens to use
            requested_symbols: Symbols that were requested in the query
            
        Returns:
            Dictionary with basic market data
        """
        logger.info("Using fallback market context")
        start_time = datetime.now()
        
        # Check if this is a specific coin query first
        has_specific_coin_query = requested_symbols and len(requested_symbols) > 0
        
        # Simple mock data for core cryptocurrencies
        fallback_data = {
            "market": {
                "coins": [
                    {
                        "symbol": "BTC",
                        "name": "Bitcoin",
                        "current_price": 67500.0,
                        "price_change_percentage_24h": 2.5,
                        "market_cap": 1320000000000,
                    },
                    {
                        "symbol": "ETH",
                        "name": "Ethereum",
                        "current_price": 3250.0,
                        "price_change_percentage_24h": 1.8,
                        "market_cap": 375000000000,
                    },
                    {
                        "symbol": "USDT",
                        "name": "Tether",
                        "current_price": 1.0,
                        "price_change_percentage_24h": 0.1,
                        "market_cap": 95000000000,
                    }
                ],
                "overview": {
                    "totalMarketCapUsd": 2350000000000,
                    "btcDominance": 56.2,
                    "ethDominance": 16.0,
                    "lastUpdated": datetime.now().isoformat()
                },
                "_metadata": {
                    "source": "market",
                    "status": "fallback",
                    "query_time": datetime.now().isoformat(),
                    "reason": "Error retrieving live market data",
                    "coin_symbols_requested": requested_symbols,
                    "is_specific_coin_query": has_specific_coin_query
                }
            }
        }
        
        # Add not found messages for any specifically requested coins that aren't in the fallback data
        not_found_messages = []
        not_found_symbols = []
        
        if requested_symbols:
            fallback_symbols = [coin["symbol"].upper() for coin in fallback_data["market"]["coins"]]
            fallback_names = [coin["name"].lower() for coin in fallback_data["market"]["coins"]]
            
            for symbol in requested_symbols:
                if (symbol.upper() not in fallback_symbols and 
                    symbol.lower() not in fallback_names):
                    not_found_messages.append(f"I couldn't find a coin named {symbol} in the market data.")
                    not_found_symbols.append(symbol)
            
            # Always add the not_found_messages and primary_not_found_message if specific symbols were requested
            # even if not found in standard checks
            if not_found_symbols or (requested_symbols and len(requested_symbols) > 0):
                # Add the not found messages to the context
                if not_found_messages:
                    fallback_data["market"]["not_found_messages"] = not_found_messages
                
                # Create a clear primary message for the non-existent coin
                not_found_str = ", ".join(not_found_symbols if not_found_symbols else requested_symbols)
                fallback_data["market"]["primary_not_found_message"] = f"I couldn't find information for the following cryptocurrency: {not_found_str}. It may not exist or may not be listed in our database."
                
                logger.warning(f"Added not found messages to fallback for: {requested_symbols}")
        
        # Ensure we don't exceed token budget even with fallback data
        estimated_tokens = self._estimate_tokens(fallback_data)
        
        # Calculate execution time and update metadata
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds()
        fallback_data["market"]["_metadata"]["execution_time_seconds"] = execution_time
        fallback_data["market"]["_metadata"]["estimated_tokens"] = estimated_tokens
        fallback_data["market"]["_metadata"]["token_budget"] = token_budget
        
        logger.info(f"Fallback market context generation completed in {execution_time:.2f} seconds, " 
                    f"estimated tokens: {estimated_tokens}, token budget: {token_budget}")
        
        return fallback_data

    def _extract_coin_symbols(self, query: str) -> List[str]:
        """
        Extract potential cryptocurrency symbols from the query.
        
        Args:
            query: The user query text
            
        Returns:
            List of potential cryptocurrency symbols
        """
        # Convert query to lowercase for easier matching
        query_lower = query.lower()
        
        # Common cryptocurrency symbols and names to look for
        common_cryptos = {
            "bitcoin": "BTC",
            "btc": "BTC",
            "ethereum": "ETH",
            "eth": "ETH",
            "tether": "USDT",
            "usdt": "USDT",
            "bnb": "BNB",
            "binance": "BNB",
            "xrp": "XRP",
            "ripple": "XRP",
            "solana": "SOL",
            "sol": "SOL",
            "cardano": "ADA",
            "ada": "ADA",
            "polkadot": "DOT",
            "dot": "DOT",
            "doge": "DOGE",
            "dogecoin": "DOGE",
            "shiba": "SHIB",
            "shib": "SHIB",
            "pepe": "PEPE"
        }
        
        found_symbols = []
        
        # Look for price of X pattern
        price_of_pattern = "price of "
        if price_of_pattern in query_lower:
            idx = query_lower.find(price_of_pattern) + len(price_of_pattern)
            rest_of_query = query_lower[idx:]
            # Get the next word, strip punctuation
            potential_coin = rest_of_query.split()[0] if rest_of_query.split() else ""
            potential_coin = ''.join(c for c in potential_coin if c.isalnum())
            if potential_coin and len(potential_coin) >= 3:
                found_symbols.append(potential_coin.upper())
                logger.info(f"Extracted coin from 'price of' pattern: {potential_coin.upper()}")
        
        # Check if any of the common crypto names/symbols are in the query
        for term, symbol in common_cryptos.items():
            if term in query_lower:
                found_symbols.append(symbol)
        
        # Look for other potential symbols (3-5 character uppercase sequences)
        words = query_lower.split()
        for word in words:
            # Clean the word from punctuation
            clean_word = ''.join(c for c in word if c.isalnum())
            if 3 <= len(clean_word) <= 5 and clean_word.upper() not in found_symbols:
                found_symbols.append(clean_word.upper())
        
        return list(set(found_symbols))  # Remove duplicates

    async def _fetch_market_data(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """
        Fetch market data for the specified symbols using the market data service.
        
        Args:
            symbols: List of cryptocurrency symbols to fetch
            
        Returns:
            List of market data for each symbol
        """
        try:
            if symbols:
                # Get data for specific symbols
                coins = await self.market_service.get_prices(symbols=symbols)
                logger.info(f"Fetched market data for {len(coins)} coins matching symbols: {symbols}")
                return coins
            else:
                # Get top coins if no specific symbols provided
                coins = await self.market_service.get_prices(limit=20)
                logger.info(f"Fetched market data for top {len(coins)} coins")
                return coins
        except Exception as e:
            logger.error(f"Error fetching market data: {str(e)}")
            return []

    def _get_cached_market_data(self, symbols: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Get market data from cache file.
        
        Args:
            symbols: Optional list of symbols to filter by
            
        Returns:
            List of market data for matching symbols or all data
        """
        try:
            if os.path.exists(self.market_data_file):
                with open(self.market_data_file, 'r') as f:
                    data = json.load(f)
                    if "prices" in data:
                        if symbols:
                            # Filter by symbols, id, or name if provided
                            upper_symbols = [s.upper() for s in symbols]
                            lower_symbols = [s.lower() for s in symbols]
                            
                            filtered_coins = []
                            for coin in data["prices"]:
                                # Check for match by symbol (case-insensitive)
                                if coin.get("symbol", "").upper() in upper_symbols:
                                    filtered_coins.append(coin)
                                    continue
                                
                                # Check for match by id (case-insensitive)
                                if coin.get("id", "").lower() in lower_symbols:
                                    filtered_coins.append(coin)
                                    continue
                                    
                                # Check for match by name (case-insensitive)
                                if coin.get("name", "").lower() in lower_symbols:
                                    filtered_coins.append(coin)
                                    continue
                            
                            logger.info(f"Found {len(filtered_coins)} coins in cached data matching requested symbols/names")
                            return filtered_coins
                        else:
                            return data["prices"]
            
            # If CoinGecko cache exists, try to use that
            if os.path.exists(self.coingecko_cache_file):
                with open(self.coingecko_cache_file, 'r') as f:
                    data = json.load(f)
                    if symbols:
                        # Filter by symbols, id, or name if provided
                        upper_symbols = [s.upper() for s in symbols]
                        lower_symbols = [s.lower() for s in symbols]
                        
                        filtered_coins = []
                        for coin in data:
                            # Check for match by symbol (case-insensitive)
                            if coin.get("symbol", "").upper() in upper_symbols:
                                filtered_coins.append(coin)
                                continue
                            
                            # Check for match by id (case-insensitive)
                            if coin.get("id", "").lower() in lower_symbols:
                                filtered_coins.append(coin)
                                continue
                                
                            # Check for match by name (case-insensitive)
                            if coin.get("name", "").lower() in lower_symbols:
                                filtered_coins.append(coin)
                                continue
                        
                        logger.info(f"Found {len(filtered_coins)} coins in CoinGecko cache matching requested symbols/names")
                        return filtered_coins
                    else:
                        return data[:20]  # Limit to top 20
            
            logger.warning("No cached market data found")
            return []
        except Exception as e:
            logger.error(f"Error reading cached market data: {str(e)}")
            return []

    async def _get_market_overview(self) -> Dict[str, Any]:
        """
        Get market overview data including total market cap, dominance, etc.
        
        Returns:
            Dictionary with market overview metrics
        """
        try:
            overview = await self.market_service.get_market_overview()
            logger.info("Fetched market overview data")
            return overview
        except Exception as e:
            logger.error(f"Error fetching market overview: {str(e)}")
            # Return basic structure as fallback
            return {
                "totalMarketCapUsd": 0,
                "totalVolume24hUsd": 0,
                "btcDominance": 0,
                "ethDominance": 0,
                "marketCapChange24h": 0,
                "lastUpdated": datetime.now().isoformat()
            } 

    def _identify_coins_from_keywords(self, keywords: List[str]) -> List[str]:
        """
        Identify coin IDs from extracted keywords.
        
        Args:
            keywords: List of keywords from the query
            
        Returns:
            List of coin IDs identified from keywords
        """
        # Common mappings from ticker/symbol to coin_id
        ticker_to_id = {
            "btc": "bitcoin",
            "eth": "ethereum",
            "usdt": "tether",
            "usdc": "usd-coin",
            "bnb": "binancecoin",
            "xrp": "ripple",
            "sol": "solana",
            "ada": "cardano",
            "doge": "dogecoin",
            "dot": "polkadot",
            "matic": "polygon",
            "avax": "avalanche-2",
            "shib": "shiba-inu",
            "uni": "uniswap",
            "link": "chainlink",
            "atom": "cosmos",
            "etc": "ethereum-classic",
            "xlm": "stellar",
            "algo": "algorand",
            "near": "near",
            "icp": "internet-computer",
            "fil": "filecoin",
            "vet": "vechain",
            "ftm": "fantom",
            "sand": "the-sandbox",
            "mana": "decentraland",
            "xtz": "tezos",
            "axs": "axie-infinity",
            "theta": "theta-token",
            "aave": "aave",
            "egld": "elrond-erd-2",
            "xmr": "monero",
            "cake": "pancakeswap-token",
            "grt": "the-graph",
            "ltc": "litecoin",
            "bch": "bitcoin-cash",
            "mkr": "maker",
            "snx": "synthetix-network-token",
            "comp": "compound-governance-token",
            "luna": "terra-luna",
            "ust": "terrausd",
            "trx": "tron",
        }
        
        # Name to id mappings
        name_to_id = {
            "bitcoin": "bitcoin",
            "ethereum": "ethereum",
            "tether": "tether",
            "usdt": "tether",
            "usdc": "usd-coin",
            "binance": "binancecoin",
            "ripple": "ripple",
            "solana": "solana",
            "cardano": "cardano",
            "dogecoin": "dogecoin",
            "polkadot": "polkadot",
            "polygon": "polygon",
            "avalanche": "avalanche-2",
            "shiba": "shiba-inu",
            "uniswap": "uniswap",
            "chainlink": "chainlink",
            "cosmos": "cosmos",
            "stellar": "stellar",
            "algorand": "algorand",
            "near protocol": "near",
            "internet computer": "internet-computer",
            "filecoin": "filecoin",
            "vechain": "vechain",
            "fantom": "fantom",
            "sandbox": "the-sandbox",
            "decentraland": "decentraland",
            "tezos": "xtz",
            "axie": "axie-infinity",
            "aave": "aave",
            "elrond": "elrond-erd-2",
            "monero": "monero",
            "pancakeswap": "pancakeswap-token",
            "graph": "the-graph",
            "litecoin": "litecoin",
            "maker": "maker",
            "synthetix": "synthetix-network-token",
            "compound": "compound-governance-token",
            "luna": "terra-luna",
            "terra": "terra-luna",
            "tron": "tron",
        }
        
        identified_coins = set()
        
        # Check each keyword for matches
        for keyword in keywords:
            # Convert to lowercase for matching
            keyword_lower = keyword.lower()
            
            # Check if it's a known ticker symbol
            if keyword_lower in ticker_to_id:
                identified_coins.add(ticker_to_id[keyword_lower])
                logger.info(f"Identified coin '{ticker_to_id[keyword_lower]}' from ticker '{keyword_lower}'")
            
            # Check if it's a coin name
            elif keyword_lower in name_to_id:
                identified_coins.add(name_to_id[keyword_lower])
                logger.info(f"Identified coin '{name_to_id[keyword_lower]}' from name '{keyword_lower}'")
            
            # If not found, check if it's a partial match
            else:
                # Check partial matches against names
                for name, coin_id in name_to_id.items():
                    if keyword_lower in name.lower():
                        identified_coins.add(coin_id)
                        logger.info(f"Identified coin '{coin_id}' from partial name match '{keyword_lower}' in '{name}'")
                        break
        
        # Convert to list and limit to top 3 to avoid too much data
        return list(identified_coins)[:3]

    async def _get_global_market_data(self) -> Dict[str, Any]:
        """
        Get global cryptocurrency market data.
        
        Returns:
            Dictionary with global market data
        """
        try:
            global_data = await self.market_service.get_global_market_data()
            
            # Format the data
            if global_data:
                return {
                    "global_market_cap": global_data.get("total_market_cap"),
                    "global_market_cap_change_24h": global_data.get("market_cap_change_percentage_24h_usd"),
                    "bitcoin_dominance": global_data.get("bitcoin_dominance"),
                    "ethereum_dominance": global_data.get("ethereum_dominance"),
                    "total_volume_24h": global_data.get("total_volume")
                }
            return {}
        except Exception as e:
            logger.error(f"Error fetching global market data: {str(e)}")
            return {}

    async def _get_coin_data(self, coin_id: str) -> Dict[str, Any]:
        """
        Get data for a specific cryptocurrency.
        
        Args:
            coin_id: Identifier for the cryptocurrency
            
        Returns:
            Dictionary with coin data
        """
        try:
            coin_data = await self.market_service.get_coin_data(coin_id)
            
            # Format the data
            if coin_data:
                return {
                    "name": coin_data.get("name"),
                    "symbol": coin_data.get("symbol", "").upper(),
                    "current_price": coin_data.get("current_price"),
                    "market_cap": coin_data.get("market_cap"),
                    "market_cap_rank": coin_data.get("market_cap_rank"),
                    "price_change_24h": coin_data.get("price_change_24h"),
                    "price_change_percentage_24h": coin_data.get("price_change_percentage_24h"),
                    "price_change_percentage_7d": coin_data.get("price_change_percentage_7d"),
                    "ath": coin_data.get("ath"),
                    "ath_date": coin_data.get("ath_date"),
                    "atl": coin_data.get("atl"),
                    "atl_date": coin_data.get("atl_date"),
                }
            return None
        except Exception as e:
            logger.error(f"Error fetching data for coin {coin_id}: {str(e)}")
            return None

    async def _get_top_coins(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get top cryptocurrencies by market cap.
        
        Args:
            limit: Maximum number of coins to retrieve
            
        Returns:
            List of top cryptocurrencies
        """
        try:
            coins = await self.market_service.get_top_coins(limit)
            
            # Format the data
            if coins:
                return [
                    {
                        "id": coin.get("id"),
                        "name": coin.get("name"),
                        "symbol": coin.get("symbol", "").upper(),
                        "current_price": coin.get("current_price"),
                        "market_cap": coin.get("market_cap"),
                        "market_cap_rank": coin.get("market_cap_rank"),
                        "price_change_percentage_24h": coin.get("price_change_percentage_24h")
                    }
                    for coin in coins
                ]
            return []
        except Exception as e:
            logger.error(f"Error fetching top coins: {str(e)}")
            return []

    async def _get_trending_coins(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get trending cryptocurrencies.
        
        Args:
            limit: Maximum number of coins to retrieve
            
        Returns:
            List of trending cryptocurrencies
        """
        try:
            trending = await self.market_service.get_trending_coins(limit)
            
            # Format the data
            if trending:
                return [
                    {
                        "id": coin.get("id"),
                        "name": coin.get("name"),
                        "symbol": coin.get("symbol", "").upper(),
                        "market_cap_rank": coin.get("market_cap_rank"),
                        "price_btc": coin.get("price_btc"),
                        "score": coin.get("score")
                    }
                    for coin in trending
                ]
            return []
        except Exception as e:
            logger.error(f"Error fetching trending coins: {str(e)}")
            return []

    async def _get_gainers_losers(self, limit: int = 5) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get top gainers and losers.
        
        Args:
            limit: Maximum number of coins in each category
            
        Returns:
            Dictionary with top gainers and losers
        """
        try:
            gainers = await self.market_service.get_top_gainers(limit)
            losers = await self.market_service.get_top_losers(limit)
            
            # Format the data
            result = {
                "top_gainers": [],
                "top_losers": []
            }
            
            if gainers:
                result["top_gainers"] = [
                    {
                        "id": coin.get("id"),
                        "name": coin.get("name"),
                        "symbol": coin.get("symbol", "").upper(),
                        "current_price": coin.get("current_price"),
                        "price_change_percentage_24h": coin.get("price_change_percentage_24h")
                    }
                    for coin in gainers
                ]
                
            if losers:
                result["top_losers"] = [
                    {
                        "id": coin.get("id"),
                        "name": coin.get("name"),
                        "symbol": coin.get("symbol", "").upper(),
                        "current_price": coin.get("current_price"),
                        "price_change_percentage_24h": coin.get("price_change_percentage_24h")
                    }
                    for coin in losers
                ]
                
            return result
        except Exception as e:
            logger.error(f"Error fetching gainers and losers: {str(e)}")
            return {
                "top_gainers": [],
                "top_losers": []
            }

    async def _get_market_indexes(self) -> Dict[str, Dict[str, Any]]:
        """
        Get stock market indexes.
        
        Returns:
            Dictionary with market index data
        """
        try:
            indexes = await self.market_service.get_market_indexes()
            
            # Format the data
            if indexes:
                result = {}
                for index_id, data in indexes.items():
                    result[index_id] = {
                        "name": data.get("name"),
                        "current_value": data.get("current_value"),
                        "change_24h": data.get("change_24h"),
                        "change_percentage_24h": data.get("change_percentage_24h")
                    }
                return result
            return {}
        except Exception as e:
            logger.error(f"Error fetching market indexes: {str(e)}")
            return {}

    async def _get_eth_gas_price(self) -> Dict[str, Any]:
        """
        Get Ethereum gas price information.
        
        Returns:
            Dictionary with gas price data
        """
        try:
            gas_data = await self.market_service.get_eth_gas_price()
            
            # Format the data
            if gas_data:
                return {
                    "slow": gas_data.get("slow"),
                    "standard": gas_data.get("standard"),
                    "fast": gas_data.get("fast"),
                    "rapid": gas_data.get("rapid"),
                    "timestamp": gas_data.get("timestamp")
                }
            return None
        except Exception as e:
            logger.error(f"Error fetching ETH gas price: {str(e)}")
            return None

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