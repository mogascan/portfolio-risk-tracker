"""
Routes for managing cryptocurrency data
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from typing import List, Dict
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.services.market_data.coingecko_service import CoinGeckoService
from app.models.crypto_data import CryptoData, PriceHistory
from app.database import get_db

router = APIRouter(prefix="/crypto", tags=["crypto"])
logger = logging.getLogger(__name__)

coingecko_service = CoinGeckoService()

@router.post("/initialize")
async def initialize_crypto_data(db: Session = Depends(get_db)):
    """Initialize or update crypto data"""
    logger.info("Starting crypto data initialization")
    await coingecko_service.update_crypto_data(db)
    logger.info("Crypto data initialization completed")
    return {"status": "success", "message": "Crypto data initialization completed"}

@router.get("/initialization-status")
async def get_initialization_status(db: Session = Depends(get_db)) -> Dict:
    """Get the current status of crypto data initialization"""
    total_coins = db.query(CryptoData).count()
    total_coins_with_history = db.query(func.count(func.distinct(PriceHistory.crypto_id))).scalar()
    
    if total_coins == 0:
        return {
            "status": "not_started",
            "progress": 0,
            "total_coins": 0,
            "initialized_coins": 0
        }
    
    progress = (total_coins_with_history / total_coins) * 100 if total_coins > 0 else 0
    
    return {
        "status": "completed" if total_coins == total_coins_with_history else "in_progress",
        "progress": round(progress, 2),
        "total_coins": total_coins,
        "initialized_coins": total_coins_with_history
    }

@router.get("/completed-coins")
async def get_completed_coins(db: Session = Depends(get_db)):
    """Get list of all coins that have completed historical data download"""
    try:
        logger.info("Fetching list of coins with completed historical data")
        
        # First get all coins that have price history
        subquery = db.query(func.distinct(PriceHistory.crypto_id)).subquery()
        
        # Then get the coin details for those coins
        coins = db.query(CryptoData).filter(CryptoData.id.in_(subquery)).all()
        
        logger.info(f"Found {len(coins)} coins with completed historical data")
        return [{
            "id": coin.id, 
            "coin_id": coin.coin_id,
            "symbol": coin.symbol, 
            "name": coin.name
        } for coin in coins]
    except Exception as e:
        logger.error(f"Error fetching completed coins: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/coins")
async def get_coins(db: Session = Depends(get_db)):
    """Get list of all tracked coins"""
    try:
        logger.info("Fetching list of all coins")
        coins = db.query(CryptoData).all()
        logger.info(f"Found {len(coins)} coins")
        return [{"id": coin.id, "symbol": coin.symbol, "name": coin.name} for coin in coins]
    except Exception as e:
        logger.error(f"Error fetching coins: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/coins/{coin_id}")
async def get_coin_details(
    coin_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific coin"""
    try:
        logger.info(f"Fetching details for coin: {coin_id}")
        coin = db.query(CryptoData).filter(CryptoData.coin_id == coin_id).first()
        if not coin:
            logger.warning(f"Coin not found: {coin_id}")
            raise HTTPException(status_code=404, detail="Coin not found")
        
        logger.info(f"Found coin: {coin.name} ({coin.symbol})")
        return {
            "id": coin.id,
            "coin_id": coin.coin_id,
            "symbol": coin.symbol,
            "name": coin.name,
            "current_price": coin.current_price,
            "market_cap": coin.market_cap,
            "total_volume": coin.total_volume,
            "last_updated": coin.last_updated
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coin details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/coins/{coin_id}/history")
async def get_coin_price_history(
    coin_id: str,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get price history for a specific coin"""
    try:
        logger.info(f"Fetching price history for coin: {coin_id}")
        coin = db.query(CryptoData).filter(CryptoData.coin_id == coin_id).first()
        if not coin:
            logger.warning(f"Coin not found: {coin_id}")
            raise HTTPException(status_code=404, detail="Coin not found")
        
        history = db.query(PriceHistory)\
            .filter(PriceHistory.crypto == coin)\
            .order_by(PriceHistory.timestamp.desc())\
            .limit(limit)\
            .all()
        
        logger.info(f"Found {len(history)} price records for {coin.name}")
        return [{
            "price": record.price,
            "timestamp": record.timestamp
        } for record in history]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching price history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 