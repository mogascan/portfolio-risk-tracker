"""
CoinGecko service for fetching cryptocurrency market data
"""
import aiohttp
import asyncio
import json
import os
import logging
import ssl
import certifi
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from app.core.logging import get_logger

# Initialize logger
logger = get_logger(__name__)

class CoinGeckoService:
    """Service for fetching cryptocurrency market data from CoinGecko API"""
    
    def __init__(self, verify_ssl=True):
        """Initialize CoinGeckoService"""
        self.base_url = "https://api.coingecko.com/api/v3"
        self.cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
        self.cache_file = os.path.join(self.cache_dir, "coingecko_cache.json")
        self.cache_expiry = 300  # 5 minutes
        self.verify_ssl = verify_ssl
        
        # Create cache directory if it doesn't exist
        os.makedirs(self.cache_dir, exist_ok=True)
    
    async def get_top_coins(self, limit: int = 100, currency: str = "usd") -> List[Dict[str, Any]]:
        """
        Get top coins by market cap from CoinGecko
        
        Args:
            limit: Number of coins to fetch (maximum 500)
            currency: Currency for price data (default: usd)
            
        Returns:
            List of coin data with market information
        """
        try:
            # Check if we have cached data
            cached_data = self._get_cached_data()
            cache_key = f"top_coins_{currency}_{limit}"
            
            if cached_data and cache_key in cached_data:
                cache_entry = cached_data[cache_key]
                # Check if cache is still valid
                cache_time = datetime.fromisoformat(cache_entry["timestamp"])
                if datetime.now() - cache_time < timedelta(seconds=self.cache_expiry):
                    logger.info(f"Using cached top coins data (limit: {limit})")
                    return cache_entry["data"]
            
            # Fetch data from CoinGecko API
            # Create custom SSL context if needed
            ssl_context = None
            if not self.verify_ssl:
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
            
            connector = aiohttp.TCPConnector(ssl=ssl_context)
            headers = {
                "User-Agent": "CryptoPortfolioTracker/1.0",
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession(connector=connector, headers=headers) as session:
                # CoinGecko API limits to 250 coins per page, so make multiple requests if needed
                max_per_page = 250
                pages_needed = (limit + max_per_page - 1) // max_per_page  # Ceiling division
                all_data = []
                
                for page in range(1, pages_needed + 1):
                    # For the last page, we might need fewer coins
                    remaining = limit - (page - 1) * max_per_page
                    per_page = min(max_per_page, remaining)
                    
                    # Set up request parameters
                    params = {
                        "vs_currency": currency,
                        "order": "market_cap_desc",
                        "per_page": per_page,
                        "page": page,
                        "sparkline": "false",
                        "price_change_percentage": "24h,7d,30d,1y"
                    }
                    
                    url = f"{self.base_url}/coins/markets"
                    
                    logger.info(f"Fetching data from CoinGecko API: {url} (page {page}, limit {per_page})")
                    
                    # Add delay between requests to avoid rate limiting
                    if page > 1:
                        await asyncio.sleep(1.5)  # 1.5 seconds between requests
                    
                    async with session.get(url, params=params) as response:
                        response_text = await response.text()
                        
                        if response.status == 429:
                            logger.warning("CoinGecko API rate limit exceeded.")
                            # Try to return cached data even if expired
                            if cached_data and cache_key in cached_data:
                                logger.info("Falling back to expired cached data")
                                return cached_data[cache_key]["data"]
                            raise Exception("Rate limit exceeded and no cached data available")
                        
                        elif response.status == 403:
                            logger.error(f"CoinGecko API access forbidden (403): {response_text}")
                            # Try to return cached data even if expired
                            if cached_data and cache_key in cached_data:
                                logger.info("Falling back to expired cached data due to 403 error")
                                return cached_data[cache_key]["data"]
                            raise Exception("API access forbidden (403). This may be due to IP-based rate limiting or missing API key.")
                        
                        elif response.status != 200:
                            logger.error(f"CoinGecko API error - Status: {response.status}, Response: {response_text}")
                            # Try to return cached data even if expired
                            if cached_data and cache_key in cached_data:
                                logger.info(f"Falling back to expired cached data due to {response.status} error")
                                return cached_data[cache_key]["data"]
                            response.raise_for_status()
                        
                        try:
                            page_data = json.loads(response_text)
                            all_data.extend(page_data)
                        except json.JSONDecodeError:
                            logger.error(f"Invalid JSON response from CoinGecko: {response_text[:200]}...")
                            if cached_data and cache_key in cached_data:
                                logger.info("Falling back to cached data due to JSON parsing error")
                                return cached_data[cache_key]["data"]
                            raise Exception(f"Invalid JSON response from CoinGecko API")
                        
                        # If we got fewer results than requested, don't make more requests
                        if len(page_data) < per_page:
                            break
                
                # Update cache
                if not cached_data:
                    cached_data = {}
                
                cached_data[cache_key] = {
                    "timestamp": datetime.now().isoformat(),
                    "data": all_data
                }
                
                self._update_cache(cached_data)
                
                return all_data
        
        except aiohttp.ClientError as e:
            logger.error(f"Error fetching top coins from CoinGecko: {str(e)}")
            print(f"Error fetching top coins from CoinGecko: {str(e)}")
            # Try to use cached data if available
            if cached_data and cache_key in cached_data:
                logger.info("Using cached data due to API error")
                return cached_data[cache_key]["data"]
            raise
        
        except Exception as e:
            logger.error(f"Unexpected error fetching top coins: {str(e)}")
            print(f"Unexpected error fetching top coins: {str(e)}")
            # Try to use cached data if available
            if cached_data and cache_key in cached_data:
                logger.info("Using cached data due to unexpected error")
                return cached_data[cache_key]["data"]
            raise
    
    async def get_coin_details(self, coin_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific coin
        
        Args:
            coin_id: CoinGecko coin ID (e.g., 'bitcoin')
            
        Returns:
            Detailed coin information
        """
        try:
            # Check if we have cached data
            cached_data = self._get_cached_data()
            cache_key = f"coin_details_{coin_id}"
            
            if cached_data and cache_key in cached_data:
                cache_entry = cached_data[cache_key]
                # Check if cache is still valid
                cache_time = datetime.fromisoformat(cache_entry["timestamp"])
                if datetime.now() - cache_time < timedelta(seconds=self.cache_expiry):
                    logger.info(f"Using cached coin details for {coin_id}")
                    return cache_entry["data"]
            
            # Create custom SSL context if needed
            ssl_context = None
            if not self.verify_ssl:
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
            
            connector = aiohttp.TCPConnector(ssl=ssl_context)
            headers = {
                "User-Agent": "CryptoPortfolioTracker/1.0",
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            
            # Fetch data from CoinGecko API
            async with aiohttp.ClientSession(connector=connector, headers=headers) as session:
                url = f"{self.base_url}/coins/{coin_id}"
                params = {
                    "localization": "false",
                    "tickers": "false",
                    "market_data": "true",
                    "community_data": "false",
                    "developer_data": "false"
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 429:
                        logger.warning("CoinGecko API rate limit exceeded.")
                        # Try to return cached data even if expired
                        if cached_data and cache_key in cached_data:
                            logger.info("Falling back to expired cached data")
                            return cached_data[cache_key]["data"]
                        raise Exception("Rate limit exceeded and no cached data available")
                    
                    response.raise_for_status()
                    data = await response.json()
                    
                    # Update cache
                    if not cached_data:
                        cached_data = {}
                    
                    cached_data[cache_key] = {
                        "timestamp": datetime.now().isoformat(),
                        "data": data
                    }
                    
                    self._update_cache(cached_data)
                    
                    return data
        
        except aiohttp.ClientError as e:
            logger.error(f"Error fetching coin details for {coin_id}: {str(e)}")
            # Try to use cached data if available
            if cached_data and cache_key in cached_data:
                logger.info("Using cached data due to API error")
                return cached_data[cache_key]["data"]
            raise
        
        except Exception as e:
            logger.error(f"Unexpected error fetching coin details: {str(e)}")
            # Try to use cached data if available
            if cached_data and cache_key in cached_data:
                logger.info("Using cached data due to unexpected error")
                return cached_data[cache_key]["data"]
            raise
    
    async def get_coin_price_history(self, coin_id: str, days: str = "7", currency: str = "usd") -> Dict[str, Any]:
        """
        Get historical price data for a specific coin
        
        Args:
            coin_id: CoinGecko coin ID (e.g., 'bitcoin')
            days: Time range (e.g., '1', '7', '14', '30', '90', '180', '365', 'max')
            currency: Currency for price data (default: usd)
            
        Returns:
            Historical price data
        """
        try:
            # Check if we have cached data
            cached_data = self._get_cached_data()
            cache_key = f"price_history_{coin_id}_{days}_{currency}"
            
            if cached_data and cache_key in cached_data:
                cache_entry = cached_data[cache_key]
                # Check if cache is still valid (use longer expiry for historical data)
                cache_time = datetime.fromisoformat(cache_entry["timestamp"])
                # Historical data changes less frequently, so use a longer cache time
                if datetime.now() - cache_time < timedelta(hours=1):
                    logger.info(f"Using cached price history for {coin_id}")
                    return cache_entry["data"]
            
            # Create custom SSL context if needed
            ssl_context = None
            if not self.verify_ssl:
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
            
            connector = aiohttp.TCPConnector(ssl=ssl_context)
            headers = {
                "User-Agent": "CryptoPortfolioTracker/1.0",
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            
            # Fetch data from CoinGecko API
            async with aiohttp.ClientSession(connector=connector, headers=headers) as session:
                url = f"{self.base_url}/coins/{coin_id}/market_chart"
                params = {
                    "vs_currency": currency,
                    "days": days
                }
                
                logger.info(f"Fetching price history for {coin_id} from CoinGecko API")
                
                async with session.get(url, params=params) as response:
                    response_text = await response.text()
                    
                    if response.status == 429:
                        logger.warning("CoinGecko API rate limit exceeded.")
                        # Try to return cached data even if expired
                        if cached_data and cache_key in cached_data:
                            logger.info("Falling back to expired cached data")
                            return cached_data[cache_key]["data"]
                        raise Exception("Rate limit exceeded and no cached data available")
                    
                    elif response.status == 403:
                        logger.error(f"CoinGecko API access forbidden (403): {response_text}")
                        # Try to return cached data even if expired
                        if cached_data and cache_key in cached_data:
                            logger.info("Falling back to expired cached data due to 403 error")
                            return cached_data[cache_key]["data"]
                        raise Exception("API access forbidden (403). This may be due to IP-based rate limiting or missing API key.")
                    
                    elif response.status != 200:
                        logger.error(f"CoinGecko API error - Status: {response.status}, Response: {response_text}")
                        # Try to return cached data even if expired
                        if cached_data and cache_key in cached_data:
                            logger.info(f"Falling back to expired cached data due to {response.status} error")
                            return cached_data[cache_key]["data"]
                        response.raise_for_status()
                    
                    try:
                        data = json.loads(response_text)
                    except json.JSONDecodeError:
                        logger.error(f"Invalid JSON response from CoinGecko: {response_text[:200]}...")
                        if cached_data and cache_key in cached_data:
                            logger.info("Falling back to cached data due to JSON parsing error")
                            return cached_data[cache_key]["data"]
                        raise Exception(f"Invalid JSON response from CoinGecko API")
                    
                    # Update cache
                    if not cached_data:
                        cached_data = {}
                    
                    cached_data[cache_key] = {
                        "timestamp": datetime.now().isoformat(),
                        "data": data
                    }
                    
                    self._update_cache(cached_data)
                    
                    return data
        
        except aiohttp.ClientError as e:
            logger.error(f"Error fetching price history for {coin_id}: {str(e)}")
            # Try to use cached data if available
            if cached_data and cache_key in cached_data:
                logger.info("Using cached data due to API error")
                return cached_data[cache_key]["data"]
            raise
        
        except Exception as e:
            logger.error(f"Unexpected error fetching price history: {str(e)}")
            # Try to use cached data if available
            if cached_data and cache_key in cached_data:
                logger.info("Using cached data due to unexpected error")
                return cached_data[cache_key]["data"]
            raise
    
    def _get_cached_data(self) -> Optional[Dict[str, Any]]:
        """
        Get cached data from file
        
        Returns:
            Cached data dictionary or None if not available
        """
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r') as f:
                    return json.load(f)
            return None
        except Exception as e:
            logger.error(f"Error reading cache file: {str(e)}")
            return None
    
    def _update_cache(self, data: Dict[str, Any]) -> bool:
        """
        Update cache file with new data
        
        Args:
            data: Data to cache
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(data, f)
            return True
        except Exception as e:
            logger.error(f"Error updating cache file: {str(e)}")
            return False

# Test function to run when this module is run directly
async def test_coingecko_service():
    # Create service with SSL verification disabled for testing
    service = CoinGeckoService(verify_ssl=False)
    try:
        print("Testing CoinGecko API...")
        top_coins = await service.get_top_coins(limit=5)
        print(f"Successfully retrieved {len(top_coins)} coins:")
        for coin in top_coins:
            print(f"  {coin.get('name')} ({coin.get('symbol').upper()}): ${coin.get('current_price')}")
    except Exception as e:
        print(f"Error testing CoinGecko service: {str(e)}")

# Run the test function if this module is run directly
if __name__ == "__main__":
    asyncio.run(test_coingecko_service()) 