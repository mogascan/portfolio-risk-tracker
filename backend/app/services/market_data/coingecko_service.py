"""
Service for interacting with the CoinGecko API
"""
import aiohttp
import asyncio
import os
from datetime import datetime, timezone, timedelta
import logging
from typing import List, Dict, Optional, Union, Tuple
from sqlalchemy.orm import Session

from app.rules import COINGECKO_API, COINGECKO_ENDPOINTS, RATE_LIMIT_RULES
from app.models.crypto_data import CryptoData, PriceHistory

logger = logging.getLogger(__name__)

def safe_float(value: Union[str, int, float, bool, None]) -> Optional[float]:
    """Convert value to float safely"""
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

class CoinGeckoService:
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3".rstrip("/")
        self.api_key = os.getenv("COINGECKO_API_KEY")
        self.rate_limit = COINGECKO_API["rate_limit"]["free_tier"]
        self.session = None
        self.ssl_context = False  # This disables SSL verification
        self.last_request_time = datetime.min
        self.requests_this_minute = 0
        self.min_delay = 30  # Minimum 30 seconds between requests
    
    async def __aenter__(self):
        if not self.session:
            self.session = aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=self.ssl_context))
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
            self.session = None
    
    async def _wait_for_rate_limit(self):
        """Wait if we've exceeded rate limits"""
        current_time = datetime.now()
        time_since_last = (current_time - self.last_request_time).total_seconds()
        
        # Always wait minimum delay between requests
        if time_since_last < self.min_delay:
            await asyncio.sleep(self.min_delay - time_since_last)
        
        # Reset counter if a minute has passed
        if time_since_last >= 60:
            self.requests_this_minute = 0
        
        # Wait if we've hit the rate limit
        if self.requests_this_minute >= self.rate_limit["calls_per_minute"]:
            logger.info("Rate limit reached, waiting 60 seconds...")
            await asyncio.sleep(60)
            self.requests_this_minute = 0
    
    async def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        """Make a rate-limited request to the CoinGecko API"""
        if not self.session:
            self.session = aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=self.ssl_context))
        
        # Ensure endpoint starts with a slash and remove any extra slashes
        endpoint = "/" + endpoint.lstrip("/")
        url = f"{self.base_url}{endpoint}"
        
        # Initialize params if None
        if params is None:
            params = {}
        
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                # Wait for rate limit
                await self._wait_for_rate_limit()
                
                logger.info(f"Making request to {url}")
                async with self.session.get(url, params=params) as response:
                    self.last_request_time = datetime.now()
                    self.requests_this_minute += 1
                    
                    if response.status == 429:  # Rate limit exceeded
                        retry_after = int(response.headers.get('Retry-After', self.rate_limit["retry_after_seconds"]))
                        logger.warning(f"Rate limit exceeded. Waiting {retry_after} seconds...")
                        await asyncio.sleep(retry_after)
                        self.requests_this_minute = 0
                        retry_count += 1
                        continue
                    
                    response.raise_for_status()
                    data = await response.json()
                    logger.info(f"Successfully received data from {url}")
                    return data
            except Exception as e:
                logger.error(f"Error making request to {url}: {str(e)}")
                retry_count += 1
                if retry_count < max_retries:
                    await asyncio.sleep(self.min_delay)
                else:
                    raise
        
        raise Exception(f"Max retries ({max_retries}) exceeded for request to {url}")
    
    async def get_coins_list(self) -> List[Dict]:
        """Get list of all supported coins"""
        logger.info("Fetching list of all supported coins")
        return await self._make_request(COINGECKO_ENDPOINTS["coins_list"])
    
    async def get_coins_markets(self, limit: int = 100) -> List[Dict]:
        """Get market data for coins"""
        params = {
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": limit,
            "page": 1,
            "sparkline": "false"
        }
        
        try:
            return await self._make_request("/coins/markets", params)
        except Exception as e:
            logger.error(f"Exception while fetching data from CoinGecko: {str(e)}")
            return []
    
    async def get_coin_details(self, coin_id: str) -> Dict:
        """Get detailed information for a specific coin"""
        endpoint = COINGECKO_ENDPOINTS["coin_details"].format(id=coin_id)
        logger.info(f"Fetching details for coin: {coin_id}")
        return await self._make_request(endpoint)
    
    async def get_simple_price(self, coin_ids: List[str], vs_currencies: List[str] = ["usd"]) -> Dict:
        """Get current price for multiple coins"""
        params = {
            "ids": ",".join(coin_ids),
            "vs_currencies": ",".join(vs_currencies)
        }
        logger.info(f"Fetching prices for coins: {coin_ids}")
        return await self._make_request(COINGECKO_ENDPOINTS["simple_price"], params)
    
    async def check_available_days(self, coin_id: str) -> int:
        """Check how many days of history are available for a coin"""
        try:
            # First try to get coin details with market data
            coin_details = await self.get_coin_details(coin_id)
            
            # Get genesis date if available
            if "genesis_date" in coin_details and coin_details["genesis_date"]:
                genesis_date = datetime.strptime(coin_details["genesis_date"], "%Y-%m-%d")
                days_since_genesis = (datetime.now() - genesis_date).days
                logger.info(f"Coin {coin_id} has been available for {days_since_genesis} days since genesis")
                return min(days_since_genesis, 365)  # Cap at 365 days
            
            # If no genesis date, try max available (200 days)
            return 200
        except Exception as e:
            logger.error(f"Error checking available days for {coin_id}: {str(e)}")
            # Default to a conservative value
            return 100
    
    async def get_historical_prices(self, coin_id: str, days: Optional[int] = None) -> List[Dict]:
        """Get historical price data for a coin"""
        if days is None:
            days = await self.check_available_days(coin_id)
        
        logger.info(f"Fetching {days} days of historical data for {coin_id}")
        
        endpoint = f"/coins/{coin_id}/market_chart"
        params = {
            "vs_currency": "usd",
            "days": days,
            "interval": "daily"
        }
        
        try:
            data = await self._make_request(endpoint, params)
            if "prices" in data:
                # Convert timestamps to datetime objects and ensure uniqueness
                seen_dates = set()
                unique_prices = []
                
                for timestamp, price in data["prices"]:
                    dt = datetime.fromtimestamp(timestamp/1000, tz=timezone.utc)
                    date_str = dt.strftime('%Y-%m-%d')
                    
                    # Only add if we haven't seen this date before
                    if date_str not in seen_dates:
                        seen_dates.add(date_str)
                        unique_prices.append({
                            "price": price,
                            "timestamp": dt.replace(hour=0, minute=0, second=0, microsecond=0)  # Normalize to start of day
                        })
                
                logger.info(f"Retrieved {len(unique_prices)} unique daily prices for {coin_id}")
                return unique_prices
            return []
        except Exception as e:
            logger.error(f"Error fetching historical prices for {coin_id}: {str(e)}")
            return []

    async def process_single_coin(self, db: Session, coin: Dict) -> bool:
        """Process a single coin's data"""
        try:
            logger.info(f"Processing coin: {coin['name']} ({coin['symbol']})")
            
            # Convert numeric values safely
            current_price = safe_float(coin.get('current_price'))
            market_cap = safe_float(coin.get('market_cap'))
            total_volume = safe_float(coin.get('total_volume'))
            
            # Check if coin exists
            crypto_data = db.query(CryptoData).filter(CryptoData.coin_id == coin["id"]).first()
            
            if not crypto_data:
                # Create new record
                logger.info(f"Creating new record for {coin['name']} ({coin['symbol']})")
                crypto_data = CryptoData(
                    coin_id=str(coin["id"]),
                    symbol=str(coin["symbol"]).upper(),
                    name=str(coin["name"]),
                    current_price=current_price,
                    market_cap=market_cap,
                    total_volume=total_volume,
                    last_updated=datetime.now(timezone.utc)
                )
                db.add(crypto_data)
            else:
                # Update existing record
                logger.info(f"Updating record for {coin['name']} ({coin['symbol']})")
                crypto_data.current_price = current_price
                crypto_data.market_cap = market_cap
                crypto_data.total_volume = total_volume
                crypto_data.last_updated = datetime.now(timezone.utc)
            
            # Commit basic coin data to get the ID
            db.commit()
            
            # Create price history record for current price
            if current_price is not None:
                current_time = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                
                # Check if we already have a price for today
                existing_price = (
                    db.query(PriceHistory)
                    .filter(
                        PriceHistory.crypto_id == crypto_data.id,
                        PriceHistory.timestamp == current_time
                    )
                    .first()
                )
                
                if not existing_price:
                    price_history = PriceHistory(
                        crypto=crypto_data,
                        price=current_price,
                        timestamp=current_time
                    )
                    db.add(price_history)
                    db.commit()
            
            # Check available days for historical data
            available_days = await self.check_available_days(coin["id"])
            logger.info(f"Found {available_days} available days of history for {coin['name']}")
            
            # Fetch and process historical data with retries
            max_retries = 3
            retry_count = 0
            historical_data_success = False
            
            while retry_count < max_retries and not historical_data_success:
                try:
                    logger.info(f"Fetching historical data for {coin['name']} ({coin['symbol']}) - Attempt {retry_count + 1}")
                    historical_prices = await self.get_historical_prices(coin["id"], available_days)
                    
                    if historical_prices:
                        logger.info(f"Processing {len(historical_prices)} historical price points for {coin['name']}")
                        for price_data in historical_prices:
                            # Check if we already have this price point
                            existing_price = (
                                db.query(PriceHistory)
                                .filter(
                                    PriceHistory.crypto_id == crypto_data.id,
                                    PriceHistory.timestamp == price_data["timestamp"]
                                )
                                .first()
                            )
                            
                            if not existing_price:
                                price_history = PriceHistory(
                                    crypto=crypto_data,
                                    price=price_data["price"],
                                    timestamp=price_data["timestamp"]
                                )
                                db.add(price_history)
                        
                        # Commit all new price history records
                        db.commit()
                        historical_data_success = True
                        logger.info(f"Successfully processed historical data for {coin['name']}")
                    else:
                        logger.warning(f"No historical prices returned for {coin['name']}")
                        retry_count += 1
                        
                except Exception as e:
                    logger.error(f"Error processing historical data for {coin['name']}: {str(e)}")
                    retry_count += 1
                    if retry_count < max_retries:
                        logger.info(f"Retrying in {self.rate_limit['retry_after_seconds']} seconds...")
                        await asyncio.sleep(self.rate_limit["retry_after_seconds"])
            
            if not historical_data_success:
                logger.error(f"Failed to process historical data for {coin['name']} after {max_retries} attempts")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing coin {coin.get('name', 'Unknown')}: {str(e)}")
            return False

    async def update_crypto_data(self, db: Session) -> None:
        """Update cryptocurrency data in the database"""
        try:
            logger.info("Starting crypto data update")
            coins_data = await self.get_coins_markets()
            logger.info(f"Retrieved {len(coins_data)} coins from CoinGecko")
            
            # Process one coin at a time
            total_coins = len(coins_data)
            successful_coins = 0
            
            for i, coin in enumerate(coins_data):
                logger.info(f"Processing coin {i+1} of {total_coins}: {coin['name']}")
                
                # Process this coin completely before moving to the next
                success = await self.process_single_coin(db, coin)
                
                if success:
                    successful_coins += 1
                
                # Allow recovery time between coins
                await asyncio.sleep(self.min_delay)
            
            logger.info(f"Successfully updated {successful_coins} out of {total_coins} coins")
        except Exception as e:
            logger.error(f"Error updating crypto data: {str(e)}")
            raise 