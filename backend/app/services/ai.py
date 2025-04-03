"""
AI service for market analysis and predictions
"""
import json
import os
import random
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple

from app.core.logging import get_logger

# Initialize logger
logger = get_logger(__name__)

class AIService:
    """Service for AI analysis of market data"""
    
    def __init__(self):
        """Initialize AIService"""
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
        # Create data directory if it doesn't exist
        os.makedirs(self.data_dir, exist_ok=True)
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text content
        
        Args:
            text: Text content to analyze
            
        Returns:
            Sentiment analysis results
        """
        try:
            # In a real implementation, this would call an AI model
            # For now, we'll generate random sentiment
            
            # Simple keyword-based analysis
            positive_words = ['bullish', 'gain', 'profit', 'growth', 'positive', 'up', 'rise', 'soar']
            negative_words = ['bearish', 'loss', 'crash', 'decline', 'negative', 'down', 'fall', 'plummet']
            
            # Count positive and negative words
            positive_count = sum(1 for word in positive_words if word in text.lower())
            negative_count = sum(1 for word in negative_words if word in text.lower())
            
            # Determine sentiment
            if positive_count > negative_count:
                sentiment = "positive"
                score = min(0.5 + (positive_count - negative_count) * 0.1, 0.95)
            elif negative_count > positive_count:
                sentiment = "negative"
                score = max(0.5 - (negative_count - positive_count) * 0.1, 0.05)
            else:
                sentiment = "neutral"
                score = 0.5
            
            return {
                "sentiment": sentiment,
                "score": score,
                "positive_keywords": positive_count,
                "negative_keywords": negative_count,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}")
            return {
                "sentiment": "neutral",
                "score": 0.5,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def predict_price(self, symbol: str, time_frame: str = "7d") -> Dict[str, Any]:
        """
        Generate price predictions for a cryptocurrency
        
        Args:
            symbol: Cryptocurrency symbol
            time_frame: Time frame for prediction (24h, 7d, 30d)
            
        Returns:
            Price prediction data
        """
        try:
            # Load current price data from market_data.json if available
            current_price = await self._get_current_price(symbol)
            
            # Generate random predictions based on time frame
            if time_frame == "24h":
                # 24-hour prediction (more conservative)
                change_range = (-0.05, 0.05)  # -5% to +5%
                points = 24  # Hourly points
                time_unit = "hours"
            elif time_frame == "7d":
                # 7-day prediction
                change_range = (-0.15, 0.15)  # -15% to +15%
                points = 7  # Daily points
                time_unit = "days"
            else:  # 30d
                # 30-day prediction (more volatile)
                change_range = (-0.3, 0.3)  # -30% to +30%
                points = 30  # Daily points
                time_unit = "days"
            
            # Generate prediction data
            prediction_data = self._generate_price_prediction(current_price, change_range, points, time_unit)
            
            # Return formatted prediction
            return {
                "symbol": symbol,
                "timeFrame": time_frame,
                "currentPrice": current_price,
                "predictedPriceChange": prediction_data["change"],
                "confidence": prediction_data["confidence"],
                "predictions": prediction_data["points"],
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error predicting price for {symbol}: {str(e)}")
            return {
                "symbol": symbol,
                "timeFrame": time_frame,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def generate_market_insight(self, symbols: Optional[List[str]] = None, category: str = "general") -> Dict[str, Any]:
        """
        Generate market insights based on data analysis
        
        Args:
            symbols: List of cryptocurrency symbols to analyze
            category: Type of insight (general, technical, fundamental, sentiment)
            
        Returns:
            Generated market insight
        """
        try:
            # Default symbols if none provided
            if not symbols:
                symbols = ["BTC", "ETH", "BNB", "SOL", "ADA"]
            
            # Generate insight based on category
            if category == "technical":
                return self._generate_technical_insight(symbols)
            elif category == "fundamental":
                return self._generate_fundamental_insight(symbols)
            elif category == "sentiment":
                return self._generate_sentiment_insight(symbols)
            else:  # general
                # Randomly choose one of the insight types
                insight_type = random.choice(["technical", "fundamental", "sentiment"])
                if insight_type == "technical":
                    return self._generate_technical_insight(symbols)
                elif insight_type == "fundamental":
                    return self._generate_fundamental_insight(symbols)
                else:
                    return self._generate_sentiment_insight(symbols)
            
        except Exception as e:
            logger.error(f"Error generating market insight: {str(e)}")
            return {
                "category": category,
                "symbols": symbols,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def generate_portfolio_recommendation(self, risk_profile: str = "moderate", user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate portfolio recommendations based on risk profile
        
        Args:
            risk_profile: User's risk profile (conservative, moderate, aggressive)
            user_id: Optional user ID for personalized recommendations
            
        Returns:
            Portfolio recommendation
        """
        try:
            # Define allocation strategies based on risk profile
            allocation_strategies = {
                "conservative": {
                    "description": "Lower-risk portfolio focused on established cryptocurrencies with less volatility",
                    "allocation": {
                        "Bitcoin (BTC)": 50,
                        "Ethereum (ETH)": 30,
                        "Stablecoins": 15,
                        "Other Top 10 Cryptos": 5
                    }
                },
                "moderate": {
                    "description": "Balanced portfolio with a mix of established and promising mid-cap cryptocurrencies",
                    "allocation": {
                        "Bitcoin (BTC)": 40,
                        "Ethereum (ETH)": 25,
                        "Top 10 Altcoins": 20,
                        "Mid-cap Altcoins": 10,
                        "Stablecoins": 5
                    }
                },
                "aggressive": {
                    "description": "Higher-risk portfolio seeking growth through emerging cryptocurrencies and new sectors",
                    "allocation": {
                        "Bitcoin (BTC)": 25,
                        "Ethereum (ETH)": 20,
                        "Top 10 Altcoins": 20,
                        "Mid-cap Altcoins": 20,
                        "Small-cap/Emerging Projects": 15
                    }
                }
            }
            
            # Default to moderate if invalid risk profile
            if risk_profile not in allocation_strategies:
                risk_profile = "moderate"
            
            # Get the allocation strategy
            strategy = allocation_strategies[risk_profile]
            
            # Generate specific coin recommendations based on risk profile
            coin_recommendations = self._generate_coin_recommendations(risk_profile)
            
            # Return recommendation
            return {
                "riskProfile": risk_profile,
                "description": strategy["description"],
                "allocation": strategy["allocation"],
                "recommendations": coin_recommendations,
                "disclaimer": "This is a sample recommendation and not financial advice. Always conduct your own research before investing.",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating portfolio recommendation: {str(e)}")
            return {
                "riskProfile": risk_profile,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _get_current_price(self, symbol: str) -> float:
        """Get current price of a cryptocurrency from cached data"""
        try:
            market_data_file = os.path.join(self.data_dir, "market_data.json")
            if os.path.exists(market_data_file):
                with open(market_data_file, 'r') as f:
                    market_data = json.load(f)
                    prices = market_data.get("prices", [])
                    for price in prices:
                        if price.get("symbol", "").upper() == symbol.upper():
                            return price.get("priceUsd", 0)
            
            # Fallback to random but realistic prices for common cryptos
            default_prices = {
                "BTC": random.uniform(50000, 70000),
                "ETH": random.uniform(2500, 4000),
                "BNB": random.uniform(350, 500),
                "SOL": random.uniform(100, 200),
                "ADA": random.uniform(0.3, 0.6),
                "DOT": random.uniform(6, 12),
                "AVAX": random.uniform(20, 40),
                "LINK": random.uniform(15, 25)
            }
            
            return default_prices.get(symbol.upper(), random.uniform(0.5, 100))
            
        except Exception as e:
            logger.error(f"Error getting current price for {symbol}: {str(e)}")
            # Return a random but plausible price
            return random.uniform(1, 1000)
    
    def _generate_price_prediction(self, current_price: float, change_range: Tuple[float, float], 
                                   points: int, time_unit: str) -> Dict[str, Any]:
        """Generate price prediction data"""
        # Overall price change
        overall_change_pct = random.uniform(change_range[0], change_range[1])
        
        # Generate prediction points
        prediction_points = []
        trend_direction = 1 if overall_change_pct > 0 else -1
        
        # Create a somewhat realistic price movement with some randomness
        previous_price = current_price
        for i in range(points):
            # Time point
            if time_unit == "hours":
                time_point = (datetime.now() + timedelta(hours=i+1)).isoformat()
            else:  # days
                time_point = (datetime.now() + timedelta(days=i+1)).isoformat()
            
            # Add some randomness but maintain the overall trend
            point_change = random.uniform(-0.03, 0.03) + (overall_change_pct / points) * trend_direction
            new_price = previous_price * (1 + point_change)
            
            prediction_points.append({
                "timestamp": time_point,
                "price": new_price
            })
            
            previous_price = new_price
        
        # Calculate final change
        final_price = prediction_points[-1]["price"]
        actual_change_pct = (final_price - current_price) / current_price
        
        # Generate a confidence score (higher for more conservative predictions)
        if abs(actual_change_pct) < 0.05:
            confidence = random.uniform(0.85, 0.95)
        elif abs(actual_change_pct) < 0.15:
            confidence = random.uniform(0.7, 0.85)
        else:
            confidence = random.uniform(0.5, 0.7)
        
        return {
            "change": actual_change_pct,
            "confidence": confidence,
            "points": prediction_points
        }
    
    def _generate_technical_insight(self, symbols: List[str]) -> Dict[str, Any]:
        """Generate technical analysis insight"""
        # Pick a random symbol from the list
        symbol = random.choice(symbols)
        
        # Technical patterns
        patterns = [
            "bullish flag", "bearish flag", "double top", "double bottom", 
            "head and shoulders", "inverse head and shoulders", "triangle",
            "wedge", "cup and handle", "MACD crossover", "RSI divergence"
        ]
        
        # Timeframes
        timeframes = ["4-hour", "daily", "weekly"]
        
        # Generate insight text
        pattern = random.choice(patterns)
        timeframe = random.choice(timeframes)
        
        if "bullish" in pattern or pattern in ["double bottom", "inverse head and shoulders", "cup and handle"]:
            sentiment = "positive"
            insight = f"Technical analysis shows a {pattern} pattern forming on the {timeframe} chart for {symbol}, suggesting potential upward momentum. Watch for volume confirmation and key resistance levels."
        elif "bearish" in pattern or pattern in ["double top", "head and shoulders"]:
            sentiment = "negative"
            insight = f"Technical analysis reveals a {pattern} pattern on the {timeframe} chart for {symbol}, indicating possible downward pressure. Monitor support levels and volume for confirmation."
        else:
            sentiment = "neutral"
            insight = f"Technical analysis indicates a {pattern} pattern on the {timeframe} chart for {symbol}. This could lead to a breakout soon, but direction remains uncertain. Watch for volume increases as a signal."
        
        return {
            "category": "technical",
            "symbol": symbol,
            "insight": insight,
            "sentiment": sentiment,
            "confidence": random.uniform(0.6, 0.9),
            "timeframe": timeframe,
            "patternDetected": pattern,
            "timestamp": datetime.now().isoformat()
        }
    
    def _generate_fundamental_insight(self, symbols: List[str]) -> Dict[str, Any]:
        """Generate fundamental analysis insight"""
        # Pick a random symbol from the list
        symbol = random.choice(symbols)
        
        # Fundamental factors
        factors = [
            "developer activity", "adoption metrics", "network growth", 
            "transaction volume", "staking statistics", "token economics",
            "partnership announcement", "protocol upgrade", "regulatory news"
        ]
        
        # Generate insight text
        factor = random.choice(factors)
        
        # Different types of insights based on factor
        if factor in ["developer activity", "adoption metrics", "network growth", "transaction volume", "staking statistics"]:
            direction = random.choice(["increasing", "decreasing"])
            if direction == "increasing":
                sentiment = "positive"
                insight = f"Fundamental analysis shows {factor} has been {direction} for {symbol}, which typically indicates growing network health and potential value accrual long-term."
            else:
                sentiment = "negative"
                insight = f"Fundamental analysis indicates {factor} has been {direction} for {symbol}, which may signal reduced network utilization and could impact long-term value proposition."
        
        elif factor in ["partnership announcement", "protocol upgrade"]:
            sentiment = "positive"
            if factor == "partnership announcement":
                insight = f"Recent {factor} between {symbol} and a major industry player could drive increased adoption and utility, potentially improving fundamental value."
            else:
                insight = f"Upcoming {factor} for {symbol} addresses key scalability and security concerns, which should strengthen its competitive position in the ecosystem."
        
        elif factor == "regulatory news":
            direction = random.choice(["positive", "negative"])
            sentiment = direction
            if direction == "positive":
                insight = f"Recent regulatory developments appear favorable for {symbol}, potentially reducing compliance uncertainty and opening pathways to broader institutional adoption."
            else:
                insight = f"New regulatory challenges may pose headwinds for {symbol}, potentially impacting its use case and adoption in certain markets."
        
        else:  # token economics
            tokenomics_factor = random.choice(["emission schedule", "token distribution", "governance system", "utility model"])
            sentiment = random.choice(["positive", "neutral", "negative"])
            
            if sentiment == "positive":
                insight = f"Analysis of {symbol}'s {tokenomics_factor} reveals strong fundamental design that aligns incentives and could drive sustainable value accrual."
            elif sentiment == "negative":
                insight = f"Concerns about {symbol}'s {tokenomics_factor} may present fundamental challenges to its long-term value proposition compared to competitors."
            else:
                insight = f"{symbol}'s {tokenomics_factor} shows mixed signals with both strengths and areas for improvement compared to similar projects in the space."
        
        return {
            "category": "fundamental",
            "symbol": symbol,
            "insight": insight,
            "sentiment": sentiment,
            "confidence": random.uniform(0.65, 0.85),
            "factorAnalyzed": factor,
            "timestamp": datetime.now().isoformat()
        }
    
    def _generate_sentiment_insight(self, symbols: List[str]) -> Dict[str, Any]:
        """Generate sentiment analysis insight"""
        # Pick a random symbol from the list
        symbol = random.choice(symbols)
        
        # Sentiment data sources
        sources = ["social media", "news analysis", "community forums", "search trends", "developer communities"]
        source = random.choice(sources)
        
        # Generate random sentiment values
        sentiment_score = random.uniform(0, 1)
        sentiment_change = random.uniform(-0.2, 0.2)
        previous_score = max(0, min(1, sentiment_score - sentiment_change))
        
        # Determine sentiment category and insight
        if sentiment_score > 0.7:
            sentiment = "positive"
            if sentiment_change > 0.05:
                insight = f"Sentiment analysis of {source} shows increasingly positive attitudes toward {symbol}, with discussions focusing on recent developments and optimistic price projections."
            else:
                insight = f"Sentiment analysis of {source} reveals consistently positive sentiment for {symbol}, though excitement has plateaued recently."
        elif sentiment_score < 0.4:
            sentiment = "negative"
            if sentiment_change < -0.05:
                insight = f"Sentiment analysis of {source} indicates deteriorating sentiment for {symbol}, with growing concerns about recent performance and competitive pressures."
            else:
                insight = f"Sentiment analysis of {source} shows persistent negative sentiment surrounding {symbol}, though the rate of decline has stabilized."
        else:
            sentiment = "neutral"
            if abs(sentiment_change) < 0.05:
                insight = f"Sentiment analysis of {source} reveals relatively stable and neutral attitudes toward {symbol}, indicating market indecision and mixed perspectives."
            elif sentiment_change > 0:
                insight = f"Sentiment analysis of {source} shows improving but cautious sentiment toward {symbol}, transitioning from negative to more neutral perspectives."
            else:
                insight = f"Sentiment analysis of {source} indicates declining enthusiasm for {symbol}, moving from previously positive to more measured sentiment."
        
        return {
            "category": "sentiment",
            "symbol": symbol,
            "insight": insight,
            "sentiment": sentiment,
            "sentimentScore": sentiment_score,
            "previousScore": previous_score,
            "sentimentChange": sentiment_change,
            "source": source,
            "sampleSize": random.randint(1000, 10000),
            "confidence": random.uniform(0.7, 0.9),
            "timestamp": datetime.now().isoformat()
        }
    
    def _generate_coin_recommendations(self, risk_profile: str) -> List[Dict[str, Any]]:
        """Generate specific coin recommendations based on risk profile"""
        recommendations = []
        
        # Define coin portfolios by risk profile
        portfolios = {
            "conservative": {
                "primary": [
                    {"symbol": "BTC", "name": "Bitcoin", "allocation": 50, "rationale": "Store of value, institutional adoption"},
                    {"symbol": "ETH", "name": "Ethereum", "allocation": 30, "rationale": "Leading smart contract platform, EIP-1559 reducing supply"},
                    {"symbol": "USDC", "name": "USD Coin", "allocation": 15, "rationale": "Stable reserve for market volatility"}
                ],
                "secondary": [
                    {"symbol": "BNB", "name": "Binance Coin", "allocation": 5, "rationale": "Major exchange token with deflationary mechanism"}
                ]
            },
            "moderate": {
                "primary": [
                    {"symbol": "BTC", "name": "Bitcoin", "allocation": 40, "rationale": "Core holding, institutional adoption continuing"},
                    {"symbol": "ETH", "name": "Ethereum", "allocation": 25, "rationale": "Smart contract leader, ongoing scaling improvements"},
                    {"symbol": "SOL", "name": "Solana", "allocation": 10, "rationale": "High-performance Layer 1 with growing ecosystem"}
                ],
                "secondary": [
                    {"symbol": "LINK", "name": "Chainlink", "allocation": 5, "rationale": "Leading oracle solution with cross-chain capabilities"},
                    {"symbol": "DOT", "name": "Polkadot", "allocation": 5, "rationale": "Interoperability solution with strong technical foundation"},
                    {"symbol": "MATIC", "name": "Polygon", "allocation": 5, "rationale": "Ethereum scaling solution with growing adoption"},
                    {"symbol": "AVAX", "name": "Avalanche", "allocation": 5, "rationale": "Fast-finality smart contract platform"},
                    {"symbol": "USDC", "name": "USD Coin", "allocation": 5, "rationale": "Stable reserve for potential opportunities"}
                ]
            },
            "aggressive": {
                "primary": [
                    {"symbol": "BTC", "name": "Bitcoin", "allocation": 25, "rationale": "Core holding despite seeking higher returns"},
                    {"symbol": "ETH", "name": "Ethereum", "allocation": 20, "rationale": "Foundational smart contract platform"},
                    {"symbol": "SOL", "name": "Solana", "allocation": 10, "rationale": "High-growth Layer 1 with expanding ecosystem"}
                ],
                "secondary": [
                    {"symbol": "AVAX", "name": "Avalanche", "allocation": 5, "rationale": "Competitor to Ethereum with growing DeFi ecosystem"},
                    {"symbol": "MATIC", "name": "Polygon", "allocation": 5, "rationale": "Leading Ethereum scaling solution"},
                    {"symbol": "DOT", "name": "Polkadot", "allocation": 5, "rationale": "Interoperability focused with parachain ecosystem"},
                    {"symbol": "LINK", "name": "Chainlink", "allocation": 5, "rationale": "Essential oracle infrastructure"},
                    {"symbol": "ATOM", "name": "Cosmos", "allocation": 5, "rationale": "Interoperability focused with growing IBC ecosystem"},
                    {"symbol": "ALGO", "name": "Algorand", "allocation": 5, "rationale": "High-performance Layer 1 with institutional focus"},
                    {"symbol": "NEAR", "name": "NEAR Protocol", "allocation": 5, "rationale": "Scalable Layer 1 with developer-friendly approach"},
                    {"symbol": "FTM", "name": "Fantom", "allocation": 5, "rationale": "High-performance Layer 1 with growing DeFi ecosystem"},
                    {"symbol": "ONE", "name": "Harmony", "allocation": 5, "rationale": "Sharded blockchain focused on scalability"}
                ]
            }
        }
        
        # Get portfolio for the risk profile
        if risk_profile not in portfolios:
            risk_profile = "moderate"
        
        portfolio = portfolios[risk_profile]
        
        # Add primary recommendations (always included)
        for coin in portfolio["primary"]:
            recommendations.append(coin)
        
        # Add some but not all secondary recommendations to add variety
        if portfolio["secondary"]:
            # For aggressive, include more secondary options
            num_secondary = 3 if risk_profile == "conservative" else (
                4 if risk_profile == "moderate" else 6)
            
            # Randomly select some secondary recommendations
            selected_secondary = random.sample(portfolio["secondary"], 
                                             min(num_secondary, len(portfolio["secondary"])))
            
            for coin in selected_secondary:
                recommendations.append(coin)
        
        return recommendations 