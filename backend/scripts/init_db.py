#!/usr/bin/env python3
"""
Database initialization script for creating the databases
and populating them with sample data.
"""
import os
import sys
import json
import uuid
import asyncio
import random
from datetime import datetime, timedelta
import argparse

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.database import DatabaseService
from app.services.market_data import MarketDataService
from app.core.logging import get_logger

# Initialize logger
logger = get_logger(__name__)

async def create_test_user(db_service):
    """Create a test user"""
    try:
        conn = sqlite3.connect(db_service.portfolio_db)
        cursor = conn.cursor()
        
        # Create a test user
        user_id = str(uuid.uuid4())
        cursor.execute('''
        INSERT INTO users (id, username, email, password_hash, created_at, risk_profile)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            'testuser',
            'test@example.com',
            'pbkdf2:sha256:150000$DUMMYHASH',  # Never use this in production!
            datetime.now().isoformat(),
            'moderate'
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Created test user with ID: {user_id}")
        return user_id
    
    except Exception as e:
        logger.error(f"Error creating test user: {str(e)}")
        return None

async def create_test_portfolio(db_service, user_id):
    """Create test portfolio data for the user"""
    try:
        # Get sample crypto data
        market_service = MarketDataService()
        prices = await market_service.get_prices(limit=10)
        
        if not prices:
            logger.error("No price data available to create test portfolio")
            return False
        
        # Create some transactions
        transactions = []
        for i, price in enumerate(prices[:5]):  # Use top 5 cryptos
            symbol = price.get("symbol", "BTC")
            current_price = price.get("priceUsd", 50000)
            
            # Create a buy transaction from 30 days ago
            buy_days_ago = random.randint(30, 60)
            buy_date = (datetime.now() - timedelta(days=buy_days_ago)).isoformat()
            
            # Randomize the buy price (slightly lower or higher than current)
            buy_price = current_price * random.uniform(0.7, 1.3)
            
            # Random quantity based on price
            if buy_price > 10000:  # BTC or high-value crypto
                quantity = random.uniform(0.1, 2)
            elif buy_price > 1000:  # Mid-value crypto
                quantity = random.uniform(1, 10)
            else:  # Low-value crypto
                quantity = random.uniform(10, 100)
            
            buy_transaction = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "symbol": symbol,
                "name": price.get("name", symbol),
                "type": "buy",
                "quantity": quantity,
                "price": buy_price,
                "fee": buy_price * quantity * 0.001,  # 0.1% fee
                "timestamp": buy_date,
                "exchange": random.choice(["Binance", "Coinbase", "Kraken", "FTX"]),
                "notes": f"Initial purchase of {symbol}"
            }
            transactions.append(buy_transaction)
            
            # Randomly add another transaction for some assets
            if random.random() > 0.5:
                # Either buy more or sell some
                transaction_type = random.choice(["buy", "sell"])
                
                # Create transaction from 15 days ago
                tx_days_ago = random.randint(1, 29)
                tx_date = (datetime.now() - timedelta(days=tx_days_ago)).isoformat()
                
                # Randomize price
                tx_price = current_price * random.uniform(0.8, 1.2)
                
                # Quantity
                if transaction_type == "buy":
                    tx_quantity = quantity * random.uniform(0.3, 0.7)
                else:  # sell
                    tx_quantity = quantity * random.uniform(0.1, 0.5)
                
                transaction = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "symbol": symbol,
                    "name": price.get("name", symbol),
                    "type": transaction_type,
                    "quantity": tx_quantity,
                    "price": tx_price,
                    "fee": tx_price * tx_quantity * 0.001,  # 0.1% fee
                    "timestamp": tx_date,
                    "exchange": random.choice(["Binance", "Coinbase", "Kraken", "FTX"]),
                    "notes": f"{'Additional purchase' if transaction_type == 'buy' else 'Partial sale'} of {symbol}"
                }
                transactions.append(transaction)
        
        # Add the transactions to the database
        for transaction in transactions:
            success = await db_service.add_transaction(transaction)
            if not success:
                logger.error(f"Failed to add transaction for {transaction['symbol']}")
        
        # Create a watchlist
        watchlist_symbols = [p.get("symbol") for p in prices[5:10]]  # Use next 5 cryptos
        success = await db_service.update_watchlist(user_id, watchlist_symbols)
        if not success:
            logger.error("Failed to create watchlist")
        
        logger.info(f"Created test portfolio with {len(transactions)} transactions and {len(watchlist_symbols)} watchlist items")
        return True
    
    except Exception as e:
        logger.error(f"Error creating test portfolio: {str(e)}")
        return False

async def fetch_and_store_market_data(db_service):
    """Fetch and store market data"""
    try:
        market_service = MarketDataService()
        
        # Fetch market overview
        overview = await market_service.get_market_overview()
        if overview:
            success = await db_service.save_market_overview(overview)
            if not success:
                logger.error("Failed to save market overview")
        
        # Fetch top 100 cryptocurrencies
        prices = await market_service.get_prices(limit=100)
        if prices:
            success = await db_service.save_crypto_prices(prices)
            if not success:
                logger.error("Failed to save crypto prices")
        
        # Fetch price history for top 10 cryptocurrencies
        for price in prices[:10]:
            symbol = price.get("symbol")
            history = await market_service.get_price_history(symbol, days="30")
            if history:
                success = await db_service.save_price_history(symbol, history)
                if not success:
                    logger.error(f"Failed to save price history for {symbol}")
        
        logger.info(f"Saved market overview, {len(prices)} cryptocurrency prices, and price history for top 10 coins")
        return True
    
    except Exception as e:
        logger.error(f"Error fetching and storing market data: {str(e)}")
        return False

async def main():
    """Main function to initialize databases and create test data"""
    try:
        parser = argparse.ArgumentParser(description='Initialize databases and create test data')
        parser.add_argument('--with-test-data', action='store_true', help='Create test user and portfolio data')
        parser.add_argument('--market-data-only', action='store_true', help='Only fetch and store market data')
        args = parser.parse_args()
        
        # Initialize database service
        db_service = DatabaseService()
        logger.info("Databases initialized")
        
        # Fetch and store market data
        success = await fetch_and_store_market_data(db_service)
        if not success:
            logger.warning("Market data fetching completed with errors")
        
        # Create test data if requested
        if args.with_test_data and not args.market_data_only:
            # Create test user
            user_id = await create_test_user(db_service)
            if user_id:
                # Create test portfolio
                success = await create_test_portfolio(db_service, user_id)
                if not success:
                    logger.warning("Test portfolio creation completed with errors")
            else:
                logger.error("Could not create test user, skipping portfolio creation")
        
        logger.info("Database initialization completed")
    
    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")

if __name__ == "__main__":
    # Add import here to avoid circular imports
    import sqlite3
    asyncio.run(main()) 