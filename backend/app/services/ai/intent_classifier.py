"""
Intent classification for AI service.

This module provides functionality to classify user queries into specific intent categories,
allowing for targeted context loading and prompt generation.
"""
import re
import logging
from enum import Enum, auto
from typing import Dict, List, Optional, Tuple

from app.core.logging import get_logger

# Initialize logger
logger = get_logger(__name__)

class IntentType(Enum):
    """Enum representing different types of user query intents"""
    MARKET_PRICE = auto()
    NEWS_QUERY = auto()
    PORTFOLIO_ANALYSIS = auto()
    RISK_ASSESSMENT = auto()
    GENERAL_QUERY = auto()
    TAX_ANALYSIS = auto()
    TRADE_HISTORY = auto()
    MARKET_ANALYSIS = auto()

class IntentClassifier:
    """
    Classifies user queries into intent categories to determine
    which context to load and which prompt template to use.
    """
    
    def __init__(self):
        """Initialize the intent classifier with pattern dictionaries"""
        # Patterns for market and price related queries
        self.market_patterns = [
            r"(?:price|worth|value|cost).*(?:of|for)?\s+[a-zA-Z\s]+(?:coin|token|\$?[a-zA-Z]{2,5})",
            r"how\s+(?:much|many)\s+is\s+[a-zA-Z\s]+(?:coin|token|\$?[a-zA-Z]{2,5})\s+(?:worth|valued|trading)",
            r"what.*(?:current|latest|today'?s?)\s+(?:price|value|rate)\s+(?:of|for)?\s+[a-zA-Z\s]+",
            r"(?:btc|eth|bitcoin|ethereum|sol|solana|dot|polkadot|ada|cardano|doge|pepe).*(?:price|chart|trend|worth)",
        ]
        
        # Patterns for news related queries
        self.news_patterns = [
            r"(?:news|headline|article).*(?:about|on|for)\s+[a-zA-Z\s]+",
            r"what.*(?:happening|going\s+on|news).*(?:with|about|on)\s+[a-zA-Z\s]+",
            r"(?:latest|recent|today'?s?)\s+(?:news|headlines|updates|developments)",
            r"(?:messari|twitter|reddit).*(?:saying|posting|reporting|news)",
            r"news",
            r"headlines",
            r"what'?s\s+(?:new|happening)",
            r"any\s+(?:news|updates)",
            r"tell\s+me\s+(?:about\s+)?(?:the\s+)?news",
            r"crypto\s+news"
        ]
        
        # Patterns for portfolio related queries
        self.portfolio_patterns = [
            r"(?:my|our)\s+(?:portfolio|holdings|coins|assets|investment)",
            r"(?:how\s+(?:is|are))\s+(?:my|our)\s+(?:crypto|portfolio|holdings)",
            r"portfolio\s+(?:performance|value|worth|analysis|breakdown)",
            r"(?:best|worst)\s+(?:performing|coin|token|asset|holding)",
            r"(?:allocation|distribution|diversification)",
            r"(?:what|how\s+much)\s+(?:is|are)\s+(?:the|my|our)?\s+(?:value|worth)\s+(?:of)?\s+(?:the|my|our)?\s+portfolio",
            r"(?:total|current)\s+(?:value|worth)\s+(?:of)?\s+(?:the|my|our)?\s+portfolio",
            r"portfolio\s+(?:total|value)",
            r"what.*portfolio.*value",
            r"value.*portfolio"
        ]
        
        # Patterns for risk assessment queries
        self.risk_patterns = [
            r"(?:risk|exposure|volatility|correlation)",
            r"how\s+(?:risky|safe|volatile)",
            r"(?:hedge|hedging|protection|defensive)",
            r"(?:market\s+downturn|bear\s+market|crash|correction)",
            r"(?:diversify|diversification|rebalance)",
        ]
        
        # Patterns for tax related queries
        self.tax_patterns = [
            r"(?:tax|taxes|taxation|taxable)",
            r"(?:capital\s+gains|profit|loss|losses)",
            r"(?:report|reporting|irs|obligations)",
            r"(?:tax\s+implication|tax\s+consequence)",
        ]
        
        # Patterns for trade history queries
        self.trade_patterns = [
            r"(?:trade|trades|trading)\s+(?:history|record|log)",
            r"(?:past|previous|recent)\s+(?:transaction|purchase|sale|buy|sell)",
            r"(?:when|where)\s+(?:did\s+i|i\s+did)\s+(?:buy|sell|trade)",
        ]
        
        logger.info("IntentClassifier initialized with pattern dictionaries")
    
    def classify(self, user_query: str) -> Tuple[IntentType, float]:
        """
        Classify the user query into an intent category.
        
        Args:
            user_query: The user's query text
            
        Returns:
            Tuple containing the classified intent type and a confidence score (0-1)
        """
        user_query = user_query.lower().strip()
        logger.info(f"Classifying user query: {user_query[:50]}...")
        
        # Check each pattern category
        market_score = self._check_patterns(user_query, self.market_patterns)
        news_score = self._check_patterns(user_query, self.news_patterns)
        portfolio_score = self._check_patterns(user_query, self.portfolio_patterns)
        risk_score = self._check_patterns(user_query, self.risk_patterns)
        tax_score = self._check_patterns(user_query, self.tax_patterns)
        trade_score = self._check_patterns(user_query, self.trade_patterns)
        
        # Identify market analysis queries separately from market price queries
        market_analysis_score = 0.0
        market_analysis_keywords = ["analysis", "analyze", "trend", "movement", "predict", "forecast", "outlook"]
        if market_score > 0.4 and any(kw in user_query for kw in market_analysis_keywords):
            market_analysis_score = market_score + 0.2  # Boost the score for analysis-related queries
            market_score = market_score - 0.1  # Slightly reduce original market score
        
        # Determine the highest scoring category
        scores = {
            IntentType.MARKET_PRICE: market_score,
            IntentType.MARKET_ANALYSIS: market_analysis_score,
            IntentType.NEWS_QUERY: news_score,
            IntentType.PORTFOLIO_ANALYSIS: portfolio_score,
            IntentType.RISK_ASSESSMENT: risk_score,
            IntentType.TAX_ANALYSIS: tax_score,
            IntentType.TRADE_HISTORY: trade_score,
            IntentType.GENERAL_QUERY: 0.1,  # Base score for general query
        }
        
        # Get the intent with the highest score
        intent_type = max(scores.items(), key=lambda x: x[1])[0]
        confidence = scores[intent_type]
        
        # If no strong match, default to general query
        if confidence < 0.4 and intent_type != IntentType.GENERAL_QUERY:
            intent_type = IntentType.GENERAL_QUERY
            confidence = 0.1
            
        logger.info(f"Classified as {intent_type.name} with confidence {confidence:.2f}")
        return intent_type, confidence
    
    def _check_patterns(self, query: str, patterns: List[str]) -> float:
        """
        Check if the query matches any patterns in the list.
        
        Args:
            query: The user query
            patterns: List of regex patterns to check
            
        Returns:
            Confidence score between 0-1
        """
        for pattern in patterns:
            if re.search(pattern, query, re.IGNORECASE):
                return 0.8  # Strong confidence if pattern matches
        return 0.0  # No match 