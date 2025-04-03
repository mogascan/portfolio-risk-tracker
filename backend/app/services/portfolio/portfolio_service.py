import logging
import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from ..market.market_data_service import MarketDataService

logger = logging.getLogger(__name__)

class PortfolioService:
    """Service for managing portfolio data and operations"""
    
    def __init__(self):
        self.base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        self.data_path = os.path.join(self.base_path, 'app', 'data')
        # Update file paths to point to our data directory
        self.portfolio_file = os.path.join(self.data_path, 'portfolio', 'user_portfolio_holdings.json')
        self.transactions_file = os.path.join(self.data_path, 'transaction_history.json')
        self.market_data_file = os.path.join(self.data_path, 'market_data.json')
        self.watchlist_file = os.path.join(self.data_path, 'watchlist.json')
        self.market_data_service = MarketDataService()
        
        logger.info(f"PortfolioService initialized with data path: {self.data_path}")
        logger.info(f"Portfolio file: {self.portfolio_file}")
        logger.info(f"Transactions file: {self.transactions_file}")

    async def get_portfolio(self) -> Dict[str, Any]:
        """Get current portfolio data with market prices"""
        try:
            portfolio_data = self._load_portfolio()
            if not portfolio_data or "holdings" not in portfolio_data:
                return {"holdings": [], "total_value": 0}

            # Update market prices
            total_value = 0
            for holding in portfolio_data["holdings"]:
                current_price = await self.market_data_service.get_coin_price(holding["asset_id"])
                if current_price:
                    holding["current_price"] = current_price
                    holding["current_value"] = current_price * holding["amount"]
                    total_value += holding["current_value"]

            portfolio_data["total_value"] = total_value
            portfolio_data["last_update"] = datetime.now().isoformat()

            return portfolio_data
        except Exception as e:
            logger.error(f"Error getting portfolio: {str(e)}")
            return {"error": str(e)}

    def _load_portfolio(self) -> Dict[str, Any]:
        """Load portfolio data from file"""
        try:
            if os.path.exists(self.portfolio_file):
                with open(self.portfolio_file, 'r') as f:
                    return json.load(f)
            return {"holdings": []}
        except Exception as e:
            logger.error(f"Error loading portfolio: {str(e)}")
            return {"holdings": []}

    def _save_portfolio(self, portfolio_data: Dict[str, Any]) -> bool:
        """Save portfolio data to file"""
        try:
            with open(self.portfolio_file, 'w') as f:
                json.dump(portfolio_data, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error saving portfolio: {str(e)}")
            return False

    async def add_transaction(self, transaction: Dict[str, Any]) -> bool:
        """Add a new transaction and update portfolio"""
        try:
            # Validate transaction data
            required_fields = ["asset_id", "type", "amount", "price", "timestamp"]
            if not all(field in transaction for field in required_fields):
                logger.error("Missing required transaction fields")
                return False

            # Load existing transactions
            transactions = self._load_transactions()
            
            # Add new transaction
            transaction["id"] = str(len(transactions) + 1)
            transaction["timestamp"] = datetime.now().isoformat()
            transactions.append(transaction)
            
            # Save transactions
            self._save_transactions(transactions)
            
            # Update portfolio
            await self._update_portfolio_from_transactions()
            
            return True
        except Exception as e:
            logger.error(f"Error adding transaction: {str(e)}")
            return False

    def _load_transactions(self) -> List[Dict[str, Any]]:
        """Load transaction history from file"""
        try:
            if os.path.exists(self.transactions_file):
                with open(self.transactions_file, 'r') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Error loading transactions: {str(e)}")
            return []

    def _save_transactions(self, transactions: List[Dict[str, Any]]) -> bool:
        """Save transactions to file"""
        try:
            with open(self.transactions_file, 'w') as f:
                json.dump(transactions, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error saving transactions: {str(e)}")
            return False

    async def _update_portfolio_from_transactions(self) -> bool:
        """Update portfolio holdings based on transaction history"""
        try:
            transactions = self._load_transactions()
            holdings = {}
            
            # Calculate holdings from transactions
            for tx in transactions:
                asset_id = tx["asset_id"]
                if asset_id not in holdings:
                    holdings[asset_id] = {
                        "asset_id": asset_id,
                        "amount": 0,
                        "total_cost": 0
                    }
                
                if tx["type"] == "buy":
                    holdings[asset_id]["amount"] += tx["amount"]
                    holdings[asset_id]["total_cost"] += tx["amount"] * tx["price"]
                elif tx["type"] == "sell":
                    holdings[asset_id]["amount"] -= tx["amount"]
                    holdings[asset_id]["total_cost"] -= tx["amount"] * tx["price"]
            
            # Remove zero balance holdings
            holdings = {k: v for k, v in holdings.items() if v["amount"] > 0}
            
            # Calculate average cost
            for holding in holdings.values():
                if holding["amount"] > 0:
                    holding["average_cost"] = holding["total_cost"] / holding["amount"]
            
            # Save updated portfolio
            portfolio_data = {
                "holdings": list(holdings.values()),
                "last_update": datetime.now().isoformat()
            }
            return self._save_portfolio(portfolio_data)
            
        except Exception as e:
            logger.error(f"Error updating portfolio from transactions: {str(e)}")
            return False

    async def get_portfolio_performance(self) -> Dict[str, Any]:
        """Get portfolio performance metrics"""
        try:
            portfolio = await self.get_portfolio()
            if "error" in portfolio:
                return portfolio

            total_cost = sum(h["total_cost"] for h in portfolio["holdings"])
            total_value = portfolio["total_value"]
            
            return {
                "total_cost": total_cost,
                "total_value": total_value,
                "total_profit_loss": total_value - total_cost,
                "profit_loss_percentage": ((total_value - total_cost) / total_cost * 100) if total_cost > 0 else 0,
                "holdings_performance": [
                    {
                        "asset_id": h["asset_id"],
                        "profit_loss": (h["current_value"] - h["total_cost"]) if "current_value" in h else 0,
                        "profit_loss_percentage": ((h["current_value"] - h["total_cost"]) / h["total_cost"] * 100) if h["total_cost"] > 0 else 0
                    }
                    for h in portfolio["holdings"]
                ],
                "last_update": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error calculating portfolio performance: {str(e)}")
            return {"error": str(e)} 