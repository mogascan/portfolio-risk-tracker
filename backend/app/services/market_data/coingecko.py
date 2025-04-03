# backend/app/services/market_data/coingecko.py
import logging
import os
from typing import Dict, List, Any, Optional
import aiohttp
from datetime import datetime
import time
import random

from app.config import settings

logger = logging.getLogger(__name__)

class CoinGeckoService:
    """Service for fetching market data from CoinGecko API"""
    
    def __init__(self):
        # Base URL for CoinGecko API
        self.base_url = "https://api.coingecko.com/api/v3"
        
        # API key (pro version, optional)
        self.api_key = settings.COINGECKO_API_KEY
        
        # Time of last update
        self.last_updated = datetime.now().isoformat()
        
        # Common coin IDs (for mapping)
        self.coin_ids = {
            "btc": "bitcoin",
            "eth": "ethereum",
            "usdt": "tether",
            "usdc": "usd-coin",
            "bnb": "binancecoin",
            "sol": "solana",
            "ada": "cardano",
            "xrp": "ripple",
            "dot": "polkadot",
            "doge": "dogecoin",
            "link": "chainlink"
        }
    
    async def get_prices(self, asset_ids: List[str]) -> Dict[str, float]:
        """
        Get current prices for multiple assets
        
        Args:
            asset_ids: List of asset identifiers (e.g., 'btc', 'eth')
            
        Returns:
            Dictionary mapping asset_ids to prices
        """
        try:
            # Convert our asset_ids to CoinGecko IDs
            cg_ids = []
            for asset_id in asset_ids:
                if asset_id.lower() in self.coin_ids:
                    cg_ids.append(self.coin_ids[asset_id.lower()])
                else:
                    cg_ids.append(asset_id.lower())
            
            # If we don't have any valid IDs, return empty
            if not cg_ids:
                return {}
            
            # Create URL for price request
            ids_param = "%2C".join(cg_ids)  # comma-separated list with URL encoding
            url = f"{self.base_url}/simple/price?ids={ids_param}&vs_currencies=usd"
            
            # Add API key if available
            if self.api_key:
                url += f"&x_cg_pro_api_key={self.api_key}"
            
            # Make the request
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 429:
                        logger.warning("CoinGecko API rate limit exceeded. Using mock data.")
                        return self._get_mock_prices(asset_ids)
                    
                    if response.status != 200:
                        logger.error(f"Error from CoinGecko API: {response.status}")
                        return self._get_mock_prices(asset_ids)
                    
                    data = await response.json()
            
            # Update last updated timestamp
            self.last_updated = datetime.now().isoformat()
            
            # Process the response
            # CoinGecko returns: {"bitcoin": {"usd": 40000}, "ethereum": {"usd": 3000}}
            # We need to convert back to our asset_ids
            result = {}
            reverse_mapping = {v: k for k, v in self.coin_ids.items()}
            
            for cg_id, price_data in data.items():
                if "usd" in price_data:
                    # Try to map back to our asset_id
                    if cg_id in reverse_mapping:
                        asset_id = reverse_mapping[cg_id]
                    else:
                        asset_id = cg_id
                    
                    result[asset_id] = price_data["usd"]
            
            return result
        
        except Exception as e:
            logger.error(f"Error fetching prices from CoinGecko: {str(e)}")
            return self._get_mock_prices(asset_ids)
    
    async def get_asset_details(self, asset_ids: List[str]) -> Dict[str, Any]:
        """
        Get detailed information about assets
        
        Args:
            asset_ids: List of asset identifiers
            
        Returns:
            Dictionary mapping asset_ids to details
        """
        try:
            # For development, use mock data
            # In a real application, you would call the CoinGecko API
            
            result = {}
            
            for asset_id in asset_ids:
                if asset_id.lower() == "btc":
                    result[asset_id] = {
                        "name": "Bitcoin",
                        "symbol": "BTC",
                        "description": "Bitcoin is a decentralized digital currency, without a central bank or single administrator.",
                        "image": "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
                        "current_price": 40000,
                        "market_cap": 750000000000,
                        "market_cap_rank": 1,
                        "total_volume": 25000000000,
                        "high_24h": 41000,
                        "low_24h": 39500,
                        "price_change_24h": 2.5,
                        "price_change_7d": 5.2,
                        "price_change_30d": -3.1,
                        "circulating_supply": 18700000,
                        "total_supply": 21000000,
                        "max_supply": 21000000,
                        "last_updated": datetime.now().isoformat()
                    }
                
                elif asset_id.lower() == "eth":
                    result[asset_id] = {
                        "name": "Ethereum",
                        "symbol": "ETH",
                        "description": "Ethereum is a decentralized, open-source blockchain with smart contract functionality.",
                        "image": "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
                        "current_price": 3000,
                        "market_cap": 350000000000,
                        "market_cap_rank": 2,
                        "total_volume": 15000000000,
                        "high_24h": 3050,
                        "low_24h": 2950,
                        "price_change_24h": 3.2,
                        "price_change_7d": 7.5,
                        "price_change_30d": 12.3,
                        "circulating_supply": 120000000,
                        "total_supply": None,
                        "max_supply": None,
                        "last_updated": datetime.now().isoformat()
                    }
                
                elif asset_id.lower() == "usdt":
                    result[asset_id] = {
                        "name": "Tether",
                        "symbol": "USDT",
                        "description": "Tether is a stablecoin pegged to the US dollar.",
                        "image": "https://assets.coingecko.com/coins/images/325/large/tether.png",
                        "current_price": 1.0,
                        "market_cap": 80000000000,
                        "market_cap_rank": 3,
                        "total_volume": 60000000000,
                        "high_24h": 1.001,
                        "low_24h": 0.999,
                        "price_change_24h": 0.1,
                        "price_change_7d": 0.01,
                        "price_change_30d": 0.05,
                        "circulating_supply": 80000000000,
                        "total_supply": 80000000000,
                        "max_supply": None,
                        "last_updated": datetime.now().isoformat()
                    }
                
                elif asset_id.lower() == "sol":
                    result[asset_id] = {
                        "name": "Solana",
                        "symbol": "SOL",
                        "description": "Solana is a high-performance blockchain supporting builders around the world creating crypto apps.",
                        "image": "https://assets.coingecko.com/coins/images/4128/large/solana.png",
                        "current_price": 100,
                        "market_cap": 35000000000,
                        "market_cap_rank": 8,
                        "total_volume": 2000000000,
                        "high_24h": 102,
                        "low_24h": 98,
                        "price_change_24h": -1.5,
                        "price_change_7d": 10.5,
                        "price_change_30d": 25.1,
                        "circulating_supply": 350000000,
                        "total_supply": 500000000,
                        "max_supply": None,
                        "last_updated": datetime.now().isoformat()
                    }
                
                else:
                    # Generic details for unknown assets
                    result[asset_id] = {
                        "name": asset_id.upper(),
                        "symbol": asset_id.upper(),
                        "description": f"Mock description for {asset_id.upper()}.",
                        "image": "",
                        "current_price": 10,
                        "market_cap": 1000000000,
                        "market_cap_rank": 50,
                        "total_volume": 100000000,
                        "high_24h": 10.2,
                        "low_24h": 9.8,
                        "price_change_24h": 2.0,
                        "price_change_7d": 5.0,
                        "price_change_30d": 10.0,
                        "circulating_supply": 100000000,
                        "total_supply": 100000000,
                        "max_supply": 100000000,
                        "last_updated": datetime.now().isoformat()
                    }
            
            return result
        
        except Exception as e:
            logger.error(f"Error fetching asset details: {str(e)}")
            return {}
    
    async def get_asset_historical_prices(self, asset_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get historical price data for an asset
        
        Args:
            asset_id: Asset identifier
            days: Number of days of history
            
        Returns:
            Dictionary with historical price data
        """
        try:
            # For development, use mock data
            # In a real application, you would call the CoinGecko API
            
            # Generate mock data based on the asset
            base_price = 0
            if asset_id.lower() == "btc":
                base_price = 40000
            elif asset_id.lower() == "eth":
                base_price = 3000
            elif asset_id.lower() == "usdt":
                base_price = 1
            elif asset_id.lower() == "sol":
                base_price = 100
            else:
                base_price = 10
            
            # Generate time points (timestamps in milliseconds)
            now = int(time.time() * 1000)
            timestamps = [now - (i * 24 * 60 * 60 * 1000) for i in range(days)]
            timestamps.reverse()  # oldest first
            
            # Generate price points with some randomness
            prices = []
            price = base_price
            
            for i in range(days):
                # Add some randomness and a slight upward trend
                change = random.uniform(-0.05, 0.07) * price
                price += change
                price = max(0.1, price)  # ensure price doesn't go negative
                
                prices.append([timestamps[i], price])
            
            # Generate volume data (simplified)
            volumes = [[timestamp, random.uniform(0.5, 1.5) * base_price * 1000000] for timestamp in timestamps]
            
            # Generate market caps (simplified)
            market_caps = []
            for timestamp, price in prices:
                if asset_id.lower() == "btc":
                    market_cap = price * 18700000
                elif asset_id.lower() == "eth":
                    market_cap = price * 120000000
                elif asset_id.lower() == "usdt":
                    market_cap = price * 80000000000
                elif asset_id.lower() == "sol":
                    market_cap = price * 350000000
                else:
                    market_cap = price * 100000000
                
                market_caps.append([timestamp, market_cap])
            
            return {
                "prices": prices,
                "market_caps": market_caps,
                "total_volumes": volumes
            }
        
        except Exception as e:
            logger.error(f"Error fetching historical prices: {str(e)}")
            return {
                "prices": [],
                "market_caps": [],
                "total_volumes": []
            }
    
    async def get_market_data(self) -> Dict[str, Any]:
        """
        Get general market data (top coins, global metrics)
        
        Returns:
            Dictionary with market data
        """
        try:
            # Create URL for market data request
            url = f"{self.base_url}/coins/markets"
            params = {
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 100,
                "page": 1,
                "sparkline": False,
                "price_change_percentage": "24h,7d,30d,1y"
            }
            
            # Add API key if available
            if self.api_key:
                params["x_cg_pro_api_key"] = self.api_key
            
            # Make the request
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 429:
                        logger.warning("CoinGecko API rate limit exceeded. Using mock data.")
                        return self._get_mock_market_data()
                    
                    if response.status != 200:
                        logger.error(f"Error from CoinGecko API: {response.status}")
                        return self._get_mock_market_data()
                    
                    coins_data = await response.json()
            
            # Get global market data
            global_url = f"{self.base_url}/global"
            async with aiohttp.ClientSession() as session:
                async with session.get(global_url) as response:
                    if response.status != 200:
                        logger.error(f"Error fetching global data: {response.status}")
                        global_data = {
                            "data": {
                                "total_market_cap": {"usd": 0},
                                "total_volume": {"usd": 0},
                                "market_cap_percentage": {"btc": 0, "eth": 0},
                                "market_cap_change_percentage_24h_usd": 0,
                                "active_cryptocurrencies": 0
                            }
                        }
                    else:
                        global_data = await response.json()
            
            # Process global market data
            market_data = {
                "total_market_cap": global_data["data"]["total_market_cap"]["usd"],
                "total_volume_24h": global_data["data"]["total_volume"]["usd"],
                "market_cap_change_percentage_24h": global_data["data"]["market_cap_change_percentage_24h_usd"],
                "active_cryptocurrencies": global_data["data"]["active_cryptocurrencies"],
                "btc_dominance": global_data["data"]["market_cap_percentage"]["btc"],
                "eth_dominance": global_data["data"]["market_cap_percentage"]["eth"],
                "top_coins": [
                    {
                        'id': coin['id'],
                        'name': coin['name'],
                        'symbol': coin['symbol'],
                        'current_price': coin['current_price'],
                        'market_cap': coin['market_cap'],
                        'total_volume': coin['total_volume'],
                        'price_change_percentage_24h': coin['price_change_percentage_24h'],
                        'price_change_percentage_7d': coin['price_change_percentage_7d'],
                        'price_change_percentage_30d': coin['price_change_percentage_30d'],
                        'price_change_percentage_1y': coin['price_change_percentage_1y'],
                        'image': coin['image'],
                        'market_cap_rank': coin['market_cap_rank']
                    }
                    for coin in coins_data[:4]  # Get top 4 coins
                ]
            }
            
            return market_data
        
        except Exception as e:
            logger.error(f"Error fetching market data: {str(e)}")
            return self._get_mock_market_data()
    
    def _get_mock_prices(self, asset_ids: List[str]) -> Dict[str, float]:
        """Generate mock price data for development purposes"""
        mock_prices = {
            "btc": 40000,
            "eth": 3000,
            "usdt": 1.0,
            "usdc": 1.0,
            "bnb": 300,
            "sol": 100,
            "ada": 0.5,
            "xrp": 0.6,
            "dot": 12,
            "doge": 0.1,
            "link": 15
        }
        
        result = {}
        for asset_id in asset_ids:
            asset_id_lower = asset_id.lower()
            if asset_id_lower in mock_prices:
                result[asset_id_lower] = mock_prices[asset_id_lower]
            else:
                # Generate a random price for unknown assets
                result[asset_id_lower] = random.uniform(0.1, 100)
        
        return result
    
    def _get_mock_market_data(self) -> Dict[str, Any]:
        """Generate mock market data for development purposes"""
        return {
            "total_market_cap": 1700000000000,
            "total_volume_24h": 85000000000,
            "market_cap_change_percentage_24h": 2.3,
            "active_cryptocurrencies": 10000,
            "btc_dominance": 42.5,
            "eth_dominance": 18.2,
            "top_coins": [
                {
                    'id': 'bitcoin',
                    'name': 'Bitcoin',
                    'symbol': 'BTC',
                    'current_price': 40000,
                    'market_cap': 750000000000,
                    'total_volume': 25000000000,
                    'price_change_percentage_24h': 2.5,
                    'price_change_percentage_7d': 5.2,
                    'price_change_percentage_30d': 8.7,
                    'price_change_percentage_1y': 42.3,
                    'image': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
                    'market_cap_rank': 1
                },
                {
                    'id': 'ethereum',
                    'name': 'Ethereum',
                    'symbol': 'ETH',
                    'current_price': 3000,
                    'market_cap': 350000000000,
                    'total_volume': 15000000000,
                    'price_change_percentage_24h': 3.2,
                    'price_change_percentage_7d': 7.5,
                    'price_change_percentage_30d': 12.3,
                    'price_change_percentage_1y': 35.8,
                    'image': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
                    'market_cap_rank': 2
                },
                {
                    'id': 'tether',
                    'name': 'Tether',
                    'symbol': 'USDT',
                    'current_price': 1.0,
                    'market_cap': 80000000000,
                    'total_volume': 60000000000,
                    'price_change_percentage_24h': 0.1,
                    'price_change_percentage_7d': 0.01,
                    'price_change_percentage_30d': 0.05,
                    'price_change_percentage_1y': 0.2,
                    'image': 'https://assets.coingecko.com/coins/images/325/large/tether.png',
                    'market_cap_rank': 3
                },
                {
                    'id': 'solana',
                    'name': 'Solana',
                    'symbol': 'SOL',
                    'current_price': 100,
                    'market_cap': 35000000000,
                    'total_volume': 2000000000,
                    'price_change_percentage_24h': -1.5,
                    'price_change_percentage_7d': 10.5,
                    'price_change_percentage_30d': 25.1,
                    'price_change_percentage_1y': 85.4,
                    'image': 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
                    'market_cap_rank': 8
                }
            ]
        }