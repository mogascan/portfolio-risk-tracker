import logging
import os
import json
import ssl
from typing import Dict, List, Any, Optional
import aiohttp # type: ignore
import asyncio
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class MarketDataService:
    """Service for fetching and managing market data"""
    
    def __init__(self):
        self.base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        self.market_data_file = os.path.join(self.base_path, 'data', 'market_data.json')
        self.last_update = None
        self.update_interval = timedelta(minutes=5)
        self.coingecko_api = "https://api.coingecko.com/api/v3"
        self.update_task = None
        # Don't start the update loop in the constructor
        # It will be started when the app starts

    def _start_update_loop(self):
        """Start the background update loop"""
        # Only start if not already running
        if self.update_task is None or self.update_task.done():
            try:
                # Get the current event loop or create one if needed
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                
                # Create the task in the current event loop
                self.update_task = loop.create_task(self._update_loop())
                logger.info("Market data update loop started")
            except Exception as e:
                logger.error(f"Failed to start market data update loop: {str(e)}")

    async def _update_loop(self):
        """Background loop to update market data periodically"""
        while True:
            try:
                await self._update_market_data()
                logger.info(f"Next market data update in {self.update_interval.total_seconds()} seconds")
                await asyncio.sleep(self.update_interval.total_seconds())
            except Exception as e:
                logger.error(f"Error in market data update loop: {str(e)}")
                await asyncio.sleep(60)  # Wait a minute before retrying

    async def _update_market_data(self):
        """Update market data from CoinGecko"""
        try:
            logger.info("Starting market data update from CoinGecko API")
            
            # Check if file exists first and load current data if possible
            current_data = {}
            if os.path.exists(self.market_data_file):
                try:
                    with open(self.market_data_file, 'r') as f:
                        current_data = json.load(f)
                    logger.info("Loaded existing market data file")
                except Exception as e:
                    logger.error(f"Error reading existing market data file: {e}")
            
            # Create a custom SSL context that ignores certificate verification
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=ssl_context)) as session:
                # Fetch up to 5 pages (500 coins)
                all_coins_data = []
                pages_to_fetch = 5  # Fetch 5 pages for 500 coins (100 per page)
                
                for page in range(1, pages_to_fetch + 1):
                    logger.info(f"Fetching page {page} of market data from CoinGecko")
                    try:
                        # Get top coins by market cap for this page
                        async with session.get(
                            f"{self.coingecko_api}/coins/markets",
                            params={
                                "vs_currency": "usd",
                                "order": "market_cap_desc",
                                "per_page": 100,
                                "page": page,
                                "sparkline": "false",
                                "price_change_percentage": "24h,7d,30d,1y"
                            }
                        ) as response:
                            if response.status == 200:
                                page_coins_data = await response.json()
                                logger.info(f"Successfully received data for page {page} from CoinGecko API - {len(page_coins_data)} coins")
                                all_coins_data.extend(page_coins_data)
                            else:
                                logger.error(f"Error fetching page {page} of market data: HTTP {response.status}")
                                # If we've at least fetched one page successfully, continue with what we have
                                if page > 1:
                                    break
                                response_text = await response.text()
                                logger.error(f"Response: {response_text[:200]}...")
                                # If first page fails, try to use existing data
                    except Exception as e:
                        logger.error(f"Exception fetching page {page}: {str(e)}")
                        # If we've at least fetched one page successfully, continue with what we have
                        if page > 1:
                            break
                
                # If we have data from at least one page, proceed with processing
                if all_coins_data:
                    logger.info(f"Successfully fetched {len(all_coins_data)} coins from CoinGecko API")
                    
                    # Format data for our application
                    prices = []
                    total_market_cap = 0
                    total_volume = 0
                    
                    for coin in all_coins_data:
                        # Ensure market_cap and total_volume are numbers, not None
                        market_cap = coin.get("market_cap", 0) or 0
                        total_volume_value = coin.get("total_volume", 0) or 0
                        
                        total_market_cap += market_cap
                        total_volume += total_volume_value
                        
                        prices.append({
                            "symbol": coin.get("symbol", "").upper(),
                            "name": coin.get("name", ""),
                            "priceUsd": coin.get("current_price", 0) or 0,
                            "change24h": coin.get("price_change_percentage_24h", 0) or 0,
                            "marketCap": market_cap,
                            "volume24h": total_volume_value,
                            "change7d": coin.get("price_change_percentage_7d_in_currency", 0) or 0,
                            "change30d": coin.get("price_change_percentage_30d_in_currency", 0) or 0,
                            "price_change_percentage_24h_in_currency": coin.get("price_change_percentage_24h", 0) or 0,
                            "price_change_percentage_7d_in_currency": coin.get("price_change_percentage_7d_in_currency", 0) or 0,
                            "price_change_percentage_30d_in_currency": coin.get("price_change_percentage_30d_in_currency", 0) or 0,
                            "price_change_percentage_1y_in_currency": coin.get("price_change_percentage_1y_in_currency", 0) or 0,
                            "image": coin.get("image", ""),
                            "id": coin.get("id", ""),
                            "market_cap_rank": coin.get("market_cap_rank", 0) or 0
                        })
                    
                    # Calculate market stats
                    btc_dominance = next(
                        (coin["market_cap"] / total_market_cap * 100 
                         for coin in all_coins_data if coin["id"] == "bitcoin"), 
                        0
                    )
                    
                    eth_dominance = next(
                        (coin["market_cap"] / total_market_cap * 100 
                         for coin in all_coins_data if coin["id"] == "ethereum"), 
                        0
                    )
                    
                    # Calculate overall market cap change
                    market_cap_change_24h = sum(
                        coin.get('price_change_percentage_24h', 0) or 0 
                        for coin in all_coins_data[:10]
                    ) / min(len(all_coins_data), 10)
                    
                    # Format the final output
                    now = datetime.now().isoformat()
                    market_data = {
                        "prices": prices,
                        "updated": now,
                        "overview": {
                            "totalMarketCapUsd": total_market_cap,
                            "totalVolume24hUsd": total_volume,
                            "btcDominance": btc_dominance,
                            "ethDominance": eth_dominance,
                            "marketCapChange24h": market_cap_change_24h,
                            "lastUpdated": now
                        }
                    }
                    
                    # Save to file
                    try:
                        # Ensure the directory exists
                        os.makedirs(os.path.dirname(self.market_data_file), exist_ok=True)
                        
                        with open(self.market_data_file, 'w') as f:
                            json.dump(market_data, f, indent=2)
                        self.last_update = datetime.now()
                        logger.info(f"Updated market data file with {len(prices)} coins from CoinGecko")
                    except Exception as e:
                        logger.error(f"Error saving market data file: {e}")
                else:
                    logger.error("Failed to fetch any market data from CoinGecko API")
                    if os.path.exists(self.market_data_file):
                        logger.info("Keeping existing market data due to API error")
        except Exception as e:
            logger.error(f"Error updating market data: {str(e)}")

    async def get_market_data(self) -> Dict[str, Any]:
        """Get current market data, forcing an update if data is stale"""
        try:
            # Check if data file exists and is fresh
            needs_update = True
            
            if os.path.exists(self.market_data_file):
                try:
                    with open(self.market_data_file, 'r') as f:
                        data = json.load(f)
                        
                    # Check if data is recent (last 15 minutes)
                    if "overview" in data and "lastUpdated" in data["overview"]:
                        last_updated = datetime.fromisoformat(data["overview"]["lastUpdated"])
                        now = datetime.now()
                        # Ensure both times are naive or aware for comparison
                        if last_updated.tzinfo is not None:
                            # Convert to naive datetime if last_updated has timezone
                            last_updated = last_updated.replace(tzinfo=None)
                        
                        # Only use cached data if it's less than 5 minutes old
                        if now - last_updated < timedelta(minutes=5):
                            needs_update = False
                            logger.info(f"Using cached market data from {last_updated.isoformat()}")
                            return data
                except Exception as e:
                    logger.warning(f"Could not read market data file or data is invalid: {e}")
            
            # If we need an update, force one now
            if needs_update:
                logger.info("Market data needs update - fetching fresh data")
                await self._update_market_data()
                
                # Try to read the updated file
                if os.path.exists(self.market_data_file):
                    with open(self.market_data_file, 'r') as f:
                        data = json.load(f)
                        logger.info(f"Loaded fresh data with {len(data.get('prices', []))} coins")
                        return data
                        
            return {"error": "No market data available"}
        except Exception as e:
            logger.error(f"Error reading market data: {str(e)}")
            return {"error": str(e)}

    async def get_prices(self, symbols: List[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get prices for specific symbols or top coins by market cap
        
        Args:
            symbols: Optional list of cryptocurrency symbols (e.g., ["BTC", "ETH"])
            limit: Number of top coins to return if symbols is None (max 500)
            
        Returns:
            List of coin data
        """
        try:
            # Ensure limit doesn't exceed 500
            limit = min(500, limit)
            market_data = await self.get_market_data()
            
            if "prices" not in market_data:
                logger.error("No prices found in market data")
                return []
                
            prices = market_data["prices"]
            logger.info(f"Retrieved {len(prices)} coins from market data, requesting {limit}")
                
            if symbols:
                # Convert symbols to uppercase for case-insensitive comparison
                upper_symbols = [s.upper() for s in symbols]
                filtered_prices = [p for p in prices if p.get("symbol", "").upper() in upper_symbols]
                logger.info(f"Filtered prices for {len(filtered_prices)} out of {len(symbols)} requested symbols")
                return filtered_prices
            else:
                # Return top coins by market cap (up to limit)
                return prices[:min(limit, len(prices))]
                
        except Exception as e:
            logger.error(f"Error getting prices: {str(e)}")
            return []

    async def get_market_overview(self) -> Dict[str, Any]:
        """Get market overview statistics"""
        try:
            market_data = await self.get_market_data()
            if "overview" in market_data:
                return market_data["overview"]
            else:
                logger.error("No overview data found in market data")
                return {
                    "totalMarketCapUsd": 0,
                    "totalVolume24hUsd": 0,
                    "btcDominance": 0,
                    "ethDominance": 0,
                    "marketCapChange24h": 0,
                    "lastUpdated": datetime.now().isoformat()
                }
        except Exception as e:
            logger.error(f"Error getting market overview: {str(e)}")
            return {
                "totalMarketCapUsd": 0,
                "totalVolume24hUsd": 0,
                "btcDominance": 0,
                "ethDominance": 0,
                "marketCapChange24h": 0,
                "lastUpdated": datetime.now().isoformat()
            } 