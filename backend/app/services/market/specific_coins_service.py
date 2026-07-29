import logging
import os
import json
import ssl
import asyncio
import aiohttp
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class SpecificCoinsService:
    """Service for fetching and managing specific coins data beyond rank 500"""
    
    def __init__(self):
        self.base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
        self.specific_coins_file = os.path.join(self.base_path, 'data', 'specific_coins.json')
        self.last_update = None
        self.update_interval = timedelta(minutes=5)  # Same as market data
        self.coingecko_api = "https://api.coingecko.com/api/v3"
        self.update_task = None
        
        # Curated list of specific coins beyond rank 500
        self.specific_coins_ids = [
            "bankercoin-2",
            "game-by-virtuals"
        ]

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
                logger.info("Specific coins update loop started")
            except Exception as e:
                logger.error(f"Failed to start specific coins update loop: {str(e)}")

    async def _update_loop(self):
        """Background loop to update specific coins data periodically"""
        while True:
            try:
                await self._update_specific_coins_data()
                logger.info(f"Next specific coins update in {self.update_interval.total_seconds()} seconds")
                await asyncio.sleep(self.update_interval.total_seconds())
            except Exception as e:
                logger.error(f"Error in specific coins update loop: {str(e)}")
                await asyncio.sleep(60)  # Wait a minute before retrying

    async def _update_specific_coins_data(self):
        """Update specific coins data from CoinGecko"""
        try:
            logger.info("Starting specific coins data update from CoinGecko API")
            
            if not self.specific_coins_ids:
                logger.warning("No specific coins configured")
                return
            
            # Create a custom SSL context that ignores certificate verification
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=ssl_context)) as session:
                # First, fetch basic market data
                coin_ids = ",".join(self.specific_coins_ids)
                async with session.get(
                    f"{self.coingecko_api}/coins/markets",
                    params={
                        "vs_currency": "usd",
                        "ids": coin_ids,
                        "order": "market_cap_desc",
                        "per_page": len(self.specific_coins_ids),
                        "page": 1,
                        "sparkline": "false",
                        "price_change_percentage": "1h,24h,7d,30d,1y"
                    }
                ) as response:
                    if response.status == 200:
                        coins_data = await response.json()
                        logger.info(f"Successfully received basic data for {len(coins_data)} specific coins from CoinGecko API")
                        
                        # Now fetch detailed data for each coin to get supply information
                        detailed_coins_data = []
                        for coin in coins_data:
                            coin_id = coin.get("id")
                            if coin_id:
                                try:
                                    # Fetch detailed coin data
                                    async with session.get(f"{self.coingecko_api}/coins/{coin_id}") as detail_response:
                                        if detail_response.status == 200:
                                            detailed_coin = await detail_response.json()
                                            # Merge basic market data with detailed data
                                            coin.update({
                                                "circulating_supply": detailed_coin.get("market_data", {}).get("circulating_supply", 0) or 0,
                                                "total_supply": detailed_coin.get("market_data", {}).get("total_supply", 0) or 0,
                                                "max_supply": detailed_coin.get("market_data", {}).get("max_supply", 0) or 0,
                                                "fully_diluted_valuation": detailed_coin.get("market_data", {}).get("fully_diluted_valuation", {}).get("usd", 0) or 0
                                            })
                                            detailed_coins_data.append(coin)
                                            logger.info(f"Fetched detailed data for {coin_id}")
                                        else:
                                            logger.warning(f"Failed to fetch detailed data for {coin_id}: HTTP {detail_response.status}")
                                            detailed_coins_data.append(coin)  # Use basic data if detailed fetch fails
                                except Exception as e:
                                    logger.error(f"Error fetching detailed data for {coin_id}: {str(e)}")
                                    detailed_coins_data.append(coin)  # Use basic data if detailed fetch fails
                                
                                # Add small delay to avoid rate limiting
                                await asyncio.sleep(0.1)
                            else:
                                detailed_coins_data.append(coin)
                        
                        coins_data = detailed_coins_data
                        
                        # Format the data to match market data structure exactly
                        formatted_coins = []
                        for coin in coins_data:
                            # Ensure market_cap and total_volume are numbers, not None
                            market_cap = coin.get("market_cap", 0) or 0
                            total_volume_value = coin.get("total_volume", 0) or 0
                            
                            # Get supply data for float calculations
                            circulating_supply = coin.get("circulating_supply", 0) or 0
                            total_supply = coin.get("total_supply", 0) or 0
                            max_supply = coin.get("max_supply", 0) or 0
                            fully_diluted_valuation = coin.get("fully_diluted_valuation", 0) or 0
                            
                            # Calculate float percentage
                            float_percentage = self._calculate_float_percentage(circulating_supply, total_supply, max_supply)
                            float_status = self._get_float_status(float_percentage)
                            
                            formatted_coin = {
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
                                "market_cap_rank": coin.get("market_cap_rank", 0) or 0,
                                "isSpecificCoin": True,
                                # Supply data for float calculations
                                "circulating_supply": circulating_supply,
                                "total_supply": total_supply,
                                "max_supply": max_supply,
                                "fully_diluted_valuation": fully_diluted_valuation,
                                "float_percentage": float_percentage,
                                "float_status": float_status
                            }
                            formatted_coins.append(formatted_coin)
                        
                        # Create the final data structure to match market data format
                        now = datetime.now().isoformat()
                        specific_coins_data = {
                            "coins": formatted_coins,
                            "total": len(formatted_coins),
                            "last_updated": now,
                            "updated": now,
                            "message": f"Successfully fetched {len(formatted_coins)} specific coins beyond rank 500"
                        }
                        
                        # Save to file
                        try:
                            os.makedirs(os.path.dirname(self.specific_coins_file), exist_ok=True)
                            with open(self.specific_coins_file, 'w') as f:
                                json.dump(specific_coins_data, f, indent=2)
                            self.last_update = datetime.now()
                            logger.info(f"Updated specific coins file with {len(formatted_coins)} coins from CoinGecko")
                        except Exception as e:
                            logger.error(f"Error saving specific coins file: {e}")
                    else:
                        logger.error(f"Error fetching specific coins data: HTTP {response.status}")
                        response_text = await response.text()
                        logger.error(f"Response: {response_text[:200]}...")
        except Exception as e:
            logger.error(f"Error updating specific coins data: {str(e)}")

    async def get_specific_coins_data(self) -> Dict[str, Any]:
        """Get current specific coins data, forcing an update if data is stale"""
        try:
            # Check if data file exists and is fresh
            needs_update = True
            
            if os.path.exists(self.specific_coins_file):
                try:
                    with open(self.specific_coins_file, 'r') as f:
                        data = json.load(f)
                        
                    # Check if data is recent (last 5 minutes)
                    if "last_updated" in data:
                        last_updated = datetime.fromisoformat(data["last_updated"])
                        now = datetime.now()
                        # Ensure both times are naive or aware for comparison
                        if last_updated.tzinfo is not None:
                            # Convert to naive datetime if last_updated has timezone
                            last_updated = last_updated.replace(tzinfo=None)
                        
                        # Only use cached data if it's less than 5 minutes old
                        if now - last_updated < timedelta(minutes=5):
                            needs_update = False
                            logger.info(f"Using cached specific coins data from {last_updated.isoformat()}")
                            return data
                except Exception as e:
                    logger.warning(f"Could not read specific coins file or data is invalid: {e}")
            
            # If we need an update, force one now
            if needs_update:
                logger.info("Specific coins data needs update - fetching fresh data")
                await self._update_specific_coins_data()
                
                # Try to read the updated file
                if os.path.exists(self.specific_coins_file):
                    with open(self.specific_coins_file, 'r') as f:
                        data = json.load(f)
                        logger.info(f"Loaded fresh specific coins data with {len(data.get('coins', []))} coins")
                        return data
                        
            return {"coins": [], "message": "No specific coins data available"}
        except Exception as e:
            logger.error(f"Error reading specific coins data: {str(e)}")
            return {"coins": [], "message": f"Error: {str(e)}"}

    def _calculate_float_percentage(self, circulating_supply: float, total_supply: float, max_supply: float) -> float:
        """
        Calculate float percentage based on circulating supply vs total/max supply
        """
        # Use the larger of total_supply or max_supply for calculation
        supply_for_calculation = max(total_supply or 0, max_supply or 0)
        
        if supply_for_calculation <= 0 or circulating_supply <= 0:
            return 0.0
        
        return (circulating_supply / supply_for_calculation) * 100

    def _get_float_status(self, float_percentage: float) -> str:
        """
        Determine float status based on percentage
        """
        if float_percentage == 0:
            return "Unknown"
        elif float_percentage >= 50:
            return "High Float"
        elif float_percentage >= 20:
            return "Medium Float"
        else:
            return "Low Float"

# Create a singleton instance
_specific_coins_service = None

def get_specific_coins_service():
    """Get or create the specific coins service instance"""
    global _specific_coins_service
    if _specific_coins_service is None:
        _specific_coins_service = SpecificCoinsService()
    return _specific_coins_service
