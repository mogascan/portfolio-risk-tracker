#!/usr/bin/env python3
"""
Script to manually refresh news data
"""
import os
import sys
import logging

# Add the parent directory to sys.path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def main():
    """Main function to refresh news data"""
    try:
        logger.info("Starting news refresh...")
        
        # Import the update_feeds module
        from app.update_feeds import main as update_feeds
        
        # Run the update
        success = update_feeds()
        
        if success:
            logger.info("News data refreshed successfully")
        else:
            logger.error("Failed to refresh news data")
            
    except Exception as e:
        logger.error(f"Error during news refresh: {e}")
        return False
        
    return True

if __name__ == "__main__":
    main() 