"""
Portfolio API endpoints
"""
from fastapi import APIRouter, Query, HTTPException, Depends, Path, Body
from typing import List, Optional, Dict, Any
import json
import os
import uuid
from datetime import datetime

from app.models.portfolio import Portfolio, CryptoAsset, Transaction, Watchlist
from app.core.logging import get_logger

# Initialize logger
logger = get_logger(__name__)

# Create router
router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

# Helper to load mock data
def load_mock_data(filename):
    try:
        if os.path.exists(filename):
            logger.info(f"Loading data from {filename}")
            with open(filename, 'r') as f:
                return json.load(f)
        # Return empty list if file doesn't exist
        logger.warning(f"File not found: {filename}")
        return []
    except Exception as e:
        logger.error(f"Error loading mock data from {filename}: {e}")
        return []

def save_mock_data(filename, data):
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        logger.info(f"Saving data to {filename}")
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving mock data to {filename}: {e}")
        return False

@router.get("/holdings", response_model=Portfolio)
async def get_portfolio_holdings(
    user_id: str = Query("user123", description="User ID")
):
    """
    Get portfolio holdings for a user
    """
    try:
        # Load portfolio data from file - using the correct location
        holdings_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "portfolio", "user_portfolio_holdings.json")
        logger.info(f"Reading portfolio from {holdings_file}")
        holdings_data = load_mock_data(holdings_file)
        
        # Load market data to get current prices
        market_data_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "market_data.json")
        logger.info(f"Reading market data from {market_data_file}")
        market_data = load_mock_data(market_data_file)
        
        # Create a dictionary for quick price lookups
        price_lookup = {}
        # First use prices from market data
        if market_data and "prices" in market_data:
            for price in market_data["prices"]:
                if "symbol" in price and "priceUsd" in price:
                    price_lookup[price["symbol"].upper()] = price["priceUsd"]
                    logger.info(f"Market price for {price['symbol']}: ${price['priceUsd']}")
        
        # Then use prices from holdings as fallback
        for holding in holdings_data:
            if "symbol" in holding and "price_usd" in holding:
                symbol = holding["symbol"].upper()
                if symbol not in price_lookup:
                    price_lookup[symbol] = holding["price_usd"]
                    logger.info(f"Holding price for {symbol}: ${holding['price_usd']}")
        
        # Convert to Pydantic models
        assets = []
        total_value = 0.0
        
        for holding in holdings_data:
            symbol = holding.get("symbol", "").upper()
            quantity = holding.get("quantity", 0.0)
            
            # Get current price for the asset
            current_price = price_lookup.get(symbol, holding.get("price_usd", 0.0))
            
            # Calculate current value
            value = quantity * current_price
            total_value += value
            
            assets.append(CryptoAsset(
                symbol=symbol,
                name=holding.get("name", ""),
                quantity=quantity,
                price_usd=current_price,
                value_usd=value,
                last_updated=datetime.now()
            ))
        
        # Calculate allocation percentages
        if total_value > 0:
            for asset in assets:
                asset.allocation_percentage = (asset.value_usd / total_value) * 100
        
        return Portfolio(
            user_id=user_id,
            assets=assets,
            total_value_usd=total_value,
            last_updated=datetime.now()
        )
    
    except Exception as e:
        logger.error(f"Error fetching portfolio holdings: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching portfolio holdings: {str(e)}")

@router.post("/transaction", response_model=Transaction)
async def add_transaction(
    transaction: Transaction = Body(..., description="Transaction details")
):
    """
    Add a new transaction to the user's history
    """
    try:
        # Load existing transactions
        transactions_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "transaction_history.json")
        transactions = load_mock_data(transactions_file)
        
        # Create new transaction
        new_transaction = transaction.dict()
        
        # Generate ID if not provided
        if not new_transaction.get("id"):
            new_transaction["id"] = str(uuid.uuid4())
        
        # Add timestamp if not provided
        if not new_transaction.get("timestamp"):
            new_transaction["timestamp"] = datetime.now().isoformat()
        
        # Add to transactions list
        transactions.append(new_transaction)
        
        # Save transactions
        save_mock_data(transactions_file, transactions)
        
        # Update holdings
        await update_holdings(transaction)
        
        return transaction
    
    except Exception as e:
        logger.error(f"Error adding transaction: {e}")
        raise HTTPException(status_code=500, detail=f"Error adding transaction: {str(e)}")

async def update_holdings(transaction: Transaction):
    """Update holdings based on a transaction"""
    try:
        # Load holdings
        holdings_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "portfolio", "user_portfolio_holdings.json")
        holdings = load_mock_data(holdings_file)
        
        # Find existing holding for this symbol
        symbol = transaction.symbol.upper()
        holding_idx = next((i for i, h in enumerate(holdings) if h.get("symbol", "").upper() == symbol), None)
        
        if transaction.transaction_type.lower() == "buy":
            if holding_idx is not None:
                # Update existing holding
                current_qty = holdings[holding_idx].get("quantity", 0.0)
                holdings[holding_idx]["quantity"] = current_qty + transaction.quantity
                holdings[holding_idx]["last_updated"] = datetime.now().isoformat()
            else:
                # Add new holding
                holdings.append({
                    "symbol": symbol,
                    "name": transaction.name or symbol,
                    "quantity": transaction.quantity,
                    "price_usd": transaction.price_usd,
                    "last_updated": datetime.now().isoformat()
                })
        elif transaction.transaction_type.lower() == "sell":
            if holding_idx is not None:
                # Update existing holding
                current_qty = holdings[holding_idx].get("quantity", 0.0)
                new_qty = current_qty - transaction.quantity
                
                if new_qty <= 0:
                    # Remove holding if quantity is zero or negative
                    holdings.pop(holding_idx)
                else:
                    # Update quantity
                    holdings[holding_idx]["quantity"] = new_qty
                    holdings[holding_idx]["last_updated"] = datetime.now().isoformat()
            else:
                # Cannot sell what you don't have
                logger.warning(f"Attempted to sell {symbol} but no holdings found")
        
        # Save updated holdings
        save_mock_data(holdings_file, holdings)
    
    except Exception as e:
        logger.error(f"Error updating holdings: {e}")
        raise

@router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    user_id: str = Query("user123", description="User ID"),
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    limit: int = Query(50, description="Number of transactions to return"),
    offset: int = Query(0, description="Offset for pagination")
):
    """
    Get transaction history for a user
    """
    try:
        # Load transactions
        transactions_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "transaction_history.json")
        transactions = load_mock_data(transactions_file)
        
        # Filter by user ID
        transactions = [t for t in transactions if t.get("user_id") == user_id]
        
        # Filter by symbol if provided
        if symbol:
            symbol = symbol.upper()
            transactions = [t for t in transactions if t.get("symbol", "").upper() == symbol]
        
        # Sort by timestamp (newest first)
        transactions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        # Apply pagination
        transactions = transactions[offset:offset + limit]
        
        # Convert to Pydantic models
        result = []
        for t in transactions:
            # Ensure timestamp is in the correct format
            timestamp = t.get("timestamp")
            if isinstance(timestamp, str):
                try:
                    timestamp = datetime.fromisoformat(timestamp)
                except ValueError:
                    timestamp = datetime.now()
            else:
                timestamp = datetime.now()
            
            result.append(Transaction(
                id=t.get("id", str(uuid.uuid4())),
                user_id=t.get("user_id"),
                symbol=t.get("symbol", ""),
                name=t.get("name"),
                transaction_type=t.get("transaction_type", "buy"),
                quantity=t.get("quantity", 0.0),
                price_usd=t.get("price_usd", 0.0),
                value_usd=t.get("value_usd", 0.0),
                timestamp=timestamp,
                notes=t.get("notes")
            ))
        
        return result
    
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching transactions: {str(e)}")

@router.get("/watchlist", response_model=Watchlist)
async def get_watchlist(
    user_id: str = Query("user123", description="User ID")
):
    """
    Get watchlist for a user
    """
    try:
        # Load watchlist
        watchlist_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "watchlist.json")
        watchlist_data = load_mock_data(watchlist_file)
        
        # Check if we have a watchlist for this user
        if not watchlist_data or not isinstance(watchlist_data, dict) or not watchlist_data.get("symbols"):
            # Return empty watchlist
            return Watchlist(
                user_id=user_id,
                symbols=[],
                last_updated=datetime.now()
            )
        
        return Watchlist(
            user_id=user_id,
            symbols=watchlist_data.get("symbols", []),
            last_updated=datetime.fromisoformat(watchlist_data.get("last_updated", datetime.now().isoformat()))
        )
    
    except Exception as e:
        logger.error(f"Error fetching watchlist: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching watchlist: {str(e)}")

@router.post("/watchlist", response_model=Watchlist)
async def update_watchlist(
    watchlist: Watchlist = Body(..., description="Watchlist data")
):
    """
    Update watchlist for a user
    """
    try:
        # Prepare watchlist data
        watchlist_data = {
            "user_id": watchlist.user_id,
            "symbols": watchlist.symbols,
            "last_updated": datetime.now().isoformat()
        }
        
        # Save watchlist
        watchlist_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "watchlist.json")
        save_mock_data(watchlist_file, watchlist_data)
        
        return watchlist
    
    except Exception as e:
        logger.error(f"Error updating watchlist: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating watchlist: {str(e)}")

@router.get("", response_model=Dict[str, Any])
async def get_complete_portfolio(
    user_id: str = Query("user123", description="User ID")
):
    """
    Get complete portfolio data including assets, total value, performance metrics
    """
    try:
        logger.info(f"Fetching complete portfolio data for user: {user_id}")
        
        # Get portfolio holdings
        portfolio = await get_portfolio_holdings(user_id)
        
        # Prepare asset data in the format expected by the frontend
        assets = []
        for asset in portfolio.assets:
            # Calculate asset-specific metrics
            purchase_price = asset.price_usd * 0.8  # Mock purchase price (20% lower than current)
            purchase_date = datetime.now().replace(month=1, day=1).isoformat()  # Mock purchase date
            
            assets.append({
                "id": len(assets) + 1,
                "symbol": asset.symbol,
                "name": asset.name,
                "coinId": asset.symbol.lower(),
                "amount": asset.quantity,
                "purchasePrice": purchase_price,
                "purchaseDate": purchase_date,
                "currentPrice": asset.price_usd,
                "value": asset.value_usd,
                "price_change_24h": 5.0  # Mock 24h price change
            })
        
        # Calculate total value
        total_value = portfolio.total_value_usd
        
        # Calculate total cost (mock)
        total_cost = sum(asset["amount"] * asset["purchasePrice"] for asset in assets)
        
        # Calculate profit/loss
        absolute_profit = total_value - total_cost
        profit_loss_percentage = (absolute_profit / total_cost * 100) if total_cost > 0 else 0
        
        # Create mock performance data
        performance = {
            "daily": 2.5,
            "weekly": 7.8,
            "monthly": 15.6,
            "yearly": 45.2
        }
        
        # Assemble complete portfolio data
        complete_portfolio = {
            "assets": assets,
            "totalValue": total_value,
            "totalCost": total_cost,
            "absoluteProfit": absolute_profit,
            "profitLossPercentage": profit_loss_percentage,
            "performance": performance
        }
        
        logger.info(f"Returning complete portfolio with {len(assets)} assets and total value ${total_value}")
        return complete_portfolio
    
    except Exception as e:
        logger.error(f"Error fetching complete portfolio: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching complete portfolio: {str(e)}")

@router.post("/watchlist/update", response_model=Watchlist)
async def update_user_watchlist(
    watchlist_data: Dict[str, Any] = Body(..., description="Watchlist update data")
):
    """
    Update user's watchlist (add or remove symbols)
    """
    try:
        user_id = watchlist_data.get("user_id", "user123")
        action = watchlist_data.get("action", "add")
        symbols = watchlist_data.get("symbols", [])
        
        if not symbols:
            logger.warning(f"No symbols provided for watchlist {action} operation")
            raise HTTPException(status_code=400, detail="No symbols provided for update")
        
        # Normalize symbols to uppercase
        symbols = [s.upper() for s in symbols]
        
        # Load existing watchlist
        watchlist_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "portfolio", "user_watchlist.json")
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(watchlist_file), exist_ok=True)
        
        # Load existing data or create new
        watchlist_data = load_mock_data(watchlist_file)
        if not watchlist_data:
            watchlist_data = {"user_id": user_id, "symbols": [], "last_updated": datetime.now().isoformat()}
        
        current_symbols = set(watchlist_data.get("symbols", []))
        
        if action.lower() == "add":
            # Add symbols to watchlist
            for symbol in symbols:
                if symbol not in current_symbols:
                    current_symbols.add(symbol)
                    logger.info(f"Added {symbol} to watchlist for user {user_id}")
        elif action.lower() == "remove":
            # Remove symbols from watchlist
            for symbol in symbols:
                if symbol in current_symbols:
                    current_symbols.remove(symbol)
                    logger.info(f"Removed {symbol} from watchlist for user {user_id}")
        else:
            logger.warning(f"Invalid action: {action}")
            raise HTTPException(status_code=400, detail=f"Invalid action: {action}")
            
        # Update watchlist data
        watchlist_data["symbols"] = list(current_symbols)
        watchlist_data["last_updated"] = datetime.now().isoformat()
        
        # Save updated watchlist
        save_mock_data(watchlist_file, watchlist_data)
        
        return Watchlist(
            user_id=user_id,
            symbols=list(current_symbols),
            last_updated=datetime.now()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating watchlist: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating watchlist: {str(e)}")

@router.post("/holdings/update", response_model=Portfolio)
async def update_portfolio_holdings(
    holdings_data: Dict[str, Any] = Body(..., description="Holdings update data")
):
    """
    Update portfolio holdings (add, remove, or update assets)
    """
    try:
        user_id = holdings_data.get("user_id", "user123")
        assets = holdings_data.get("assets", [])
        
        if not assets:
            logger.warning("No assets provided for portfolio update")
            raise HTTPException(status_code=400, detail="No assets provided for update")
        
        # Load existing holdings
        holdings_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "portfolio", "user_portfolio_holdings.json")
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(holdings_file), exist_ok=True)
        
        # Load existing data
        current_holdings = load_mock_data(holdings_file)
        
        # Update or add each asset
        for asset in assets:
            symbol = asset.get("symbol", "").upper()
            if not symbol:
                logger.warning("Asset missing symbol, skipping")
                continue
                
            # Find existing asset
            existing_index = next((i for i, h in enumerate(current_holdings) if h.get("symbol", "").upper() == symbol), None)
            
            # Check if this is a delete operation
            quantity = asset.get("quantity", 0)
            if quantity == 0 and existing_index is not None:
                # Remove the asset
                logger.info(f"Removing asset {symbol} from portfolio")
                current_holdings.pop(existing_index)
                continue
                
            # Prepare asset data
            asset_data = {
                "symbol": symbol,
                "name": asset.get("name", symbol),
                "quantity": quantity,
                "price_usd": asset.get("price_usd", 0),
                "last_updated": datetime.now().isoformat()
            }
            
            if existing_index is not None:
                # Update existing asset
                current_holdings[existing_index] = asset_data
                logger.info(f"Updated asset {symbol} in portfolio")
            else:
                # Add new asset
                current_holdings.append(asset_data)
                logger.info(f"Added new asset {symbol} to portfolio")
        
        # Save updated holdings
        save_mock_data(holdings_file, current_holdings)
        
        # Return updated portfolio
        return await get_portfolio_holdings(user_id)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating portfolio holdings: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating portfolio holdings: {str(e)}") 