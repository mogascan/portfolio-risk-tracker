import json
import os
import sys
from pathlib import Path

# Get the absolute path to the backend data directory
data_dir = Path(__file__).parent.parent / "data"
news_file = data_dir / "crypto_news.json"

# Read existing news data
try:
    with open(news_file, 'r', encoding='utf-8') as f:
        news_data = json.load(f)
    print(f"Read from file: {news_file}")
except Exception as e:
    print(f"Error reading news data: {e}")
    news_data = []

# Create a test article about Grayscale
grayscale_article = {
    "id": "grayscale_record_inflows_2025",
    "title": "Grayscale Bitcoin Trust Reports Record Inflows as ETF Conversion Plans Finalized",
    "link": "https://example.com/grayscale-record-inflows-2025",
    "url": "https://example.com/grayscale-record-inflows-2025",
    "timestamp": "03/31/2025, 09:15:00 AM",
    "content": "Grayscale Investments announced today that its Bitcoin Trust (GBTC) has seen record inflows of over $1.2 billion in the past month, reflecting growing institutional demand for Bitcoin exposure. The asset manager also confirmed that regulatory approvals for converting the trust to an ETF structure are in their final stages. CEO Michael Sonnenshein stated, 'The record inflows demonstrate the market's confidence in Bitcoin as an asset class and in Grayscale's products specifically. We're excited to soon offer our investors the additional benefits of an ETF structure.' The company reported that assets under management for GBTC now exceed $45 billion, representing approximately 3.5% of all Bitcoin in circulation. Analysts suggest the potential ETF conversion could dramatically increase accessibility to Bitcoin investment for traditional financial institutions and retail investors through conventional brokerage accounts.",
    "source": "CRYPTO FINANCE DIGEST",
    "sentiment": "POSITIVE",
    "relatedCoins": ["BTC", "ETH"]
}

# Insert the test article at the beginning of the news data
news_data.insert(0, grayscale_article)
print(f"Added Grayscale test article to news data")

# Write the updated news data back to the file
try:
    with open(news_file, 'w', encoding='utf-8') as f:
        json.dump(news_data, f)
    print(f"Successfully wrote updated news data with Grayscale article to {news_file}")
except Exception as e:
    print(f"Error writing updated news data: {e}")

# Verify the article was added by reading the file again
try:
    with open(news_file, 'r', encoding='utf-8') as f:
        updated_data = json.load(f)
    
    # Check if our article is in the data
    found = False
    for article in updated_data[:10]:  # Check first 10 articles
        if article.get("id") == "grayscale_record_inflows_2025":
            found = True
            print(f"Verification successful: Grayscale article found in the news data")
            break
    
    if not found:
        print(f"WARNING: Grayscale article was not found in the news data after writing")
        
except Exception as e:
    print(f"Error verifying updated news data: {e}") 