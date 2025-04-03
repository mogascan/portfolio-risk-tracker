# backend/app/services/exchanges/binance.py
import logging
import os
from typing import Dict, List, Any, Optional
import ccxt
import asyncio

from app.services.exchanges.base import ExchangeService

logger = logging.getLogger(__name__)

class BinanceService(ExchangeService):
    """Service for interacting with the Binance API"""
    
    def __init__(self):
        # In a real application, you would get these from a secure source
        api_key = os.getenv("BINANCE_API_KEY", "")
        api_secret = os.getenv("BINANCE_API_SECRET", "")
        
        # Initialize CCXT Binance client
        self.exchange = ccxt.binance({
            'apiKey': api_key,
            'secret': api_secret,
            'enableRateLimit': True,
            'options': {
                'defaultType': 'spot',  # spot, margin, future, delivery
            }
        })
    
    async def get_balances(self) -> Dict[str, float]:
        """Get all non-zero balances from Binance"""
        try:
            # In a production app, use ccxt.async_support for async operations
            # For simplicity in this example, we'll run synchronous code in a thread pool
            loop = asyncio.get_event_loop()
            balance_data = await loop.run_in_executor(None, self._fetch_balances)
            
            # Process the balance data
            balances = {}
            for currency, data in balance_data.items():
                if data['total'] > 0:
                    balances[currency.lower()] = data['total']
            
            return balances
        
        except Exception as e:
            logger.error(f"Error fetching Binance balances: {str(e)}")
            return {}
    
    def _fetch_balances(self):
        """Helper method to fetch balances synchronously"""
        # Check if API keys are set
        if not self.exchange.apiKey or not self.exchange.secret:
            logger.warning("Binance API keys not set. Using mock data.")
            # Return mock data for development
            return {
                'BTC': {'free': 0.1, 'used': 0, 'total': 0.1},
                'ETH': {'free': 2.5, 'used': 0, 'total': 2.5},
                'USDT': {'free': 1000, 'used': 0, 'total': 1000},
                'BNB': {'free': 10, 'used': 0, 'total': 10}
            }
        
        # Fetch balances from the exchange
        return self.exchange.fetch_balance()['info']['balances']
    
    async def get_transactions(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get recent transactions from Binance"""
        try:
            # In a production app, use ccxt.async_support
            loop = asyncio.get_event_loop()
            trades = await loop.run_in_executor(
                None, 
                lambda: self._fetch_trades(limit, offset)
            )
            
            # Format trades to a standardized format
            formatted_trades = []
            for trade in trades:
                formatted_trades.append({
                    "id": trade['id'],
                    "timestamp": trade['timestamp'],
                    "symbol": trade['symbol'],
                    "type": "trade",
                    "side": trade['side'],
                    "price": trade['price'],
                    "amount": trade['amount'],
                    "cost": trade['cost'],
                    "fee": trade.get('fee', {}).get('cost', 0),
                    "fee_currency": trade.get('fee', {}).get('currency', ''),
                    "source": "binance"
                })
            
            return formatted_trades
        
        except Exception as e:
            logger.error(f"Error fetching Binance transactions: {str(e)}")
            return []
    
    def _fetch_trades(self, limit: int, offset: int) -> List[Dict[str, Any]]:
        """Helper method to fetch trades synchronously"""
        # Check if API keys are set
        if not self.exchange.apiKey or not self.exchange.secret:
            logger.warning("Binance API keys not set. Using mock data.")
            # Return mock data for development
            return [
                {
                    'id': '123456',
                    'timestamp': 1646006400000,  # March 1st, 2022
                    'symbol': 'BTC/USDT',
                    'side': 'buy',
                    'price': 40000,
                    'amount': 0.05,
                    'cost': 2000,
                    'fee': {'cost': 2, 'currency': 'USDT'}
                },
                {
                    'id': '123457',
                    'timestamp': 1646092800000,  # March 2nd, 2022
                    'symbol': 'ETH/USDT',
                    'side': 'buy',
                    'price': 2800,
                    'amount': 1,
                    'cost': 2800,
                    'fee': {'cost': 2.8, 'currency': 'USDT'}
                }
            ]
        
        # Get all markets
        markets = self.exchange.load_markets()
        
        # Fetch trades for each symbol
        all_trades = []
        for symbol in markets:
            try:
                trades = self.exchange.fetch_my_trades(symbol, limit=limit)
                all_trades.extend(trades)
            except Exception as e:
                logger.debug(f"Error fetching trades for {symbol}: {str(e)}")
                continue
        
        # Sort by timestamp (newest first) and apply pagination
        all_trades.sort(key=lambda x: x['timestamp'], reverse=True)
        return all_trades[offset:offset+limit]
    
    async def get_historical_balances(self, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get historical balance snapshots
        Note: Binance doesn't provide historical balances directly.
        This would typically be implemented by maintaining your own
        snapshots in a database.
        """
        # For MVP, return mock data
        logger.info(f"Fetching {days} days of historical balances")
        
        # Mock data with daily snapshots
        mock_data = []
        
        # Current timestamp in milliseconds
        now = asyncio.get_event_loop().time() * 1000
        
        # Create a snapshot for each day
        for i in range(days):
            # Timestamp for the day (days ago)
            day_timestamp = now - (i * 24 * 60 * 60 * 1000)
            
            # Add random variation to mock price changes
            import random
            btc_balance = 0.1 * (1 + random.uniform(-0.05, 0.05))
            eth_balance = 2.5 * (1 + random.uniform(-0.05, 0.05))
            
            mock_data.append({
                "timestamp": day_timestamp,
                "balances": {
                    "btc": btc_balance,
                    "eth": eth_balance,
                    "usdt": 1000,
                    "bnb": 10
                }
            })
        
        return mock_data