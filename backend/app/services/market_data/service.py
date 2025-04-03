"""
Market data service for cryptocurrency data
"""
import json
import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from app.core.logging import get_logger
from app.services.coingecko import CoinGeckoService

# Initialize logger
logger = get_logger(__name__)

class MarketDataService:
    """Service for fetching cryptocurrency market data"""
    
    def __init__(self):
        """Initialize MarketDataService"""
        # Disable SSL verification for CoinGecko due to cert issues
        self.coingecko_service = CoinGeckoService(verify_ssl=False)
        self.cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "data")
        self.cache_file = os.path.join(self.cache_dir, "market_data.json")
        self.cache_expiry = 300  # 5 minutes
        
        # Create cache directory if it doesn't exist
        os.makedirs(self.cache_dir, exist_ok=True)
    
    async def get_market_overview(self) -> Dict[str, Any]:
        """
        Get overall market data including total market cap, volume, and dominance
        """
        try:
            # Check if we have cached data
            cached_data = self._get_cached_data()
            if cached_data and "overview" in cached_data:
                logger.debug("Using cached market overview data")
                return cached_data["overview"]
            
            # Get top coins to calculate market stats
            top_coins = await self.coingecko_service.get_top_coins(limit=100)
            
            # Calculate total market cap and volume
            total_market_cap = sum(coin.get('market_cap', 0) or 0 for coin in top_coins)
            total_volume = sum(coin.get('total_volume', 0) or 0 for coin in top_coins)
            
            # Calculate BTC and ETH dominance
            btc = next((coin for coin in top_coins if coin.get('id') == 'bitcoin'), None)
            eth = next((coin for coin in top_coins if coin.get('id') == 'ethereum'), None)
            
            btc_dominance = (btc.get('market_cap', 0) / total_market_cap * 100) if btc and total_market_cap > 0 else 0
            eth_dominance = (eth.get('market_cap', 0) / total_market_cap * 100) if eth and total_market_cap > 0 else 0
            
            # Calculate overall market cap change
            market_cap_change = sum(coin.get('market_cap_change_percentage_24h', 0) or 0 for coin in top_coins[:10]) / 10
            
            # Format the overview data
            overview = {
                "totalMarketCapUsd": total_market_cap,
                "totalVolume24hUsd": total_volume,
                "btcDominance": btc_dominance,
                "ethDominance": eth_dominance,
                "marketCapChange24h": market_cap_change,
                "lastUpdated": datetime.now().isoformat()
            }
            
            # Update cache
            if cached_data:
                cached_data["overview"] = overview
                self._update_cache(cached_data)
            else:
                self._update_cache({"overview": overview})
            
            return overview
            
        except Exception as e:
            logger.error(f"Error fetching market overview: {str(e)}")
            # Fallback to cached data if available
            cached_data = self._get_cached_data()
            if cached_data and "overview" in cached_data:
                logger.info("Using fallback cached market overview data")
                return cached_data["overview"]
            
            # Return empty data structure as fallback
            return {
                "totalMarketCapUsd": 0,
                "totalVolume24hUsd": 0,
                "btcDominance": 0,
                "ethDominance": 0,
                "marketCapChange24h": 0,
                "lastUpdated": datetime.now().isoformat()
            }
    
    async def get_prices(self, symbols: Optional[List[str]] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get cryptocurrency prices with market data
        
        Args:
            symbols: List of cryptocurrency symbols to fetch
            limit: Number of cryptocurrencies to fetch if symbols not provided
            
        Returns:
            List of cryptocurrency price data
        """
        try:
            # Get data from CoinGecko
            if symbols:
                # Convert symbols to IDs (this is a simplification, in reality we'd need a mapping)
                # For now, just pass the symbols as IDs which will work for major coins
                coins = await self.coingecko_service.get_top_coins(limit=250)
                # Filter coins by symbol
                upper_symbols = [s.upper() for s in symbols]
                filtered_coins = [coin for coin in coins if coin.get('symbol', '').upper() in upper_symbols]
                return filtered_coins
            else:
                # Get top coins by market cap
                return await self.coingecko_service.get_top_coins(limit=limit)
                
        except Exception as e:
            logger.error(f"Error fetching cryptocurrency prices: {str(e)}")
            return []
    
    async def get_price_history(self, coin_id: str, days: str = "7") -> Dict[str, Any]:
        """
        Get historical price data for a cryptocurrency
        
        Args:
            coin_id: CoinGecko coin ID
            days: Number of days (1, 7, 14, 30, 90, 180, 365, max)
            
        Returns:
            Historical price data
        """
        try:
            return await self.coingecko_service.get_coin_price_history(coin_id, days)
        except Exception as e:
            logger.error(f"Error fetching price history for {coin_id}: {str(e)}")
            return {"prices": []}
    
    def _get_cached_data(self) -> Optional[Dict[str, Any]]:
        """Get cached data from file"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r') as f:
                    return json.load(f)
            return None
        except Exception as e:
            logger.error(f"Error reading cache file: {str(e)}")
            return None
    
    def _update_cache(self, data: Dict[str, Any]) -> None:
        """Update cache file with new data"""
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(data, f)
        except Exception as e:
            logger.error(f"Error updating cache file: {str(e)}") 