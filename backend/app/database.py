"""
Database interfaces and configuration

DEPRECATED: This module has been moved to app.legacy.db.app_database
and will be removed in a future version.
"""
import os
import logging
import asyncio
import json
import warnings
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from app.models.crypto_data import Base

# Issue a deprecation warning
warnings.warn(
    "This database module is deprecated and has been moved to app.legacy.db.app_database. "
    "This module will be removed in a future version.",
    DeprecationWarning,
    stacklevel=2
)

# Configure logging
logger = logging.getLogger(__name__)

# Get the database path from environment variable or use default
DB_PATH = os.getenv("DB_PATH", "sqlite:///crypto_data.db")
logger.info(f"Using database path: {DB_PATH}")

# Create database engine
engine = create_engine(DB_PATH, echo=True)  # Enable SQL logging
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@event.listens_for(engine, "connect")
def on_connect(dbapi_con, connection_record):
    logger.info("New database connection established")

@event.listens_for(engine, "checkout")
def on_checkout(dbapi_con, connection_record, connection_proxy):
    logger.info("Database connection checked out from pool")

async def init_db():
    """Initialize the database and create tables"""
    logger.info("Creating database tables...")
    # Run the synchronous create_all in a thread pool
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, Base.metadata.create_all, engine)
    logger.info("Database tables created successfully")

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        logger.info("New database session created")
        return db
    finally:
        logger.info("Database session closed")
        db.close() 