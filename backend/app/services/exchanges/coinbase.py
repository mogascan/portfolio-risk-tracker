# backend/app/services/exchanges/coinbase.py
import logging
import os
from typing import Dict, List, Any, Optional
import ccxt
import asyncio

from app.services.exchanges.base import ExchangeService

logger = logging.getLogger(__name__)

class CoinbaseService(ExchangeService):
    """Service for interacting with the Coinbase Pro API"""
    
    def __init__(self):
        # In a real application, you would get these from a secure source
        api_key = os.getenv("COINBASE_API_KEY", "")
        api_secret = os.getenv("COINBASE_API_SECRET", "")
        passphrase = os.getenv("COINBASE_PASSPHRASE", "")
        
        # Initialize CCXT Coinbase client
        self.exchange = ccxt.coinbasepro({
            'apiKey': api_key,
            'secret': api_secret,
            'password': passphrase,
            'enableRateLimit': True
        })
    
    async def get_balances(self) -> Dict[str, float]:
        """Get all non-zero balances from Coinbase Pro"""
        try:
            # In a production app, use ccxt.async_support
            loop = asyncio.get_event_loop()
            balance_data = await loop.run_in_executor(None, self._fetch_balances)
            
            # Process the balance data
            balances = {}
            for currency, data in balance_data.items():
                if data['total'] > 0:
                    balances[currency.lower()] = data['total']
            
            return balances
        
        except Exception as e:
            logger.error(f"Error fetching Coinbase balances: {str(e)}")
            return {}
    
    def _fetch_balances(self):
        """Helper method to fetch balances synchronously"""
        # Check if API keys are set
        if not self.exchange.apiKey or not self.exchange.secret:
            logger.warning("Coinbase API keys not set. Using mock data.")
            # Return mock data for development
            return {
                'BTC': {'free': 0.05, 'used': 0, 'total': 0.05},
                'ETH': {'free': 1.0, 'used': 0, 'total': 1.0},
                'USDC': {'free': 2000, 'used': 0, 'total': 2000},
                'SOL': {'free': 20, 'used': 0, 'total': 20}
            }
        
        # Fetch balances from the exchange
        return self.exchange.fetch_balance()
    
    async def get_transactions(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get recent transactions from Coinbase Pro"""
        try:
            # Similar implementation to Binance service
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
                    "source": "coinbase"
                })
            
            return formatted_trades
        
        except Exception as e:
            logger.error(f"Error fetching Coinbase transactions: {str(e)}")
            return []
    
    def _fetch_trades(self, limit: int, offset: int) -> List[Dict[str, Any]]:
        """Helper method to fetch trades synchronously"""
        # Check if API keys are set
        if not self.exchange.apiKey or not self.exchange.secret:
            logger.warning("Coinbase API keys not set. Using mock data.")
            # Return mock data for development
            return [
                {
                    'id': '789012',
                    'timestamp': 1645920000000,  # February 27th, 2022
                    'symbol': 'BTC/USD',
                    'side': 'buy',
                    'price': 38000,
                    'amount': 0.025,
                    'cost': 950,
                    'fee': {'cost': 2.5, 'currency': 'USD'}
                },
                {
                    'id': '789013',
                    'timestamp': 1645833600000,  # February 26th, 2022
                    'symbol': 'SOL/USD',
                    'side': 'buy',
                    'price': 90,
                    'amount': 10,
                    'cost': 900,
                    'fee': {'cost': 2.25, 'currency': 'USD'}
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
        """Get historical balance snapshots"""
        # Similar implementation to Binance service with mock data
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
            btc_balance = 0.05 * (1 + random.uniform(-0.05, 0.05))
            sol_balance = 20 * (1 + random.uniform(-0.05, 0.05))
            
            mock_data.append({
                "timestamp": day_timestamp,
                "balances": {
                    "btc": btc_balance,
                    "eth": 1.0,
                    "usdc": 2000,
                    "sol": sol_balance
                }
            })
        
        return mock_data