"""
Test script for a specific AI query.

This script tests the entire query processing pipeline, including the OpenAI API call,
to see the fully constructed answer with real context data.

Usage:
    python test_query.py "What is the price of PEPE?"
"""
import asyncio
import json
import logging
import sys
from typing import Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Import needed modules
from app.services.ai.openai_service import OpenAIService

async def test_query(query: str) -> Dict[str, Any]:
    """Process a query with the OpenAI service and return the full response"""
    logger.info(f"Processing query: '{query}'")
    
    # Initialize the service
    service = OpenAIService()
    
    # Process the query
    response = await service.process_query(
        query=query,
        conversation_id="test_conversation",
        model="gpt-4-turbo-preview",
        token_budget=6000
    )
    
    return response

def display_response(response: Dict[str, Any]) -> None:
    """Display the response in a formatted way"""
    if not response:
        logger.error("No response received")
        return
    
    print("\n" + "=" * 80)
    print(f"ANSWER:")
    print("-" * 80)
    print(response.get("answer", "No answer in response"))
    print("=" * 80)
    
    print("\nMETADATA:")
    print("-" * 80)
    metadata = response.get("metadata", {})
    for key, value in metadata.items():
        # Format complex values
        if isinstance(value, (dict, list)):
            value = json.dumps(value, indent=2)
        print(f"{key}: {value}")

async def main():
    """Run the test script"""
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} \"Your query here\"")
        print(f"\nExample: python {sys.argv[0]} \"What is the price of PEPE?\"")
        return
    
    query = sys.argv[1]
    
    try:
        response = await test_query(query)
        display_response(response)
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Test interrupted")
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
        raise 