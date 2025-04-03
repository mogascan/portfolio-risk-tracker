"""
Market data API endpoints
"""
from fastapi import APIRouter, Query, HTTPException, Depends, Path, Body # type: ignore
from typing import List, Optional, Dict, Any
import os
import json
import logging
from datetime import datetime, timedelta
import random

from app.models.market import MarketOverview, CryptoPrice, CryptoPriceHistory, TechnicalIndicator
from app.core.logging import get_logger
from app.services.market.market_data_service import MarketDataService

# Initialize logger
logger = get_logger(__name__)

# Create router
router = APIRouter(prefix="/market", tags=["Market Data"])

# Create a singleton instance of the market service
_market_service = None

def get_market_service():
    """Get or create the market data service instance"""
    global _market_service
    if _market_service is None:
        _market_service = MarketDataService()
    return _market_service

# Helper to load mock data
def load_mock_data(filename):
    try:
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                return json.load(f)
        # Return empty list if file doesn't exist
        return []
    except Exception as e:
        logger.error(f"Error loading mock data from {filename}: {e}")
        return []

@router.get("/data", response_model=Dict[str, Any])
async def get_market_data():
    """
    Get current market data
    """
    try:
        logger.info("Fetching market data from service")
        market_service = get_market_service()
        return await market_service.get_market_data()
    except Exception as e:
        logger.error(f"Error fetching market data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching market data: {str(e)}")

@router.get("/prices", response_model=List[Dict[str, Any]])
async def get_crypto_prices(
    limit: int = Query(50, description="Number of items to return"),
    offset: int = Query(0, description="Offset for pagination")
):
    """
    Get current crypto prices
    """
    try:
        logger.info(f"Fetching crypto prices with limit={limit}, offset={offset}")
        market_service = get_market_service()
        market_data = await market_service.get_market_data()
        
        if "prices" in market_data:
            # Sort prices by market cap (highest first)
            sorted_prices = sorted(market_data["prices"], key=lambda x: x.get("marketCap", 0), reverse=True)
            paginated = sorted_prices[offset:offset + limit]
            return paginated
        
        logger.warning("No price data found")
        return []
    except Exception as e:
        logger.error(f"Error fetching crypto prices: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching crypto prices: {str(e)}")

@router.get("/price/{coin_id}", response_model=Dict[str, Any])
async def get_coin_price(
    coin_id: str = Path(..., description="Coin ID or symbol")
):
    """
    Get price for a specific coin
    """
    try:
        logger.info(f"Fetching price for coin: {coin_id}")
        
        # Try to get price from service
        market_service = get_market_service()
        price = await market_service.get_coin_price(coin_id)
        
        if price is not None:
            return {"symbol": coin_id.upper(), "price": price}
        
        # If not found in service, check in market data
        market_data = await market_service.get_market_data()
        if "prices" in market_data:
            for coin in market_data["prices"]:
                if coin["symbol"].lower() == coin_id.lower() or coin.get("id", "").lower() == coin_id.lower():
                    return {"symbol": coin["symbol"], "price": coin["priceUsd"]}
        
        # If we got here, the coin wasn't found
        logger.warning(f"Coin not found: {coin_id}")
        raise HTTPException(status_code=404, detail=f"Coin not found: {coin_id}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coin price: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching coin price: {str(e)}")

@router.get("/overview", response_model=Dict[str, Any])
async def get_market_overview():
    """
    Get market overview statistics
    """
    try:
        logger.info("Fetching market overview")
        market_service = get_market_service()
        market_data = await market_service.get_market_data()
        
        if "overview" in market_data:
            return market_data["overview"]
            
        logger.warning("No market overview data found")
        raise HTTPException(status_code=404, detail="Market overview data not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching market overview: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching market overview: {str(e)}")

@router.get("/trending", response_model=List[Dict[str, Any]])
async def get_trending_coins(
    limit: int = Query(20, description="Number of items to return")
):
    """
    Get trending coins based on 24h price change
    """
    try:
        logger.info(f"Fetching trending coins with limit={limit}")
        market_service = get_market_service()
        market_data = await market_service.get_market_data()
        
        if "prices" in market_data:
            # Filter out coins with no change data and sort by 24h change (highest first)
            valid_coins = [coin for coin in market_data["prices"] if coin.get("change24h") is not None]
            trending = sorted(valid_coins, key=lambda x: x.get("change24h", 0), reverse=True)
            return trending[:limit]
            
        logger.warning("No trending coins data found")
        return []
    except Exception as e:
        logger.error(f"Error fetching trending coins: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching trending coins: {str(e)}")

@router.get("/search", response_model=List[Dict[str, Any]])
async def search_coins(
    query: str = Query(..., description="Search query"),
    limit: int = Query(20, description="Number of items to return")
):
    """
    Search for coins by name or symbol
    """
    try:
        logger.info(f"Searching coins with query='{query}', limit={limit}")
        market_service = get_market_service()
        market_data = await market_service.get_market_data()
        
        if "prices" in market_data:
            # Search by name or symbol (case insensitive)
            query = query.lower()
            matches = [
                coin for coin in market_data["prices"] 
                if query in coin.get("name", "").lower() or query in coin.get("symbol", "").lower()
            ]
            return matches[:limit]
            
        logger.warning("No coin data found for search")
        return []
    except Exception as e:
        logger.error(f"Error searching coins: {e}")
        raise HTTPException(status_code=500, detail=f"Error searching coins: {str(e)}")

@router.get("/price/{symbol}", response_model=CryptoPrice)
async def get_crypto_price(
    symbol: str = Path(..., description="Cryptocurrency symbol")
):
    """
    Get price data for a specific cryptocurrency
    """
    try:
        # Load market data from file
        market_data = load_mock_data(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "market_data.json"))
        
        if not market_data or "prices" not in market_data:
            raise HTTPException(status_code=404, detail="Cryptocurrency price data not found")
        
        # Find the specific cryptocurrency
        price_data = next(
            (p for p in market_data["prices"] if p.get("symbol", "").upper() == symbol.upper()),
            None
        )
        
        if not price_data:
            raise HTTPException(status_code=404, detail=f"Price data for {symbol} not found")
        
        # Convert to Pydantic model
        ath_date = None
        if "athDate" in price_data and price_data["athDate"]:
            try:
                ath_date = datetime.fromisoformat(price_data["athDate"].replace("Z", "+00:00"))
            except Exception:
                ath_date = None
        
        return CryptoPrice(
            symbol=price_data.get("symbol", ""),
            name=price_data.get("name", ""),
            price_usd=price_data.get("priceUsd", 0.0),
            market_cap_usd=price_data.get("marketCapUsd"),
            volume_24h_usd=price_data.get("volume24hUsd"),
            change_24h=price_data.get("change24h"),
            change_7d=price_data.get("change7d"),
            change_30d=price_data.get("change30d"),
            ath_usd=price_data.get("athUsd"),
            ath_date=ath_date,
            rank=price_data.get("rank"),
            last_updated=datetime.fromisoformat(price_data.get("lastUpdated", datetime.now().isoformat()))
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching price data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching price data: {str(e)}")

@router.get("/history/{symbol}", response_model=CryptoPriceHistory)
async def get_price_history(
    symbol: str = Path(..., description="Cryptocurrency symbol"),
    interval: str = Query("7d", description="Time interval (1h, 1d, 7d, 30d, 90d, 1y, max)")
):
    """
    Get historical price data for a specific cryptocurrency
    """
    try:
        # Load market data from file or fetch from service
        # For this example, we'll generate mock historical data
        
        # Validate symbol first
        symbol = symbol.upper()
        
        # Load market data from file to validate symbol
        market_data = load_mock_data(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "market_data.json"))
        
        if not market_data or "prices" not in market_data:
            raise HTTPException(status_code=404, detail="Cryptocurrency price data not found")
        
        # Find the specific cryptocurrency to get current price
        price_data = next(
            (p for p in market_data["prices"] if p.get("symbol", "").upper() == symbol),
            None
        )
        
        if not price_data:
            raise HTTPException(status_code=404, detail=f"Price data for {symbol} not found")
        
        current_price = price_data.get("priceUsd", 1000.0)
        
        # Generate historical price data based on interval
        prices = []
        end_date = datetime.now()
        
        if interval == "1h":
            # Hourly data for the past 24 hours
            for i in range(24):
                timestamp = end_date - timedelta(hours=i)
                # Add some randomness to price
                price = current_price * (1 + random.uniform(-0.01, 0.01))
                prices.insert(0, {
                    "timestamp": timestamp.isoformat(),
                    "price": price
                })
        elif interval == "1d":
            # Daily data for the past 30 days
            for i in range(30):
                timestamp = end_date - timedelta(days=i)
                # Add some randomness to price
                price = current_price * (1 + random.uniform(-0.05, 0.05))
                prices.insert(0, {
                    "timestamp": timestamp.isoformat(),
                    "price": price
                })
        elif interval == "7d":
            # Daily data for the past 7 days
            for i in range(7):
                timestamp = end_date - timedelta(days=i)
                # Add some randomness to price
                price = current_price * (1 + random.uniform(-0.03, 0.03))
                prices.insert(0, {
                    "timestamp": timestamp.isoformat(),
                    "price": price
                })
        elif interval == "30d":
            # Daily data for the past 30 days
            for i in range(30):
                timestamp = end_date - timedelta(days=i)
                # Add some randomness to price
                price = current_price * (1 + random.uniform(-0.1, 0.1))
                prices.insert(0, {
                    "timestamp": timestamp.isoformat(),
                    "price": price
                })
        elif interval == "90d":
            # Every 3 days for the past 90 days
            for i in range(0, 90, 3):
                timestamp = end_date - timedelta(days=i)
                # Add some randomness to price
                price = current_price * (1 + random.uniform(-0.15, 0.15))
                prices.insert(0, {
                    "timestamp": timestamp.isoformat(),
                    "price": price
                })
        elif interval == "1y":
            # Every 2 weeks for the past year
            for i in range(0, 365, 14):
                timestamp = end_date - timedelta(days=i)
                # Add some randomness to price
                price = current_price * (1 + random.uniform(-0.3, 0.3))
                prices.insert(0, {
                    "timestamp": timestamp.isoformat(),
                    "price": price
                })
        else:  # "max"
            # Every month for the past 5 years
            for i in range(0, 5 * 12):
                timestamp = end_date - timedelta(days=i * 30)
                # Add some randomness to price
                price = current_price * (1 + random.uniform(-0.5, 0.5))
                prices.insert(0, {
                    "timestamp": timestamp.isoformat(),
                    "price": price
                })
        
        return CryptoPriceHistory(
            symbol=symbol,
            interval=interval,
            prices=prices
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching price history for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching price history: {str(e)}")

@router.get("/indicators/{symbol}", response_model=List[TechnicalIndicator])
async def get_technical_indicators(
    symbol: str = Path(..., description="Cryptocurrency symbol"),
    indicators: str = Query("all", description="Comma-separated list of indicators (RSI, MACD, MA, EMA, GOLDEN_CROSS, all)"),
    time_frame: str = Query("1d", description="Time frame (1h, 4h, 1d, 1w, 1m)")
):
    """
    Get technical indicators for a specific cryptocurrency
    """
    try:
        # Validate symbol
        symbol = symbol.upper()
        
        # Determine which indicators to include
        if indicators.lower() == "all":
            indicator_list = ["RSI", "MACD", "MA", "EMA", "GOLDEN_CROSS"]
        else:
            indicator_list = [ind.strip().upper() for ind in indicators.split(",")]
        
        # Load market data to validate symbol
        market_data = load_mock_data(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "market_data.json"))
        
        # Find the specific cryptocurrency
        crypto_data = next(
            (p for p in market_data.get("prices", []) if p.get("symbol", "").upper() == symbol),
            None
        )
        
        if not crypto_data:
            raise HTTPException(status_code=404, detail=f"Data for {symbol} not found")
        
        # Generate mock indicator data
        result = []
        
        if "RSI" in indicator_list:
            # Generate RSI value between 0 and 100
            rsi_value = random.uniform(30, 70)
            signal = "NEUTRAL"
            if rsi_value > 70:
                signal = "SELL"  # Overbought
            elif rsi_value < 30:
                signal = "BUY"   # Oversold
            
            result.append(TechnicalIndicator(
                symbol=symbol,
                indicator_type="RSI",
                value=rsi_value,
                signal=signal,
                time_frame=time_frame,
                parameters={"period": 14}
            ))
        
        if "MACD" in indicator_list:
            # Generate MACD values
            macd_value = random.uniform(-2, 2)
            signal_value = random.uniform(-2, 2)
            histogram = macd_value - signal_value
            
            signal = "NEUTRAL"
            if macd_value > signal_value:
                signal = "BUY"
            elif macd_value < signal_value:
                signal = "SELL"
            
            result.append(TechnicalIndicator(
                symbol=symbol,
                indicator_type="MACD",
                value=macd_value,
                signal=signal,
                time_frame=time_frame,
                parameters={
                    "fast_period": 12,
                    "slow_period": 26,
                    "signal_period": 9,
                    "signal_value": signal_value,
                    "histogram": histogram
                }
            ))
        
        if "MA" in indicator_list:
            # Generate Moving Average values
            periods = [50, 200]
            
            for period in periods:
                price = crypto_data.get("priceUsd", 1000.0)
                ma_value = price * (1 + random.uniform(-0.05, 0.05))
                
                signal = "NEUTRAL"
                if price > ma_value:
                    signal = "BUY"  # Price above MA
                elif price < ma_value:
                    signal = "SELL"  # Price below MA
                
                result.append(TechnicalIndicator(
                    symbol=symbol,
                    indicator_type=f"MA{period}",
                    value=ma_value,
                    signal=signal,
                    time_frame=time_frame,
                    parameters={"period": period}
                ))
        
        if "EMA" in indicator_list:
            # Generate Exponential Moving Average values
            periods = [12, 26]
            
            for period in periods:
                price = crypto_data.get("priceUsd", 1000.0)
                ema_value = price * (1 + random.uniform(-0.03, 0.03))
                
                signal = "NEUTRAL"
                if price > ema_value:
                    signal = "BUY"  # Price above EMA
                elif price < ema_value:
                    signal = "SELL"  # Price below EMA
                
                result.append(TechnicalIndicator(
                    symbol=symbol,
                    indicator_type=f"EMA{period}",
                    value=ema_value,
                    signal=signal,
                    time_frame=time_frame,
                    parameters={"period": period}
                ))
        
        if "GOLDEN_CROSS" in indicator_list:
            # Generate Golden Cross/Death Cross signal
            price = crypto_data.get("priceUsd", 1000.0)
            ma50 = price * (1 + random.uniform(-0.05, 0.05))
            ma200 = price * (1 + random.uniform(-0.08, 0.08))
            cross_type = "NONE"
            signal = "NEUTRAL"
            
            if ma50 > ma200:
                cross_type = "GOLDEN_CROSS"
                signal = "BUY"
            elif ma50 < ma200:
                cross_type = "DEATH_CROSS"
                signal = "SELL"
            
            result.append(TechnicalIndicator(
                symbol=symbol,
                indicator_type="CROSS",
                value=ma50 - ma200,  # Difference between MAs
                signal=signal,
                time_frame=time_frame,
                parameters={
                    "ma50": ma50,
                    "ma200": ma200,
                    "cross_type": cross_type
                }
            ))
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching technical indicators for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching technical indicators: {str(e)}")

@router.get("/topcoins", response_model=List[Dict[str, Any]])
async def get_top_coins(
    limit: int = Query(100, description="Number of coins to return (max 500)"),
    currency: str = Query("usd", description="Currency for price data")
):
    """
    Get top cryptocurrencies by market capitalization from CoinGecko
    """
    try:
        # Enforce maximum limit
        limit = min(limit, 500)
        logger.info(f"Fetching top {limit} coins")
        
        # Try to get data from the service first
        try:
            market_service = get_market_service()
            top_coins = await market_service.get_prices(limit=limit)
            # If we got data, return it
            if top_coins and len(top_coins) > 0:
                logger.info(f"Returning {len(top_coins)} coins (requested {limit})")
                return top_coins
        except Exception as e:
            logger.error(f"Error fetching from service: {str(e)}")
            # Return a user-friendly error message instead of falling back to mock data
            error_message = str(e)
            
            # Determine the specific error type and provide appropriate guidance
            if "rate limit" in error_message.lower():
                raise HTTPException(
                    status_code=429, 
                    detail="CoinGecko API rate limit exceeded. Please try again in a few minutes."
                )
            elif "403" in error_message:
                raise HTTPException(
                    status_code=403, 
                    detail="Access to CoinGecko API is currently restricted. This may be due to rate limiting."
                )
            elif "connection" in error_message.lower():
                raise HTTPException(
                    status_code=503, 
                    detail="Could not connect to CoinGecko API. Please check your internet connection and try again."
                )
            else:
                # General error case
                raise HTTPException(
                    status_code=500, 
                    detail=f"Error fetching market data: {error_message}"
                )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error fetching top coins: {str(e)}")
        raise HTTPException(
            status_code=503, 
            detail=f"Error fetching market data: {str(e)}. Please try again later."
        ) 