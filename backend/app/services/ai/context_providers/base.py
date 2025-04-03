"""
Base context provider interface.

This module defines the base class interface that all context providers must implement.
"""
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

from app.core.logging import get_logger

# Initialize logger
logger = get_logger(__name__)

class BaseContextProvider(ABC):
    """
    Abstract base class for all context providers.
    
    Context providers are responsible for retrieving and formatting specific types
    of data to be included in the context for AI responses. Each provider must
    implement the get_context method.
    """
    
    def __init__(self):
        """Initialize the context provider"""
        self.name = self.__class__.__name__
        logger.info(f"Initializing context provider: {self.name}")
    
    @abstractmethod
    async def get_context(self, query: str, token_budget: int) -> Dict[str, Any]:
        """
        Retrieve and format context data based on the query.
        
        Args:
            query: The user's query to target relevant context
            token_budget: Maximum number of tokens to use
            
        Returns:
            Dictionary containing context data
        """
        pass
    
    async def format_data(self, data: Any, token_budget: int) -> str:
        """
        Format the data to a string representation within token budget.
        
        Args:
            data: Data to format
            token_budget: Maximum tokens to use
            
        Returns:
            Formatted string representation
        """
        # Default implementation, subclasses may override for specific formatting
        if not data:
            return ""
            
        try:
            if isinstance(data, dict):
                # Format dictionary as string representation
                formatted = "\n".join([f"{k}: {v}" for k, v in data.items()])
            elif isinstance(data, list):
                # Format list items
                formatted = "\n".join([str(item) for item in data])
            else:
                # Convert to string
                formatted = str(data)
                
            # Rough token count approximation
            approx_tokens = len(formatted) // 4
            
            if approx_tokens > token_budget:
                # Truncate to fit budget
                truncate_ratio = token_budget / approx_tokens
                max_chars = int(len(formatted) * truncate_ratio)
                formatted = formatted[:max_chars] + "...[truncated]"
                logger.info(f"Truncated data from {approx_tokens} to ~{token_budget} tokens")
                
            return formatted
            
        except Exception as e:
            logger.error(f"Error formatting data: {str(e)}")
            return str(data)[:token_budget * 4]  # Fallback to simple string conversion
    
    def estimate_tokens(self, text: str) -> int:
        """
        Estimate the number of tokens in a text.
        
        Args:
            text: Text to estimate
            
        Returns:
            Estimated token count
        """
        # Simple approximation: ~4 characters per token for English text
        return len(text) // 4
    
    def truncate_to_budget(self, text: str, token_budget: int) -> str:
        """
        Truncate text to fit within token budget.
        
        Args:
            text: Text to truncate
            token_budget: Maximum tokens allowed
            
        Returns:
            Truncated text
        """
        estimated_tokens = self.estimate_tokens(text)
        
        if estimated_tokens <= token_budget:
            return text
            
        # Calculate how much to keep
        keep_chars = token_budget * 4
        
        if keep_chars >= len(text):
            return text
            
        return text[:keep_chars] + "...[truncated]" 