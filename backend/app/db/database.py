"""
Database configuration and initialization for the application

DEPRECATED: This module has been moved to app.legacy.db.db_database
and will be removed in a future version.
"""
import os
import logging
import asyncio
import warnings
from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool

# Configure logging
logger = logging.getLogger(__name__)

# Issue a deprecation warning
warnings.warn(
    "This database module is deprecated and has been moved to app.legacy.db.db_database. "
    "This module will be removed in a future version.",
    DeprecationWarning,
    stacklevel=2
)

# Base class for all models
Base = declarative_base()

# Get the database paths from environment variables or use defaults
MAIN_DB_URL = os.getenv("MAIN_DB_URL", "sqlite:///./data/crypto_portfolio.db")
NEWS_DB_URL = os.getenv("NEWS_DB_URL", "sqlite:///./data/news_market.db")

# Create synchronous engines for both databases
main_engine = create_engine(
    MAIN_DB_URL, 
    echo=False,  
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800
)

news_engine = create_engine(
    NEWS_DB_URL,
    echo=False,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800
)

# Create session factories
MainSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=main_engine)
NewsSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=news_engine)

# Register event listeners
@event.listens_for(main_engine, "connect")
def on_main_connect(dbapi_con, connection_record):
    logger.debug("New connection to main database established")
    # Enable foreign keys for SQLite
    if 'sqlite' in MAIN_DB_URL:
        dbapi_con.execute('PRAGMA foreign_keys=ON')

@event.listens_for(news_engine, "connect")
def on_news_connect(dbapi_con, connection_record):
    logger.debug("New connection to news database established")
    # Enable foreign keys for SQLite
    if 'sqlite' in NEWS_DB_URL:
        dbapi_con.execute('PRAGMA foreign_keys=ON')

async def init_db():
    """Initialize the database and create tables"""
    logger.info("Creating database tables...")
    
    # Create data directory if it doesn't exist
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Run the synchronous create_all in a thread pool for both databases
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, Base.metadata.create_all, main_engine)
    await loop.run_in_executor(None, Base.metadata.create_all, news_engine)
    
    logger.info("Database tables created successfully")

def get_main_db():
    """Get database session for the main database"""
    db = MainSessionLocal()
    try:
        return db
    finally:
        db.close()

def get_news_db():
    """Get database session for the news database"""
    db = NewsSessionLocal()
    try:
        return db
    finally:
        db.close() 