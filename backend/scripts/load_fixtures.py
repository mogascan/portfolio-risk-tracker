#!/usr/bin/env python3
"""
Script to load fixtures into the data directory
"""
import os
import json
import shutil
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_fixtures():
    """Load fixture data into the data directory"""
    try:
        # Get the base directories
        script_dir = os.path.dirname(os.path.abspath(__file__))
        backend_dir = os.path.dirname(script_dir)
        fixtures_dir = os.path.join(backend_dir, 'fixtures')
        data_dir = os.path.join(backend_dir, 'data')
        
        # Ensure data directory exists
        os.makedirs(data_dir, exist_ok=True)
        
        # Load crypto news fixture
        crypto_news_fixture = os.path.join(fixtures_dir, 'crypto_news.json')
        crypto_news_data = os.path.join(data_dir, 'crypto_news.json')
        
        if os.path.exists(crypto_news_fixture):
            # Read the fixture data
            with open(crypto_news_fixture, 'r') as f:
                fixture_data = json.load(f)
                
            # Check if there's existing data to merge
            existing_data = []
            if os.path.exists(crypto_news_data):
                try:
                    with open(crypto_news_data, 'r') as f:
                        existing_data = json.load(f)
                except json.JSONDecodeError:
                    logger.warning(f"Couldn't decode existing crypto_news.json, overwriting it")
            
            # Check if the fixture items are already in the existing data
            fixture_titles = [item.get('title', '') for item in fixture_data]
            
            # Filter out any existing items with the same titles
            filtered_existing = [item for item in existing_data 
                                if item.get('title', '') not in fixture_titles]
            
            # Combine and save
            combined_data = fixture_data + filtered_existing
            
            with open(crypto_news_data, 'w') as f:
                json.dump(combined_data, f, indent=2)
                
            logger.info(f"Added {len(fixture_data)} fixture items to crypto_news.json")
        else:
            logger.warning(f"Crypto news fixture not found at {crypto_news_fixture}")
            
        return True
    except Exception as e:
        logger.error(f"Error loading fixtures: {e}")
        return False

if __name__ == "__main__":
    success = load_fixtures()
    if success:
        logger.info("Successfully loaded fixtures")
    else:
        logger.error("Failed to load fixtures")
        exit(1) 