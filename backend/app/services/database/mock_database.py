"""
Mock database service for testing and development.

This module provides a mock implementation of the DatabaseService class
that returns realistic-looking data without requiring a real database connection.
"""
import logging
import json
import os
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)

class MockDatabaseService:
    """
    Mock implementation of the DatabaseService that doesn't use a real database.
    
    This class provides the same interface as DatabaseService but returns
    in-memory data for testing and development purposes.
    """
    
    def __init__(self):
        """Initialize the mock database service"""
        logger.info("Initializing MockDatabaseService")
        
        # Mock data storage
        self._users = {}
        self._assets = {}
        self._transactions = {}
        self._watchlists = {}
        self._alerts = {}
        self._crypto_prices = {}
        self._price_history = {}
        self._market_overview = None
        
        # Load sample data
        self._load_sample_data()
    
    def _load_sample_data(self):
        """Load sample data for the mock database"""
        # Sample user
        user_id = "user123"
        self._users[user_id] = {
            "id": user_id,
            "username": "testuser",
            "email": "test@example.com",
            "password_hash": "hashed_password",
            "created_at": datetime.now().isoformat(),
            "risk_profile": "moderate"
        }
        
        # Sample assets
        sample_assets = [
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "symbol": "BTC",
                "name": "Bitcoin",
                "quantity": 0.5,
                "avg_buy_price": 45000.0,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "symbol": "ETH",
                "name": "Ethereum",
                "quantity": 5.0,
                "avg_buy_price": 3000.0,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "symbol": "SOL",
                "name": "Solana",
                "quantity": 20.0,
                "avg_buy_price": 100.0,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        ]
        
        for asset in sample_assets:
            self._assets[asset["id"]] = asset
        
        # Sample transactions
        sample_transactions = [
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "symbol": "BTC",
                "type": "purchase",
                "quantity": 0.5,
                "price": 45000.0,
                "fee": 10.0,
                "timestamp": (datetime.now() - timedelta(days=30)).isoformat(),
                "exchange": "Coinbase"
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "symbol": "ETH",
                "type": "purchase",
                "quantity": 5.0,
                "price": 3000.0,
                "fee": 5.0,
                "timestamp": (datetime.now() - timedelta(days=15)).isoformat(),
                "exchange": "Binance"
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "symbol": "SOL",
                "type": "purchase",
                "quantity": 20.0,
                "price": 100.0,
                "fee": 2.0,
                "timestamp": (datetime.now() - timedelta(days=7)).isoformat(),
                "exchange": "FTX"
            }
        ]
        
        for tx in sample_transactions:
            self._transactions[tx["id"]] = tx
        
        # Sample watchlist
        self._watchlists[user_id] = [
            {
                "id": 1,
                "user_id": user_id,
                "symbol": "ADA",
                "added_at": (datetime.now() - timedelta(days=10)).isoformat()
            },
            {
                "id": 2,
                "user_id": user_id,
                "symbol": "DOT",
                "added_at": (datetime.now() - timedelta(days=5)).isoformat()
            }
        ]
        
        # Sample crypto prices
        self._crypto_prices = {
            "BTC": {
                "symbol": "BTC",
                "name": "Bitcoin",
                "price_usd": 50000.0,
                "market_cap_usd": 950000000000.0,
                "volume_24h_usd": 30000000000.0,
                "change_24h": 2.5,
                "timestamp": datetime.now().isoformat()
            },
            "ETH": {
                "symbol": "ETH",
                "name": "Ethereum",
                "price_usd": 3500.0,
                "market_cap_usd": 420000000000.0,
                "volume_24h_usd": 15000000000.0,
                "change_24h": 1.8,
                "timestamp": datetime.now().isoformat()
            },
            "SOL": {
                "symbol": "SOL",
                "name": "Solana",
                "price_usd": 120.0,
                "market_cap_usd": 40000000000.0,
                "volume_24h_usd": 3000000000.0,
                "change_24h": 3.2,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        # Sample market overview
        self._market_overview = {
            "total_market_cap_usd": 2500000000000.0,
            "total_volume_24h_usd": 100000000000.0,
            "btc_dominance": 42.0,
            "eth_dominance": 18.0,
            "market_cap_change_24h": 1.5,
            "timestamp": datetime.now().isoformat()
        }
    
    # Portfolio database operations
    
    async def get_user_assets(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all assets for a user"""
        logger.debug(f"Mock: Getting assets for user {user_id}")
        return [asset for asset in self._assets.values() if asset["user_id"] == user_id]
    
    async def get_transactions(self, user_id: str, 
                               symbol: Optional[str] = None, 
                               limit: int = 50, 
                               offset: int = 0) -> List[Dict[str, Any]]:
        """Get transactions for a user, optionally filtered by symbol"""
        logger.debug(f"Mock: Getting transactions for user {user_id}, symbol={symbol}")
        
        # Filter transactions
        transactions = [tx for tx in self._transactions.values() if tx["user_id"] == user_id]
        
        if symbol:
            transactions = [tx for tx in transactions if tx["symbol"] == symbol]
        
        # Sort by timestamp (newest first)
        transactions.sort(key=lambda x: x["timestamp"], reverse=True)
        
        # Apply limit and offset
        return transactions[offset:offset+limit]
    
    async def add_transaction(self, transaction: Dict[str, Any]) -> bool:
        """Add a new transaction and update asset holdings"""
        logger.debug(f"Mock: Adding transaction for {transaction.get('symbol')}")
        
        # Generate ID if not provided
        if "id" not in transaction:
            transaction["id"] = str(uuid.uuid4())
        
        # Set timestamp if not provided
        if "timestamp" not in transaction:
            transaction["timestamp"] = datetime.now().isoformat()
        
        # Store transaction
        self._transactions[transaction["id"]] = transaction
        
        # Update asset holdings (simplified)
        user_id = transaction["user_id"]
        symbol = transaction["symbol"]
        
        # Find matching asset
        asset = None
        for a in self._assets.values():
            if a["user_id"] == user_id and a["symbol"] == symbol:
                asset = a
                break
        
        if asset:
            # Update existing asset
            if transaction["type"] == "purchase":
                asset["quantity"] += transaction["quantity"]
            elif transaction["type"] == "sale":
                asset["quantity"] -= transaction["quantity"]
            
            asset["updated_at"] = datetime.now().isoformat()
        else:
            # Create new asset
            if transaction["type"] == "purchase":
                new_asset = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "symbol": symbol,
                    "name": symbol,  # This would be fetched from market data in the real implementation
                    "quantity": transaction["quantity"],
                    "avg_buy_price": transaction["price"],
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                self._assets[new_asset["id"]] = new_asset
        
        return True
    
    # Market database operations
    
    async def get_latest_crypto_prices(self, symbols: Optional[List[str]] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get latest cryptocurrency prices, optionally filtered by symbols"""
        logger.debug(f"Mock: Getting latest crypto prices, symbols={symbols}")
        
        prices = list(self._crypto_prices.values())
        
        if symbols:
            prices = [price for price in prices if price["symbol"] in symbols]
        
        return prices[:limit]
    
    async def get_latest_market_overview(self) -> Optional[Dict[str, Any]]:
        """Get the latest market overview data"""
        logger.debug("Mock: Getting latest market overview")
        return self._market_overview
    
    # Other methods can be implemented as needed
    
    # Mock-specific methods
    
    def reset_mock_data(self):
        """Reset the mock database to its initial state"""
        logger.debug("Resetting mock database")
        self._users = {}
        self._assets = {}
        self._transactions = {}
        self._watchlists = {}
        self._alerts = {}
        self._crypto_prices = {}
        self._price_history = {}
        self._market_overview = None
        
        self._load_sample_data()
    
    def set_mock_data(self, data_type: str, data: Any):
        """Set custom mock data for testing"""
        logger.debug(f"Setting custom mock data for {data_type}")
        
        if data_type == "users":
            self._users = data
        elif data_type == "assets":
            self._assets = data
        elif data_type == "transactions":
            self._transactions = data
        elif data_type == "watchlists":
            self._watchlists = data
        elif data_type == "crypto_prices":
            self._crypto_prices = data
        elif data_type == "market_overview":
            self._market_overview = data
        else:
            logger.warning(f"Unknown data type: {data_type}") 