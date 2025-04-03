# backend/app/services/exchanges/base.py
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional

class ExchangeService(ABC):
    """Base class for exchange API services"""
    
    @abstractmethod
    async def get_balances(self) -> Dict[str, float]:
        """Get balances for all assets on the exchange"""
        pass
    
    @abstractmethod
    async def get_transactions(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get recent transactions"""
        pass
    
    @abstractmethod
    async def get_historical_balances(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get historical balance snapshots"""
        pass
