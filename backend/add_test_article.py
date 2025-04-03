import json
import os
from datetime import datetime

# Path to the data directory
data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
crypto_news_file = os.path.join(data_dir, "crypto_news.json")

# Test article from the screenshot
test_article = {
    "id": "price-analysis-ada-test",
    "title": "Price analysis 4/2: BTC, ETH, XRP, BNB, SOL, DOGE, ADA, TON, LINK, LEO",
    "summary": "Analysis of top cryptocurrencies including Bitcoin, Ethereum, Ripple, Binance Coin, Solana, Dogecoin, Cardano, TON, ChainLink, and LEO.",
    "content": "Price analysis of top cryptocurrencies shows mixed market signals. BTC remains above key support levels, while ETH faces resistance. ADA (Cardano) is showing signs of potential breakout according to analysts. The market overall remains cautious as investors await regulatory clarity.",
    "url": "https://cointelegraph.com/news/price-analysis-4-2-btc-eth-xrp-bnb-sol-doge-ada-ton-link-leo",
    "source": "COINTELEGRAPH",
    "timestamp": datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p"),
    "sentiment": "NEUTRAL"
}

# Second test article with pump.fun reference
pump_article = {
    "id": "pump-fun-test",
    "title": "Pump.fun launches lending platform to finance memecoin buys",
    "summary": "Pump.fun has launched a new lending platform that allows users to finance memecoin purchases.",
    "content": "The popular memecoin launchpad Pump.fun has expanded its offerings by introducing a lending platform designed to help users finance their memecoin investments. This move marks a significant evolution in the memecoin ecosystem.",
    "url": "https://cointelegraph.com/news/pump-fun-launches-defi-lender-finance-memecoin-buys",
    "source": "COINTELEGRAPH",
    "timestamp": datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p"),
    "sentiment": "POSITIVE"
}

def add_test_articles():
    """Add test articles to crypto_news.json"""
    try:
        # Read existing news
        if os.path.exists(crypto_news_file):
            with open(crypto_news_file, 'r') as f:
                crypto_news = json.load(f)
        else:
            crypto_news = []
            
        # Check if the crypto_news is a list
        if not isinstance(crypto_news, list):
            crypto_news = []
            
        # Add test articles at the beginning
        crypto_news.insert(0, test_article)
        crypto_news.insert(0, pump_article)
        
        # Write back to file
        with open(crypto_news_file, 'w') as f:
            json.dump(crypto_news, f, indent=2)
            
        print(f"Added test articles to {crypto_news_file}")
        
    except Exception as e:
        print(f"Error adding test articles: {str(e)}")

if __name__ == "__main__":
    add_test_articles() 