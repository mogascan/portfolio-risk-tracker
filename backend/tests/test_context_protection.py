"""
Test script for context fallback protection.

This script tests the fallback protection mechanisms to ensure that empty 
context results are properly detected and handled instead of sending them to OpenAI.

Usage:
    python test_context_protection.py
"""
import asyncio
import json
import logging
import os
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

# Enable debug mode for AI
os.environ['DEBUG_AI'] = 'true'

# Test problematic queries that might return generic answers
TEST_QUERIES = [
    "What is the price of PEPE?",  # MARKET_PRICE intent
    "What is the value of my portfolio?",  # PORTFOLIO_ANALYSIS intent
    "Analyze the current market trends",  # MARKET_ANALYSIS intent 
    "Tell me about my Sonic and Euler holdings",  # PORTFOLIO_ANALYSIS intent with specific coins
    "What's happening with Bitcoin?",  # Could be NEWS_QUERY or MARKET_PRICE
]

async def test_context_fallback(query: str, service: OpenAIService) -> Dict[str, Any]:
    """Test the context fallback protection for a query"""
    logger.info(f"Testing context fallback protection for: '{query}'")
    
    try:
        # Get the intent
        intent_type, confidence = service.intent_classifier.classify(query)
        logger.info(f"Classified as: {intent_type.name} with confidence: {confidence:.2f}")
        
        # Get the context data
        context_data, context_sources = await service._get_context_for_intent(query, intent_type, 5000)
        
        # Check for critical issues
        has_critical_issues = False
        if "_meta" in context_data:
            meta = context_data["_meta"]
            if "missing_critical_sources" in meta and meta["missing_critical_sources"]:
                has_critical_issues = True
                logger.warning(f"Missing critical sources: {meta['missing_critical_sources']}")
            
            if "warning" in meta:
                logger.warning(f"Context warning: {meta['warning']}")
        
        # Format the context
        context_text = service._format_context_for_prompt(context_data)
        context_length = len(context_text)
        
        return {
            "query": query,
            "intent": intent_type.name,
            "confidence": confidence,
            "context_sources": context_sources,
            "context_length": context_length,
            "has_critical_issues": has_critical_issues,
            "would_fail": has_critical_issues or context_length < 50,
            "context_text_sample": context_text[:100] + "..." if context_text else "No context text"
        }
    except Exception as e:
        logger.error(f"Error in test_context_fallback: {str(e)}")
        return {
            "query": query,
            "error": str(e),
            "would_fail": True
        }

async def test_mock_provider_failure():
    """Test what happens when a context provider fails completely"""
    logger.info("Testing mock provider failure...")
    
    # Create a service with mocked providers that fail
    service = OpenAIService()
    
    # Mock the context providers to simulate failure
    async def mock_fail(*args, **kwargs):
        raise ValueError("Mock provider failure")
    
    service.market_context_provider.get_context = mock_fail
    service.market_context_provider.get_fallback_context = mock_fail
    
    try:
        # Try a market query that should now fail
        result = await test_context_fallback("What is Bitcoin price?", service)
        logger.info(f"Mock failure test result: {json.dumps(result, indent=2)}")
    except Exception as e:
        logger.error(f"Mock failure test error: {str(e)}")

async def main():
    """Run the test script"""
    logger.info("Starting context fallback protection tests...")
    
    # Initialize the OpenAI service
    service = OpenAIService()
    
    # Test each query
    results = []
    for query in TEST_QUERIES:
        try:
            result = await test_context_fallback(query, service)
            results.append(result)
            logger.info(f"Test completed for: '{query}'")
            logger.info(f"Intent: {result.get('intent', 'unknown')}, Would fail: {result.get('would_fail', True)}")
            logger.info("-" * 80)
        except Exception as e:
            logger.error(f"Error testing query '{query}': {str(e)}")
    
    # Test mock provider failure
    await test_mock_provider_failure()
    
    # Print summary
    logger.info("\n===== TEST SUMMARY =====")
    success_count = 0
    fail_count = 0
    
    for result in results:
        would_fail = result.get("would_fail", True)
        if would_fail:
            fail_count += 1
        else:
            success_count += 1
            
        logger.info(f"Query: '{result['query']}'")
        logger.info(f"  Intent: {result.get('intent', 'unknown')}")
        logger.info(f"  Would fail: {would_fail}")
        if "context_length" in result:
            logger.info(f"  Context length: {result['context_length']} chars")
        if "error" in result:
            logger.info(f"  Error: {result['error']}")
        logger.info("-" * 80)
    
    logger.info(f"Total tests: {len(results)}, Would pass: {success_count}, Would fail: {fail_count}")
    logger.info("The 'would fail' queries would return an error to the user instead of a generic response.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Test interrupted")
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
        raise 