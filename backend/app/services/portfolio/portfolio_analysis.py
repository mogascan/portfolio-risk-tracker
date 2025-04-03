import json
import os
import logging
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class PortfolioAnalysis:
    def __init__(self):
        self.base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        self.data_path = os.path.join(self.base_path, 'app', 'data')
        self.portfolio_file = os.path.join(self.data_path, 'portfolio', 'user_portfolio_holdings.json')
        self.market_data_file = os.path.join(self.data_path, 'market_data.json')
        self.transaction_file = os.path.join(self.data_path, 'transaction_history.json')
        self.watchlist_file = os.path.join(self.data_path, 'watchlist.json')
        
        logger.info(f"PortfolioAnalysis initialized with data path: {self.data_path}")
        
        self.portfolio_data = self._load_portfolio_data()
        self.market_data = self._load_market_data()
        self.transaction_history = self._load_transaction_history()
        self.watchlist = self._load_watchlist()

    def _load_json_file(self, file_path: str) -> Dict:
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Error loading {os.path.basename(file_path)}: {str(e)}")
            return {}

    def _load_portfolio_data(self) -> Dict:
        return self._load_json_file(self.portfolio_file)

    def _load_market_data(self) -> Dict:
        return self._load_json_file(self.market_data_file)

    def _load_transaction_history(self) -> Dict:
        return self._load_json_file(self.transaction_file)

    def _load_watchlist(self) -> Dict:
        return self._load_json_file(self.watchlist_file)

    def get_portfolio_context(self) -> str:
        """Generate a comprehensive context string for AI analysis"""
        context = []
        
        # Portfolio Overview
        if self.portfolio_data:
            total_value = self.portfolio_data.get('total_value', 0)
            context.append(f"Portfolio Total Value: ${total_value:,.2f}")
            context.append("\nHoldings:")
            for asset in self.portfolio_data.get('holdings', []):
                context.append(f"- {asset['symbol']}: {asset['amount']} tokens (${asset['value']:,.2f})")

        # Market Data
        if self.market_data.get('market_data'):
            context.append("\nMarket Overview:")
            for symbol, data in self.market_data['market_data'].items():
                context.append(f"- {data['name']} ({data['symbol']}): ${data['current_price']:,.2f} "
                             f"(24h: {data['price_change_24h']}%)")

        # Recent Transactions
        if self.transaction_history.get('transactions'):
            context.append("\nRecent Transactions:")
            sorted_transactions = sorted(
                self.transaction_history['transactions'],
                key=lambda x: x['timestamp'],
                reverse=True
            )[:5]  # Last 5 transactions
            for tx in sorted_transactions:
                context.append(f"- {tx['type'].upper()}: {tx['amount']} {tx['symbol']} "
                             f"at ${tx['price']:,.2f} (${tx['total']:,.2f} total)")

        # Watchlist
        if self.watchlist.get('watchlist'):
            context.append("\nWatchlist:")
            for asset in self.watchlist['watchlist']:
                context.append(f"- {asset['symbol']}: ${asset['price']:,.2f} "
                             f"(24h: {asset['price_change_24h']}%)")

        return "\n".join(context)

    def get_asset_analysis(self, asset_symbol: str) -> str:
        """Generate context for specific asset analysis"""
        context = []
        
        # Market Data
        market_info = None
        for _, data in self.market_data.get('market_data', {}).items():
            if data['symbol'].lower() == asset_symbol.lower():
                market_info = data
                break

        if market_info:
            context.append(f"Asset Analysis for {market_info['name']} ({market_info['symbol']})")
            context.append(f"Current Price: ${market_info['current_price']:,.2f}")
            context.append(f"24h Change: {market_info['price_change_24h']}%")
            context.append(f"7d Change: {market_info['price_change_7d']}%")
            context.append(f"All-Time High: ${market_info['ath']:,.2f} ({market_info['ath_date']})")

        # Portfolio Holdings
        for holding in self.portfolio_data.get('holdings', []):
            if holding['symbol'].lower() == asset_symbol.lower():
                context.append(f"\nYour Position:")
                context.append(f"Amount: {holding['amount']} {holding['symbol']}")
                context.append(f"Current Value: ${holding['value']:,.2f}")
                context.append(f"Cost Basis: ${holding['cost_basis']:,.2f}")
                context.append(f"Unrealized P/L: ${holding['unrealized_pl']:,.2f} ({holding['unrealized_pl_percent']}%)")
                break

        # Recent Transactions
        relevant_transactions = [
            tx for tx in self.transaction_history.get('transactions', [])
            if tx['symbol'].lower() == asset_symbol.lower()
        ]
        if relevant_transactions:
            context.append("\nRecent Transactions:")
            sorted_transactions = sorted(relevant_transactions, key=lambda x: x['timestamp'], reverse=True)[:3]
            for tx in sorted_transactions:
                context.append(f"- {tx['type'].upper()}: {tx['amount']} {tx['symbol']} "
                             f"at ${tx['price']:,.2f} (${tx['total']:,.2f} total)")

        return "\n".join(context)

    def get_market_overview(self) -> str:
        """Generate market overview context"""
        context = []
        
        if self.market_data.get('global'):
            global_data = self.market_data['global']
            context.append("Global Market Overview:")
            context.append(f"Total Market Cap: ${global_data['total_market_cap']:,.2f}")
            context.append(f"24h Trading Volume: ${global_data['total_volume_24h']:,.2f}")
            context.append(f"Bitcoin Dominance: {global_data['btc_dominance']}%")
            context.append(f"Ethereum Dominance: {global_data['eth_dominance']}%")

        context.append("\nTop Assets Performance:")
        for _, data in list(self.market_data.get('market_data', {}).items())[:4]:
            context.append(f"- {data['name']} ({data['symbol']})")
            context.append(f"  Price: ${data['current_price']:,.2f}")
            context.append(f"  24h Change: {data['price_change_24h']}%")
            context.append(f"  7d Change: {data['price_change_7d']}%")
            context.append(f"  Market Cap: ${data['market_cap']:,.2f}")

        return "\n".join(context) 