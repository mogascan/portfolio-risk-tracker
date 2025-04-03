"""
Database service for interacting with SQLite databases
"""
import os
import logging
import sqlite3
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime, timedelta
import warnings

from app.core.logging import get_logger
from app.core.settings import USE_DATABASE

# Initialize logger
logger = get_logger(__name__)

# Issue a deprecation warning
warnings.warn(
    "The DatabaseService class is deprecated and has been moved to app.legacy.db.services_database. "
    "This module will be removed in a future version.",
    DeprecationWarning,
    stacklevel=2
)

class DatabaseService:
    """
    Service for SQLite database operations
    
    DEPRECATED: This class has been moved to app.legacy.db.services_database
    and will be removed in a future version.
    """
    
    def __init__(self):
        """Initialize DatabaseService"""
        # Log deprecation warning
        logger.warning("DatabaseService is deprecated and has been moved to app.legacy.db")
        
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
        
        # Database paths
        self.portfolio_db = os.path.join(self.data_dir, "portfolio.db")
        self.market_db = os.path.join(self.data_dir, "market_data.db")
        
        # Flags to track initialization state
        self._portfolio_db_initialized = False
        self._market_db_initialized = False
        
        # Create data directory if it doesn't exist
        os.makedirs(self.data_dir, exist_ok=True)
        
        # If databases are disabled, log a message
        if not USE_DATABASE:
            logger.info("Database operations are disabled via settings (USE_DATABASE=False)")
    
    def _init_portfolio_db(self):
        """Initialize portfolio database schema"""
        if not USE_DATABASE:
            logger.debug("Skipping portfolio database initialization (USE_DATABASE=False)")
            return
            
        if self._portfolio_db_initialized:
            return
            
        try:
            conn = sqlite3.connect(self.portfolio_db)
            cursor = conn.cursor()
            
            # Create user table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                email TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_login TEXT,
                risk_profile TEXT DEFAULT 'moderate'
            )
            ''')
            
            # Create assets table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS assets (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT NOT NULL,
                quantity REAL NOT NULL,
                avg_buy_price REAL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            ''')
            
            # Create transactions table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                symbol TEXT NOT NULL,
                type TEXT NOT NULL,
                quantity REAL NOT NULL,
                price REAL NOT NULL,
                fee REAL DEFAULT 0,
                timestamp TEXT NOT NULL,
                exchange TEXT,
                notes TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            ''')
            
            # Create watchlist table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS watchlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                symbol TEXT NOT NULL,
                added_at TEXT NOT NULL,
                notes TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(user_id, symbol)
            )
            ''')
            
            # Create alerts table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                symbol TEXT NOT NULL,
                type TEXT NOT NULL,
                threshold REAL NOT NULL,
                active BOOLEAN NOT NULL DEFAULT 1,
                triggered BOOLEAN NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                triggered_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Portfolio database initialized")
            self._portfolio_db_initialized = True
            
        except Exception as e:
            logger.error(f"Error initializing portfolio database: {str(e)}")
    
    def _init_market_db(self):
        """Initialize market data database schema"""
        if not USE_DATABASE:
            logger.debug("Skipping market database initialization (USE_DATABASE=False)")
            return
            
        if self._market_db_initialized:
            return
            
        try:
            conn = sqlite3.connect(self.market_db)
            cursor = conn.cursor()
            
            # Create crypto prices table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS crypto_prices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                name TEXT NOT NULL,
                price_usd REAL NOT NULL,
                market_cap_usd REAL,
                volume_24h_usd REAL,
                change_24h REAL,
                timestamp TEXT NOT NULL,
                UNIQUE(symbol, timestamp)
            )
            ''')
            
            # Create price history table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                price_usd REAL NOT NULL,
                timestamp TEXT NOT NULL,
                UNIQUE(symbol, timestamp)
            )
            ''')
            
            # Create market overview table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS market_overview (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                total_market_cap_usd REAL NOT NULL,
                total_volume_24h_usd REAL NOT NULL,
                btc_dominance REAL NOT NULL,
                eth_dominance REAL NOT NULL,
                market_cap_change_24h REAL,
                timestamp TEXT NOT NULL,
                UNIQUE(timestamp)
            )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Market database initialized")
            self._market_db_initialized = True
            
        except Exception as e:
            logger.error(f"Error initializing market database: {str(e)}")
    
    # Portfolio database operations
    
    async def get_user_assets(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all assets for a user"""
        if not USE_DATABASE:
            logger.debug("Database operations are disabled (USE_DATABASE=False)")
            return []
            
        # Initialize portfolio DB if not already initialized
        self._init_portfolio_db()
        
        try:
            conn = sqlite3.connect(self.portfolio_db)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
            SELECT * FROM assets WHERE user_id = ? ORDER BY symbol
            ''', (user_id,))
            
            results = cursor.fetchall()
            conn.close()
            
            # Convert to list of dictionaries
            assets = []
            for row in results:
                asset = dict(row)
                assets.append(asset)
            
            return assets
            
        except Exception as e:
            logger.error(f"Error getting user assets: {str(e)}")
            return []
    
    async def get_user_transactions(self, user_id: str, symbol: Optional[str] = None, 
                                   limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get transactions for a user, optionally filtered by symbol"""
        if not USE_DATABASE:
            logger.debug("Database operations are disabled (USE_DATABASE=False)")
            return []
            
        # Initialize portfolio DB if not already initialized
        self._init_portfolio_db()
        
        try:
            conn = sqlite3.connect(self.portfolio_db)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            if symbol:
                cursor.execute('''
                SELECT * FROM transactions 
                WHERE user_id = ? AND symbol = ?
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
                ''', (user_id, symbol, limit, offset))
            else:
                cursor.execute('''
                SELECT * FROM transactions 
                WHERE user_id = ?
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
                ''', (user_id, limit, offset))
            
            results = cursor.fetchall()
            conn.close()
            
            # Convert to list of dictionaries
            transactions = []
            for row in results:
                transaction = dict(row)
                transactions.append(transaction)
            
            return transactions
            
        except Exception as e:
            logger.error(f"Error getting user transactions: {str(e)}")
            return []
    
    async def add_transaction(self, transaction: Dict[str, Any]) -> bool:
        """Add a new transaction and update asset holdings"""
        if not USE_DATABASE:
            logger.debug("Database operations are disabled (USE_DATABASE=False)")
            return False
            
        # Initialize portfolio DB if not already initialized
        self._init_portfolio_db()
        
        try:
            conn = sqlite3.connect(self.portfolio_db)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Start a transaction
            cursor.execute("BEGIN TRANSACTION")
            
            # Insert the transaction
            cursor.execute('''
            INSERT INTO transactions (
                id, user_id, symbol, type, quantity, price, fee, timestamp, exchange, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                transaction.get("id"),
                transaction.get("user_id"),
                transaction.get("symbol"),
                transaction.get("type"),
                transaction.get("quantity"),
                transaction.get("price"),
                transaction.get("fee", 0),
                transaction.get("timestamp"),
                transaction.get("exchange"),
                transaction.get("notes")
            ))
            
            # Update asset holdings
            user_id = transaction.get("user_id")
            symbol = transaction.get("symbol")
            name = transaction.get("name", symbol)  # Use symbol as name if not provided
            quantity = transaction.get("quantity", 0)
            price = transaction.get("price", 0)
            
            # Check if asset exists
            cursor.execute('''
            SELECT * FROM assets WHERE user_id = ? AND symbol = ?
            ''', (user_id, symbol))
            
            asset = cursor.fetchone()
            
            if transaction.get("type").lower() == "buy":
                if asset:
                    # Update existing asset
                    current_quantity = asset["quantity"]
                    current_avg_price = asset["avg_buy_price"] or 0
                    
                    # Calculate new average buy price
                    new_quantity = current_quantity + quantity
                    new_avg_price = ((current_quantity * current_avg_price) + (quantity * price)) / new_quantity if new_quantity > 0 else 0
                    
                    cursor.execute('''
                    UPDATE assets 
                    SET quantity = ?, avg_buy_price = ?, updated_at = ?
                    WHERE user_id = ? AND symbol = ?
                    ''', (new_quantity, new_avg_price, datetime.now().isoformat(), user_id, symbol))
                else:
                    # Create new asset
                    cursor.execute('''
                    INSERT INTO assets (
                        id, user_id, symbol, name, quantity, avg_buy_price, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        transaction.get("id"),
                        user_id,
                        symbol,
                        name,
                        quantity,
                        price,
                        datetime.now().isoformat(),
                        datetime.now().isoformat()
                    ))
            elif transaction.get("type").lower() == "sell" and asset:
                # Update existing asset for sell
                current_quantity = asset["quantity"]
                
                # Calculate new quantity
                new_quantity = max(0, current_quantity - quantity)
                
                if new_quantity > 0:
                    # Update asset with new quantity
                    cursor.execute('''
                    UPDATE assets 
                    SET quantity = ?, updated_at = ?
                    WHERE user_id = ? AND symbol = ?
                    ''', (new_quantity, datetime.now().isoformat(), user_id, symbol))
                else:
                    # Remove asset if quantity is 0
                    cursor.execute('''
                    DELETE FROM assets
                    WHERE user_id = ? AND symbol = ?
                    ''', (user_id, symbol))
            
            # Commit the transaction
            conn.commit()
            conn.close()
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding transaction: {str(e)}")
            # Rollback in case of error
            if 'conn' in locals():
                conn.rollback()
                conn.close()
            return False
    
    async def get_user_watchlist(self, user_id: str) -> List[Dict[str, Any]]:
        """Get watchlist for a user"""
        if not USE_DATABASE:
            logger.debug("Database operations are disabled (USE_DATABASE=False)")
            return []
            
        # Initialize portfolio DB if not already initialized
        self._init_portfolio_db()
        
        try:
            conn = sqlite3.connect(self.portfolio_db)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
            SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC
            ''', (user_id,))
            
            results = cursor.fetchall()
            conn.close()
            
            # Convert to list of dictionaries
            watchlist = []
            for row in results:
                item = dict(row)
                watchlist.append(item)
            
            return watchlist
            
        except Exception as e:
            logger.error(f"Error getting user watchlist: {str(e)}")
            return []
    
    async def update_watchlist(self, user_id: str, symbols: List[str]) -> bool:
        """Update watchlist for a user"""
        if not USE_DATABASE:
            logger.debug("Database operations are disabled (USE_DATABASE=False)")
            return False
            
        # Initialize portfolio DB if not already initialized
        self._init_portfolio_db()
        
        try:
            conn = sqlite3.connect(self.portfolio_db)
            cursor = conn.cursor()
            
            # Start a transaction
            cursor.execute("BEGIN TRANSACTION")
            
            # Clear existing watchlist
            cursor.execute('''
            DELETE FROM watchlist WHERE user_id = ?
            ''', (user_id,))
            
            # Add new symbols
            for symbol in symbols:
                cursor.execute('''
                INSERT INTO watchlist (user_id, symbol, added_at)
                VALUES (?, ?, ?)
                ''', (user_id, symbol, datetime.now().isoformat()))
            
            # Commit the transaction
            conn.commit()
            conn.close()
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating watchlist: {str(e)}")
            # Rollback in case of error
            if 'conn' in locals():
                conn.rollback()
                conn.close()
            return False
    
    # Market database operations
    
    async def save_crypto_prices(self, prices: List[Dict[str, Any]]) -> bool:
        """Save cryptocurrency prices to database"""
        if not USE_DATABASE:
            logger.debug("Database operations are disabled (USE_DATABASE=False)")
            return False
            
        # Initialize market DB if not already initialized
        self._init_market_db()
        
        try:
            conn = sqlite3.connect(self.market_db)
            cursor = conn.cursor()
            
            # Start a transaction
            cursor.execute("BEGIN TRANSACTION")
            
            timestamp = datetime.now().isoformat()
            
            for price in prices:
                cursor.execute('''
                INSERT OR REPLACE INTO crypto_prices (
                    symbol, name, price_usd, market_cap_usd, volume_24h_usd, change_24h, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    price.get("symbol"),
                    price.get("name"),
                    price.get("priceUsd", 0),
                    price.get("marketCapUsd", 0),
                    price.get("volume24hUsd", 0),
                    price.get("change24h", 0),
                    timestamp
                ))
            
            # Commit the transaction
            conn.commit()
            conn.close()
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving crypto prices: {str(e)}")
            # Rollback in case of error
            if 'conn' in locals():
                conn.rollback()
                conn.close()
            return False
    
    async def save_market_overview(self, overview: Dict[str, Any]) -> bool:
        """Save market overview data to database"""
        if not USE_DATABASE:
            logger.debug("Database operations are disabled (USE_DATABASE=False)")
            return False
            
        # Initialize market DB if not already initialized
        self._init_market_db()
        
        try:
            conn = sqlite3.connect(self.market_db)
            cursor = conn.cursor()
            
            cursor.execute('''
            INSERT OR REPLACE INTO market_overview (
                total_market_cap_usd, total_volume_24h_usd, btc_dominance, eth_dominance,
                market_cap_change_24h, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                overview.get("totalMarketCapUsd", 0),
                overview.get("totalVolume24hUsd", 0),
                overview.get("btcDominance", 0),
                overview.get("ethDominance", 0),
                overview.get("marketCapChange24h", 0),
                overview.get("lastUpdated", datetime.now().isoformat())
            ))
            
            conn.commit()
            conn.close()
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving market overview: {str(e)}")
            if 'conn' in locals():
                conn.close()
            return False
    
    async def save_price_history(self, symbol: str, history: List[Dict[str, Any]]) -> bool:
        """Save price history data to database"""
        if not USE_DATABASE:
            logger.debug("Database operations are disabled (USE_DATABASE=False)")
            return False
            
        # Initialize market DB if not already initialized
        self._init_market_db()
        
        try:
            conn = sqlite3.connect(self.market_db)
            cursor = conn.cursor()
            
            # Start a transaction
            cursor.execute("BEGIN TRANSACTION")
            
            for point in history:
                cursor.execute('''
                INSERT OR REPLACE INTO price_history (
                    symbol, price_usd, timestamp
                ) VALUES (?, ?, ?)
                ''', (
                    symbol,
                    point.get("price", 0),
                    point.get("timestamp", datetime.now().isoformat())
                ))
            
            # Commit the transaction
            conn.commit()
            conn.close()
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving price history: {str(e)}")
            # Rollback in case of error
            if 'conn' in locals():
                conn.rollback()
                conn.close()
            return False
    
    async def get_latest_crypto_prices(self, symbols: Optional[List[str]] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get latest cryptocurrency prices, optionally filtered by symbols"""
        if not USE_DATABASE:
            logger.debug("Database operations are disabled (USE_DATABASE=False)")
            return []
            
        # Initialize market DB if not already initialized
        self._init_market_db()
        
        try:
            conn = sqlite3.connect(self.market_db)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get the latest timestamp
            cursor.execute('''
            SELECT MAX(timestamp) as latest_time FROM crypto_prices
            ''')
            
            result = cursor.fetchone()
            latest_time = result["latest_time"] if result else None
            
            if not latest_time:
                conn.close()
                return []
            
            if symbols:
                placeholders = ','.join(['?'] * len(symbols))
                query = f'''
                SELECT * FROM crypto_prices 
                WHERE timestamp = ? AND symbol IN ({placeholders})
                ORDER BY market_cap_usd DESC
                LIMIT ?
                '''
                params = [latest_time] + symbols + [limit]
                cursor.execute(query, params)
            else:
                cursor.execute('''
                SELECT * FROM crypto_prices 
                WHERE timestamp = ?
                ORDER BY market_cap_usd DESC
                LIMIT ?
                ''', (latest_time, limit))
            
            results = cursor.fetchall()
            conn.close()
            
            # Convert to list of dictionaries
            prices = []
            for row in results:
                price = dict(row)
                prices.append(price)
            
            return prices
            
        except Exception as e:
            logger.error(f"Error getting latest crypto prices: {str(e)}")
            if 'conn' in locals():
                conn.close()
            return []
    
    async def get_price_history(self, symbol: str, days: int = 7) -> List[Dict[str, Any]]:
        """Get price history for a cryptocurrency"""
        if not USE_DATABASE:
            logger.debug("Database operations are disabled (USE_DATABASE=False)")
            return []
            
        # Initialize market DB if not already initialized
        self._init_market_db()
        
        try:
            conn = sqlite3.connect(self.market_db)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Calculate timestamp for the requested number of days ago
            from_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            cursor.execute('''
            SELECT * FROM price_history 
            WHERE symbol = ? AND timestamp >= ?
            ORDER BY timestamp ASC
            ''', (symbol, from_date))
            
            results = cursor.fetchall()
            conn.close()
            
            # Convert to list of dictionaries
            history = []
            for row in results:
                point = dict(row)
                history.append(point)
            
            return history
            
        except Exception as e:
            logger.error(f"Error getting price history: {str(e)}")
            if 'conn' in locals():
                conn.close()
            return []
    
    async def get_latest_market_overview(self) -> Optional[Dict[str, Any]]:
        """Get the latest market overview data"""
        if not USE_DATABASE:
            logger.debug("Database operations are disabled (USE_DATABASE=False)")
            return None
            
        # Initialize market DB if not already initialized
        self._init_market_db()
        
        try:
            conn = sqlite3.connect(self.market_db)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
            SELECT * FROM market_overview 
            ORDER BY timestamp DESC
            LIMIT 1
            ''')
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return dict(result)
            else:
                return None
            
        except Exception as e:
            logger.error(f"Error getting latest market overview: {str(e)}")
            if 'conn' in locals():
                conn.close()
            return None 