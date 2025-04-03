"""
Test script for AI context providers and intent classification.

This script tests the context providers for various intents, particularly focusing on 
MARKET_ANALYSIS and PORTFOLIO_ANALYSIS intents to ensure they return proper context.

Usage:
    python test_ai_context.py
"""
import asyncio
import json
import logging
import sys
from typing import Dict, Any, List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Import needed modules
from app.services.ai.intent_classifier import IntentClassifier, IntentType
from app.services.ai.openai_service import OpenAIService
from app.services.ai.context_providers import MarketContextProvider, PortfolioContextProvider
from app.services.ai.prompt_templates import get_prompt_for_intent, MARKET_ANALYSIS_PROMPT, PORTFOLIO_ANALYSIS_PROMPT

# Test queries that previously returned generic answers
TEST_QUERIES = [
    "What is the price of PEPE?",
    "What is the total value of my portfolio?", 
    "How much Sonic and Euler is my portfolio worth?",
    "What's happening with Bitcoin today?",
    "Analyze the current market trends"
]

async def test_context_provider(query: str, service: OpenAIService) -> Dict[str, Any]:
    """Test the context providers for a query"""
    # First classify the intent
    intent_type, confidence = service.intent_classifier.classify(query)
    logger.info(f"Query: '{query}' classified as {intent_type.name} with confidence {confidence:.2f}")
    
    # Get the appropriate context
    context_data, context_sources = await service._get_context_for_intent(query, intent_type, 5000)
    
    # Get the appropriate prompt
    prompt = get_prompt_for_intent(intent_type)
    prompt_name = f"{intent_type.name}_PROMPT"
    
    # Format the context
    context_text = service._format_context_for_prompt(context_data)
    
    return {
        "query": query,
        "intent": intent_type.name,
        "confidence": confidence,
        "prompt_name": prompt_name,
        "context_sources": context_sources,
        "meta": context_data.get("_meta", {}),
        "context_length": len(context_text),
        "has_market_data": "market" in context_data,
        "has_portfolio_data": "portfolio" in context_data,
        "has_news_data": "news" in context_data,
        "context_text_sample": context_text[:300] + "..." if context_text else "No context text"
    }

async def main():
    """Run the test script"""
    logger.info("Initializing OpenAI service...")
    service = OpenAIService()
    
    # Ensure context registry is initialized
    if not hasattr(service, 'context_registry'):
        logger.warning("Context registry not initialized, initializing now...")
        service._initialize_context_registry()
    
    # Print available intents
    logger.info(f"Available intents: {[i.name for i in IntentType]}")
    
    # Print MARKET_ANALYSIS prompt (brief sample)
    logger.info(f"MARKET_ANALYSIS prompt: {MARKET_ANALYSIS_PROMPT[:150]}...")
    
    # Print PORTFOLIO_ANALYSIS prompt (brief sample)
    logger.info(f"PORTFOLIO_ANALYSIS prompt: {PORTFOLIO_ANALYSIS_PROMPT[:150]}...")
    
    # Test each query
    results = []
    for query in TEST_QUERIES:
        try:
            result = await test_context_provider(query, service)
            results.append(result)
            logger.info(f"Test completed for: '{query}'")
            logger.info(f"Intent: {result['intent']}, Sources: {result['context_sources']}")
            logger.info(f"Context length: {result['context_length']} chars")
            logger.info("-" * 80)
        except Exception as e:
            logger.error(f"Error testing query '{query}': {str(e)}")
    
    # Print overall summary
    logger.info("\n===== TEST SUMMARY =====")
    for result in results:
        intent = result["intent"]
        sources = ", ".join(result["context_sources"]) if result["context_sources"] else "None"
        logger.info(f"Query: '{result['query']}'")
        logger.info(f"  Intent: {intent} ({result['confidence']:.2f})")
        logger.info(f"  Context sources: {sources}")
        logger.info(f"  Context length: {result['context_length']} chars")
        logger.info(f"  Has market data: {result['has_market_data']}")
        logger.info(f"  Has portfolio data: {result['has_portfolio_data']}")
        logger.info(f"  Has news data: {result['has_news_data']}")
        logger.info("-" * 80)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Test interrupted")
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
        raise 