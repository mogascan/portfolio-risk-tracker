# backend/app/api/routes/portfolio.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
import logging

from app.services.exchanges.binance import BinanceService
from app.services.exchanges.coinbase import CoinbaseService
from app.services.blockchain.eth import EthereumService
from app.services.market_data.coingecko import CoinGeckoService

router = APIRouter()
logger = logging.getLogger(__name__)

# Services
binance_service = BinanceService()
coinbase_service = CoinbaseService()
ethereum_service = EthereumService()
market_data_service = CoinGeckoService()

@router.get("/summary")
async def get_portfolio_summary():
    """
    Get a summary of the user's portfolio including total value,
    asset allocation, and profit/loss
    """
    try:
        # Get balances from different sources
        binance_assets = await binance_service.get_balances()
        coinbase_assets = await coinbase_service.get_balances()
        ethereum_assets = await ethereum_service.get_balances()
        
        # Combine assets from all sources
        all_assets = {**binance_assets, **coinbase_assets, **ethereum_assets}
        
        # Get current prices for all assets
        asset_ids = list(all_assets.keys())
        prices = await market_data_service.get_prices(asset_ids)
        
        # Calculate total portfolio value
        total_value = 0
        portfolio_items = []
        
        for asset_id, amount in all_assets.items():
            if asset_id in prices:
                price = prices[asset_id]
                value = amount * price
                total_value += value
                
                portfolio_items.append({
                    "asset_id": asset_id,
                    "symbol": asset_id.upper(),  # Simplified for now
                    "amount": amount,
                    "price": price,
                    "value": value
                })
        
        # Sort by value (descending)
        portfolio_items.sort(key=lambda x: x["value"], reverse=True)
        
        return {
            "total_value": total_value,
            "assets": portfolio_items,
            "updated_at": market_data_service.last_updated
        }
    
    except Exception as e:
        logger.error(f"Error getting portfolio summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get portfolio summary: {str(e)}")

@router.get("/performance")
async def get_portfolio_performance(
    period: str = Query("30d", description="Time period (24h, 7d, 30d, 90d, 1y)")
):
    """
    Get portfolio performance over time
    """
    try:
        # This would typically include historical data from multiple services
        # For MVP, we'll return a simplified structure
        
        # Get historical prices for major assets
        historical_prices = await market_data_service.get_historical_prices(period)
        
        # Calculate portfolio value over time (simplified)
        performance_data = []
        
        # In a real implementation, you would calculate the portfolio value
        # for each day based on historical holdings and prices
        
        return {
            "period": period,
            "data": performance_data
        }
    
    except Exception as e:
        logger.error(f"Error getting portfolio performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get portfolio performance: {str(e)}")

@router.get("/assets")
async def get_portfolio_assets():
    """
    Get detailed information about all assets in the portfolio
    """
    try:
        # Get balances from different sources
        binance_assets = await binance_service.get_balances()
        coinbase_assets = await coinbase_service.get_balances()
        ethereum_assets = await ethereum_service.get_balances()
        
        # Combine assets from all sources
        all_assets = {**binance_assets, **coinbase_assets, **ethereum_assets}
        
        # Get asset details
        asset_details = await market_data_service.get_asset_details(list(all_assets.keys()))
        
        # Combine with balances
        result = []
        for asset_id, details in asset_details.items():
            if asset_id in all_assets:
                result.append({
                    **details,
                    "balance": all_assets[asset_id]
                })
        
        return result
    
    except Exception as e:
        logger.error(f"Error getting portfolio assets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get portfolio assets: {str(e)}")

@router.get("/transactions")
async def get_transactions(
    limit: int = Query(50, description="Number of transactions to return"),
    offset: int = Query(0, description="Offset for pagination")
):
    """
    Get recent transactions across all wallets and exchanges
    """
    try:
        # Get transactions from different sources
        binance_txs = await binance_service.get_transactions(limit, offset)
        coinbase_txs = await coinbase_service.get_transactions(limit, offset)
        ethereum_txs = await ethereum_service.get_transactions(limit, offset)
        
        # Combine and sort transactions by timestamp (descending)
        all_txs = binance_txs + coinbase_txs + ethereum_txs
        all_txs.sort(key=lambda x: x["timestamp"], reverse=True)
        
        # Apply pagination
        paginated_txs = all_txs[offset:offset+limit]
        
        return {
            "transactions": paginated_txs,
            "total": len(all_txs),
            "limit": limit,
            "offset": offset
        }
    
    except Exception as e:
        logger.error(f"Error getting transactions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get transactions: {str(e)}")

@router.get("/tax")
async def get_tax_summary(
    year: int = Query(2024, description="Tax year")
):
    """
    Get tax summary for a specific year
    """
    try:
        # This would integrate with a tax calculation service
        # For MVP, we'll return a simplified structure
        
        # Get all transactions for the year
        # In a real implementation, you would filter by date range
        
        return {
            "year": year,
            "summary": {
                "total_gains": 0,
                "total_losses": 0,
                "net_profit_loss": 0,
                "total_income": 0,
                "estimated_tax": 0
            },
            "events": []  # List of taxable events
        }
    
    except Exception as e:
        logger.error(f"Error getting tax summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get tax summary: {str(e)}")