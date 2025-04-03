from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import logging
from datetime import datetime
import asyncio
from .services.market_data.coingecko_cache_service import CoinGeckoCacheService
from .services.database.db_service import DatabaseService
from .config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Golden Cross API", version="0.1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
logger.info("Initializing services...")
db_service = DatabaseService()
logger.info("DatabaseService initialized")
coingecko_service = CoinGeckoCacheService(db_service=db_service, api_key=None)
logger.info(f"CoinGeckoCacheService initialized with {len(coingecko_service.coin_ids)} coins")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Golden Cross API is running"}

@app.post("/golden-cross/load-initial-data")
async def load_initial_data():
    """Load initial historical data for all coins."""
    try:
        coin_ids = [
            "bitcoin", "ethereum", "binancecoin", "ripple", "cardano",
            "solana", "avalanche-2", "polkadot", "dogecoin", "polygon",
            "chainlink", "uniswap", "litecoin", "stellar", "cosmos",
            "monero", "ethereum-classic", "filecoin", "vechain"
        ]
        result = await coingecko_service.load_initial_data(coin_ids)
        return {"status": "started", "message": f"Started loading data for {len(coin_ids)} coins", "coins": coin_ids}
    except Exception as e:
        logger.error(f"Error loading initial data: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/golden-cross/loading-status")
async def get_loading_status():
    """
    Get the current status of the data loading process
    """
    try:
        # Get loading status from database
        status = db_service.get_loading_status()
        return status
    except Exception as e:
        logger.error(f"Error getting loading status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/database/contents")
async def view_database_contents():
    """View the contents of all tables in the database"""
    try:
        contents = db_service.view_database_contents()
        return {"status": "success", "data": contents}
    except Exception as e:
        logger.error(f"Error viewing database contents: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/database/cleanup")
async def cleanup_database(days: int = 365):
    """Clean up historical data older than specified days"""
    try:
        deleted = db_service.cleanup_old_data(days)
        return {"status": "success", "deleted": deleted}
    except Exception as e:
        logger.error(f"Error cleaning up database: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/database/archive")
async def archive_database(archive_path: str = "archives/crypto_data_backup.db"):
    """Create an archive of the database"""
    try:
        success = db_service.archive_database(archive_path)
        if success:
            return {"status": "success", "message": f"Database archived to {archive_path}"}
        return {"status": "error", "message": "Failed to archive database"}
    except Exception as e:
        logger.error(f"Error archiving database: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/database/restore")
async def restore_database(archive_path: str = "archives/crypto_data_backup.db"):
    """Restore database from an archive"""
    try:
        success = db_service.restore_from_archive(archive_path)
        if success:
            return {"status": "success", "message": f"Database restored from {archive_path}"}
        return {"status": "error", "message": "Failed to restore database"}
    except Exception as e:
        logger.error(f"Error restoring database: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/database/stats")
async def get_database_stats():
    """Get statistics about the database"""
    try:
        stats = db_service.get_database_stats()
        return {"status": "success", "data": stats}
    except Exception as e:
        logger.error(f"Error getting database stats: {str(e)}")
        return {"status": "error", "message": str(e)} 