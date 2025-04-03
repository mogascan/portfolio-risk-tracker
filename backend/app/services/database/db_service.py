import sqlite3
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import json
import os
import shutil
import threading

from app.core.settings import USE_DATABASE

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self.db_path = "app/data/crypto.db"
        self.lock = threading.Lock()
        self._initialized = False
        logger.info("DatabaseService instance created (lazy initialization)")

    def get_connection(self):
        """Get a database connection with proper settings."""
        if not USE_DATABASE:
            logger.warning("Database operations are disabled (USE_DATABASE=False)")
            raise RuntimeError("Database operations are disabled via configuration")
            
        # Ensure database is initialized before getting a connection
        if not self._initialized:
            self.initialize_db()
            
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.row_factory = sqlite3.Row
        return conn

    def initialize_db(self):
        """Initialize the database with required tables."""
        if not USE_DATABASE:
            logger.info("Skipping database initialization (USE_DATABASE=False)")
            return
            
        if self._initialized:
            logger.debug("Database already initialized, skipping")
            return
            
        logger.info(f"Initializing database at {self.db_path}")
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with self.lock:
            try:
                with sqlite3.connect(self.db_path, timeout=30.0) as conn:
                    cursor = conn.cursor()
                    
                    # Drop existing tables if they exist
                    cursor.execute("DROP TABLE IF EXISTS historical_prices")
                    cursor.execute("DROP TABLE IF EXISTS loading_status")
                    
                    # Create historical prices table
                    cursor.execute("""
                        CREATE TABLE historical_prices (
                            coin_id TEXT,
                            date TEXT,
                            price REAL,
                            last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            PRIMARY KEY (coin_id, date)
                        )
                    """)
                    
                    # Create loading status table
                    cursor.execute("""
                        CREATE TABLE loading_status (
                            id INTEGER PRIMARY KEY,
                            status TEXT,
                            total_coins INTEGER,
                            processed_coins INTEGER,
                            failed_coins TEXT,
                            start_time TIMESTAMP,
                            last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """)
                    
                    # Create initial loading status record
                    cursor.execute("""
                        INSERT INTO loading_status (
                            status, total_coins, processed_coins, failed_coins, start_time, last_update
                        ) VALUES (
                            'not_started', 0, 0, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                        )
                    """)
                    
                    conn.commit()
                    self._initialized = True
                    logger.info("Database initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing database: {str(e)}")
                raise

    def view_database_contents(self) -> Dict[str, Any]:
        """
        View the contents of all tables in the database
        
        Returns:
            Dictionary containing table contents
        """
        if not USE_DATABASE:
            logger.warning("Database operations are disabled (USE_DATABASE=False)")
            return {"error": "Database operations are disabled"}
            
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get list of all tables
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = cursor.fetchall()
                
                contents = {}
                for table in tables:
                    table_name = table[0]
                    cursor.execute(f"SELECT * FROM {table_name}")
                    columns = [description[0] for description in cursor.description]
                    rows = cursor.fetchall()
                    
                    contents[table_name] = {
                        "columns": columns,
                        "rows": rows
                    }
                
                return contents
        except Exception as e:
            logger.error(f"Error viewing database contents: {str(e)}")
            return {"error": str(e)}

    def cleanup_old_data(self, days: int = 365) -> Dict[str, int]:
        """
        Clean up historical data older than specified days
        
        Args:
            days: Number of days to keep data for
            
        Returns:
            Dictionary with number of records deleted per table
        """
        if not USE_DATABASE:
            logger.warning("Database operations are disabled (USE_DATABASE=False)")
            return {"error": "Database operations are disabled"}
            
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
                
                # Delete old historical prices
                cursor.execute('''
                    DELETE FROM historical_prices 
                    WHERE date < ?
                ''', (cutoff_date,))
                historical_deleted = cursor.rowcount
                
                # Delete old golden cross data
                cursor.execute('''
                    DELETE FROM golden_cross_data 
                    WHERE datetime(last_updated) < datetime('now', ?)
                ''', (f'-{days} days',))
                golden_cross_deleted = cursor.rowcount
                
                # Clean up coin metadata for coins with no data
                cursor.execute('''
                    DELETE FROM coin_metadata 
                    WHERE coin_id NOT IN (
                        SELECT DISTINCT coin_id FROM historical_prices
                    )
                ''')
                metadata_deleted = cursor.rowcount
                
                conn.commit()
                
                return {
                    "historical_prices_deleted": historical_deleted,
                    "golden_cross_data_deleted": golden_cross_deleted,
                    "metadata_deleted": metadata_deleted
                }
        except Exception as e:
            logger.error(f"Error cleaning up old data: {str(e)}")
            return {"error": str(e)}

    def archive_database(self, archive_path: str) -> bool:
        """
        Create an archive of the database
        
        Args:
            archive_path: Path where to save the archive
            
        Returns:
            True if successful, False otherwise
        """
        if not USE_DATABASE:
            logger.warning("Database operations are disabled (USE_DATABASE=False)")
            return False
            
        try:
            if not self._initialized:
                logger.warning("Cannot archive uninitiated database")
                return False
                
            # Create archive directory if it doesn't exist
            os.makedirs(os.path.dirname(archive_path), exist_ok=True)
            
            # Create a copy of the database
            shutil.copy2(self.db_path, archive_path)
            
            logger.info(f"Database archived to {archive_path}")
            return True
        except Exception as e:
            logger.error(f"Error archiving database: {str(e)}")
            return False

    def restore_from_archive(self, archive_path: str) -> bool:
        """
        Restore database from an archive
        
        Args:
            archive_path: Path to the archive file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Check if archive exists
            if not os.path.exists(archive_path):
                logger.error(f"Archive file not found: {archive_path}")
                return False
            
            # Create backup of current database
            backup_path = f"{self.db_path}.backup"
            if os.path.exists(self.db_path):
                shutil.copy2(self.db_path, backup_path)
            
            # Restore from archive
            shutil.copy2(archive_path, self.db_path)
            
            logger.info(f"Database restored from {archive_path}")
            return True
        except Exception as e:
            logger.error(f"Error restoring database: {str(e)}")
            # Restore from backup if available
            if os.path.exists(backup_path):
                shutil.copy2(backup_path, self.db_path)
                logger.info("Restored from backup after failed archive restore")
            return False

    def get_database_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the database
        
        Returns:
            Dictionary containing database statistics
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                stats = {}
                
                # Get table sizes
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = cursor.fetchall()
                
                for table in tables:
                    table_name = table[0]
                    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                    count = cursor.fetchone()[0]
                    
                    # Get disk usage
                    cursor.execute(f"SELECT page_count * page_size as size FROM dbstat WHERE name = ?", (table_name,))
                    size = cursor.fetchone()[0]
                    
                    stats[table_name] = {
                        "row_count": count,
                        "size_bytes": size
                    }
                
                # Get total database size
                cursor.execute("SELECT page_count * page_size as size FROM dbstat WHERE name = 'main'")
                stats["total_size_bytes"] = cursor.fetchone()[0]
                
                return stats
        except Exception as e:
            logger.error(f"Error getting database stats: {str(e)}")
            return {}

    def get_historical_prices(self, coin_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Tuple[str, float]]:
        """Get historical prices for a coin within a date range."""
        with self.lock:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                query = "SELECT date, price FROM historical_prices WHERE coin_id = ?"
                params = [coin_id]
                
                if start_date:
                    query += " AND date >= ?"
                    params.append(start_date)
                
                if end_date:
                    query += " AND date <= ?"
                    params.append(end_date)
                
                query += " ORDER BY date ASC"
                
                cursor.execute(query, params)
                return [(row[0], row[1]) for row in cursor.fetchall()]

    def save_historical_prices(self, coin_id: str, prices: List[Tuple[str, float]]):
        """Save historical prices for a coin."""
        with self.lock:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Use a transaction for better performance
                cursor.execute("BEGIN TRANSACTION")
                try:
                    # Get current timestamp
                    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
                    
                    # Update or insert prices
                    for date, price in prices:
                        cursor.execute("""
                            INSERT OR REPLACE INTO historical_prices (coin_id, date, price, last_update)
                            VALUES (?, ?, ?, ?)
                        """, (coin_id, date, price, current_time))
                    
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Error saving historical prices for {coin_id}: {str(e)}")
                    raise

    def get_current_price(self, coin_id: str) -> Optional[float]:
        """
        Get current price for a coin
        
        Args:
            coin_id: CoinGecko ID of the coin
            
        Returns:
            Current price or None if not available
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT price 
                    FROM historical_prices 
                    WHERE coin_id = ? 
                    ORDER BY date DESC 
                    LIMIT 1
                ''', (coin_id,))
                result = cursor.fetchone()
                return result[0] if result else None
        except Exception as e:
            logger.error(f"Error getting current price for {coin_id}: {str(e)}")
            return None

    def save_current_price(self, coin_id: str, price: float):
        """
        Save current price for a coin
        
        Args:
            coin_id: CoinGecko ID of the coin
            price: Current price
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                today = datetime.now().strftime('%Y-%m-%d')
                
                # Update or insert current price
                cursor.execute('''
                    INSERT INTO historical_prices (coin_id, date, price)
                    VALUES (?, ?, ?)
                    ON CONFLICT(coin_id, date) DO UPDATE SET price = excluded.price
                ''', (coin_id, today, price))
                
                # Update last price update timestamp
                self.update_last_price_update(coin_id)
                
                conn.commit()
        except Exception as e:
            logger.error(f"Error saving current price for {coin_id}: {str(e)}")

    def get_last_update(self, coin_id: str) -> Optional[datetime]:
        """
        Get last update timestamp for a coin
        
        Args:
            coin_id: CoinGecko ID of the coin
            
        Returns:
            Last update timestamp or None if not available
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT MAX(created_at) 
                    FROM historical_prices 
                    WHERE coin_id = ?
                ''', (coin_id,))
                result = cursor.fetchone()
                return datetime.fromisoformat(result[0]) if result and result[0] else None
        except Exception as e:
            logger.error(f"Error getting last update for {coin_id}: {str(e)}")
            return None

    def update_last_update(self, coin_id: str):
        """
        Update last update timestamp for a coin
        
        Args:
            coin_id: CoinGecko ID of the coin
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE coin_metadata 
                    SET last_updated = CURRENT_TIMESTAMP 
                    WHERE coin_id = ?
                ''', (coin_id,))
                conn.commit()
        except Exception as e:
            logger.error(f"Error updating last update for {coin_id}: {str(e)}")

    def get_last_price_update(self, coin_id: str) -> Optional[datetime]:
        """
        Get last price update timestamp for a coin
        
        Args:
            coin_id: CoinGecko ID of the coin
            
        Returns:
            Last price update timestamp or None if not available
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT MAX(created_at) 
                    FROM historical_prices 
                    WHERE coin_id = ? 
                    AND date = CURRENT_DATE
                ''', (coin_id,))
                result = cursor.fetchone()
                return datetime.fromisoformat(result[0]) if result and result[0] else None
        except Exception as e:
            logger.error(f"Error getting last price update for {coin_id}: {str(e)}")
            return None

    def update_last_price_update(self, coin_id: str):
        """
        Update last price update timestamp for a coin
        
        Args:
            coin_id: CoinGecko ID of the coin
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE coin_metadata 
                    SET last_price_update = CURRENT_TIMESTAMP 
                    WHERE coin_id = ?
                ''', (coin_id,))
                conn.commit()
        except Exception as e:
            logger.error(f"Error updating last price update for {coin_id}: {str(e)}")

    def get_golden_cross_data(self, coin_id: str) -> Optional[Dict]:
        """
        Get golden cross data for a coin
        
        Args:
            coin_id: CoinGecko ID of the coin
            
        Returns:
            Dictionary containing golden cross data or None if not available
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT short_ma, long_ma, proximity, last_updated 
                    FROM golden_cross_data 
                    WHERE coin_id = ?
                ''', (coin_id,))
                result = cursor.fetchone()
                if result:
                    return {
                        "short_ma": result[0],
                        "long_ma": result[1],
                        "proximity": result[2],
                        "last_updated": result[3]
                    }
                return None
        except Exception as e:
            logger.error(f"Error getting golden cross data for {coin_id}: {str(e)}")
            return None

    def save_golden_cross_data(self, coin_id: str, data: Dict):
        """
        Save golden cross data for a coin
        
        Args:
            coin_id: CoinGecko ID of the coin
            data: Dictionary containing golden cross data
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO golden_cross_data (coin_id, short_ma, long_ma, proximity)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(coin_id) DO UPDATE SET 
                        short_ma = excluded.short_ma,
                        long_ma = excluded.long_ma,
                        proximity = excluded.proximity,
                        last_updated = CURRENT_TIMESTAMP
                ''', (
                    coin_id,
                    data["short_ma"],
                    data["long_ma"],
                    data["proximity"]
                ))
                conn.commit()
        except Exception as e:
            logger.error(f"Error saving golden cross data for {coin_id}: {str(e)}")

    def update_loading_status(self, status: str, total_coins: int, processed_coins: int, failed_coins: List[str] = None):
        """Update the loading status."""
        with self.lock:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Convert failed_coins list to string
                failed_coins_str = ",".join(failed_coins) if failed_coins else ""
                
                # Get current time
                current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
                
                # Check if a status record exists
                cursor.execute("SELECT id FROM loading_status LIMIT 1")
                row = cursor.fetchone()
                
                if row:
                    # Update existing record
                    cursor.execute("""
                        UPDATE loading_status
                        SET status = ?, total_coins = ?, processed_coins = ?, failed_coins = ?, last_update = ?
                        WHERE id = ?
                    """, (status, total_coins, processed_coins, failed_coins_str, current_time, row[0]))
                else:
                    # Insert new record
                    cursor.execute("""
                        INSERT INTO loading_status (status, total_coins, processed_coins, failed_coins, start_time, last_update)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (status, total_coins, processed_coins, failed_coins_str, current_time, current_time))
                
                conn.commit()

    def get_loading_status(self) -> Dict:
        """Get the current loading status."""
        with self.lock:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM loading_status ORDER BY id DESC LIMIT 1")
                row = cursor.fetchone()
                
                if not row:
                    return {
                        "status": "not_started",
                        "total_coins": 0,
                        "processed_coins": 0,
                        "failed_coins": [],
                        "start_time": None,
                        "last_update": None,
                        "progress_percentage": 0.0
                    }
                
                # Convert row to dict
                status = {
                    "status": row[1],  # status
                    "total_coins": row[2],  # total_coins
                    "processed_coins": row[3],  # processed_coins
                    "failed_coins": row[4].split(",") if row[4] else [],  # failed_coins
                    "start_time": row[5],  # start_time
                    "last_update": row[6]  # last_update
                }
                
                # Calculate progress percentage
                if status["total_coins"] > 0:
                    status["progress_percentage"] = (status["processed_coins"] / status["total_coins"]) * 100
                else:
                    status["progress_percentage"] = 0.0
                
                return status 