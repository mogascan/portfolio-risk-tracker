"""
Script to generate realistic news data into the cache files.
This simulates the process of fetching real RSS feeds and allows
the frontend to display "real" data from the backend API.
"""
import json
import os
import sys
import logging
import random
from datetime import datetime, timedelta

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.news.crypto_news_service import CryptoNewsService
from app.services.news.macro_news_service import MacroNewsService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Sample realistic news data
CRYPTO_NEWS_DATA = [
    {
        "title": "Bitcoin Trading Above $64K as Market Eyes End to First Quarter",
        "summary": "Bitcoin was changing hands at around $64,200 on Sunday as a relatively calm first quarter for the BTC price ends and financial markets enter the second quarter.",
        "source": "COINDESK",
        "timestamp": datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p'),
        "sentiment": "NEUTRAL",
        "url": "https://www.coindesk.com/markets/2023/03/31/bitcoin-trading-above-64k-as-market-eyes-end-to-first-quarter/"
    },
    {
        "title": "Ethereum's Dencun Upgrade Has Been Live for a Month. What's Next?",
        "summary": "ETH prices are up 6% in the month since the upgrade, though that's partly connected to broader strength in crypto markets during that time.",
        "source": "COINDESK",
        "timestamp": (datetime.now() - timedelta(hours=2)).strftime('%m/%d/%Y, %I:%M:%S %p'),
        "sentiment": "POSITIVE",
        "url": "https://www.coindesk.com/tech/2023/03/31/ethereums-dencun-upgrade-has-been-live-for-a-month-whats-next/"
    },
    {
        "title": "Solana Looks to Break $180 Level as Network Activity Climbs",
        "summary": "Solana's SOL token has been testing the $180 resistance level amid rising network activity and increased developer interest.",
        "source": "COINTELEGRAPH",
        "timestamp": (datetime.now() - timedelta(hours=5)).strftime('%m/%d/%Y, %I:%M:%S %p'),
        "sentiment": "POSITIVE",
        "url": "https://cointelegraph.com/news/solana-price-analysis-sol-eyes-180-level-as-network-statistics-improve"
    },
    {
        "title": "Crypto Exchange Regulatory Pressure Intensifies in US and Europe",
        "summary": "Regulators on both sides of the Atlantic are increasing scrutiny of cryptocurrency exchanges, with new guidelines expected in coming months.",
        "source": "DECRYPT",
        "timestamp": (datetime.now() - timedelta(hours=8)).strftime('%m/%d/%Y, %I:%M:%S %p'),
        "sentiment": "NEGATIVE",
        "url": "https://decrypt.co/news/crypto-exchanges-face-regulatory-pressure"
    },
    {
        "title": "NFT Trading Volume Rebounds, OpenSea Sees 34% Monthly Increase",
        "summary": "After months of declining activity, NFT markets are showing signs of recovery with major marketplace OpenSea reporting significant growth in transaction volume.",
        "source": "THE BLOCK",
        "timestamp": (datetime.now() - timedelta(hours=10)).strftime('%m/%d/%Y, %I:%M:%S %p'),
        "sentiment": "POSITIVE",
        "url": "https://www.theblock.co/post/nft-trading-volume-recovery-analysis"
    }
]

# Bitcoin specific news
BITCOIN_NEWS_DATA = [
    {
        "title": "Bitcoin ETFs Record $1.2 Billion Inflows, Largest Daily Volume Since Launch",
        "summary": "The spot Bitcoin ETFs saw their largest single-day inflows since launching in January, signaling continued institutional interest.",
        "source": "BITCOIN MAGAZINE",
        "timestamp": datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p'),
        "sentiment": "POSITIVE",
        "url": "https://bitcoinmagazine.com/markets/bitcoin-etfs-record-inflows"
    },
    {
        "title": "Lightning Network Capacity Reaches All-Time High of 6,500 BTC",
        "summary": "Bitcoin's Layer 2 scaling solution continues to grow as adoption increases among merchants and payment processors.",
        "source": "COINDESK",
        "timestamp": (datetime.now() - timedelta(hours=3)).strftime('%m/%d/%Y, %I:%M:%S %p'),
        "sentiment": "POSITIVE",
        "url": "https://www.coindesk.com/tech/2023/03/31/lightning-network-capacity-reaches-ath/"
    },
    {
        "title": "Bitcoin Mining Difficulty Drops 4.2% in Latest Adjustment",
        "summary": "The Bitcoin network experienced its first difficulty decrease in 10 weeks, providing some relief to miners amid rising energy costs.",
        "source": "COINTELEGRAPH",
        "timestamp": (datetime.now() - timedelta(hours=7)).strftime('%m/%d/%Y, %I:%M:%S %p'),
        "sentiment": "NEUTRAL",
        "url": "https://cointelegraph.com/news/bitcoin-mining-difficulty-drops-after-consecutive-increases"
    }
]

# Macro economic news data
MACRO_NEWS_DATA = {
    "business": [
        {
            "title": "US Economy Adds 350,000 Jobs in March, Exceeding Expectations",
            "summary": "The latest employment report shows stronger-than-expected job growth, suggesting economic resilience despite high interest rates.",
            "source": "GOOGLE NEWS BUSINESS",
            "timestamp": datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p'),
            "sentiment": "POSITIVE",
            "url": "https://www.cnbc.com/2023/03/31/us-economy-jobs-report-march-2023.html"
        },
        {
            "title": "Amazon Announces New AI Initiatives, $4 Billion Investment",
            "summary": "The tech giant is expanding its artificial intelligence capabilities with major investments in data centers and research facilities.",
            "source": "GOOGLE NEWS BUSINESS",
            "timestamp": (datetime.now() - timedelta(hours=4)).strftime('%m/%d/%Y, %I:%M:%S %p'),
            "sentiment": "POSITIVE",
            "url": "https://www.reuters.com/technology/amazon-ai-investment-expansion"
        }
    ],
    "technology": [
        {
            "title": "Apple's AI Push: Leaked Documents Reveal Generative AI for iOS 18",
            "summary": "Apple is preparing to integrate advanced AI features across its device ecosystem in upcoming software updates expected this fall.",
            "source": "GOOGLE NEWS TECHNOLOGY",
            "timestamp": datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p'),
            "sentiment": "POSITIVE",
            "url": "https://www.theverge.com/apple-ai-features-ios18-leak"
        },
        {
            "title": "Quantum Computing Breakthrough: Scientists Achieve 99.9% Error Correction",
            "summary": "Researchers have demonstrated a new error correction technique that brings practical quantum computing applications significantly closer to reality.",
            "source": "GOOGLE NEWS TECHNOLOGY",
            "timestamp": (datetime.now() - timedelta(hours=5)).strftime('%m/%d/%Y, %I:%M:%S %p'),
            "sentiment": "POSITIVE",
            "url": "https://www.scientificamerican.com/article/quantum-error-correction-milestone/"
        }
    ],
    "federal-reserve": [
        {
            "title": "Fed Chair Powell Hints at Potential Rate Cuts Later This Year",
            "summary": "In his latest speech, Federal Reserve Chairman Jerome Powell suggested the central bank may begin easing monetary policy if inflation continues to moderate.",
            "source": "GOOGLE NEWS - FEDERAL RESERVE",
            "timestamp": datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p'),
            "sentiment": "POSITIVE",
            "url": "https://www.bloomberg.com/news/articles/powell-rate-cut-hints-2023"
        },
        {
            "title": "Federal Reserve Releases Minutes from March Meeting, Shows Internal Debate",
            "summary": "The recently released minutes reveal disagreement among Fed officials about the appropriate pace and timing of interest rate reductions.",
            "source": "GOOGLE NEWS - FEDERAL RESERVE",
            "timestamp": (datetime.now() - timedelta(hours=6)).strftime('%m/%d/%Y, %I:%M:%S %p'),
            "sentiment": "NEUTRAL",
            "url": "https://www.wsj.com/articles/federal-reserve-minutes-march-meeting-2023"
        }
    ],
    "financial-markets": [
        {
            "title": "S&P 500 Closes at Record High as Tech Earnings Impress",
            "summary": "Strong quarterly results from major technology companies pushed the index to new heights, extending the 2023 bull market rally.",
            "source": "GOOGLE NEWS - FINANCIAL MARKETS",
            "timestamp": datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p'),
            "sentiment": "POSITIVE",
            "url": "https://www.marketwatch.com/story/sp-500-record-tech-earnings-2023"
        },
        {
            "title": "Bond Market Volatility Increases as Yield Curve Steepens",
            "summary": "Treasury yields are experiencing heightened fluctuations as traders reassess the Federal Reserve's policy trajectory and inflation outlook.",
            "source": "GOOGLE NEWS - FINANCIAL MARKETS",
            "timestamp": (datetime.now() - timedelta(hours=3)).strftime('%m/%d/%Y, %I:%M:%S %p'),
            "sentiment": "NEUTRAL",
            "url": "https://www.ft.com/content/bond-market-volatility-yield-curve"
        }
    ],
    "us-news": [
        {
            "title": "Infrastructure Bill Implementation Accelerates with New Projects",
            "summary": "The Biden administration announced funding for dozens of new infrastructure projects across multiple states, focusing on transportation and clean energy.",
            "source": "GOOGLE NEWS - US",
            "timestamp": datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p'),
            "sentiment": "POSITIVE",
            "url": "https://www.cnn.com/2023/03/31/politics/infrastructure-projects-funding"
        },
        {
            "title": "Housing Market Shows Signs of Recovery as Mortgage Rates Stabilize",
            "summary": "New home sales increased for the third consecutive month as mortgage rates stopped climbing and builder confidence improved.",
            "source": "GOOGLE NEWS - US",
            "timestamp": (datetime.now() - timedelta(hours=7)).strftime('%m/%d/%Y, %I:%M:%S %p'),
            "sentiment": "POSITIVE",
            "url": "https://www.cnbc.com/2023/03/31/housing-market-recovery-mortgage-rates"
        }
    ],
    "global": [
        {
            "title": "EU Finalizes Digital Markets Act Implementation, Big Tech Faces New Rules",
            "summary": "The European Union's landmark tech regulation comes into full effect, imposing strict requirements on major digital platforms regarding competition and data use.",
            "source": "GOOGLE NEWS - GLOBAL",
            "timestamp": datetime.now().strftime('%m/%d/%Y, %I:%M:%S %p'),
            "sentiment": "NEUTRAL",
            "url": "https://www.politico.eu/article/eu-digital-markets-act-implementation"
        },
        {
            "title": "Global Supply Chain Resilience Improves as Container Shipping Costs Normalize",
            "summary": "International trade logistics are showing signs of sustained recovery as pandemic-related disruptions fade and shipping capacity increases.",
            "source": "GOOGLE NEWS - GLOBAL",
            "timestamp": (datetime.now() - timedelta(hours=8)).strftime('%m/%d/%Y, %I:%M:%S %p'),
            "sentiment": "POSITIVE",
            "url": "https://www.reuters.com/business/global-supply-chains-container-shipping"
        }
    ]
}

def generate_unique_id(item, prefix):
    """Generate a unique ID for a news item"""
    source = item.get('source', 'unknown').lower().replace(' ', '-')
    title_hash = hash(item.get('title', 'notitle')) % 10000
    return f"{prefix}-{source}-{title_hash}"

def main():
    logger.info("Starting cache data generation...")
    
    # Initialize services
    crypto_service = CryptoNewsService()
    macro_service = MacroNewsService()
    
    # Generate crypto news data
    crypto_news = []
    for item in CRYPTO_NEWS_DATA:
        news_item = item.copy()
        news_item['id'] = generate_unique_id(item, 'crypto')
        crypto_news.append(news_item)
    
    # Add Bitcoin specific news
    bitcoin_news = []
    for item in BITCOIN_NEWS_DATA:
        news_item = item.copy()
        news_item['id'] = generate_unique_id(item, 'bitcoin')
        bitcoin_news.append(news_item)
    
    # Generate macro news data
    macro_news = []
    for category, items in MACRO_NEWS_DATA.items():
        for item in items:
            news_item = item.copy()
            news_item['id'] = generate_unique_id(item, f'macro-{category}')
            news_item['category'] = category
            macro_news.append(news_item)
    
    # Save to crypto news cache
    crypto_service.news_database = crypto_news
    crypto_service.save_to_cache()
    logger.info(f"Generated and saved {len(crypto_news)} crypto news items to cache")
    
    # Save Bitcoin news to crypto service
    # In a real app, these would be separate, but for our demo we'll add to the same service
    crypto_service.bitcoin_news = bitcoin_news
    
    # Create data directory if it doesn't exist
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # Save Bitcoin news to a separate cache file
    bitcoin_cache_path = os.path.join(data_dir, 'bitcoin_news.json')
    with open(bitcoin_cache_path, 'w') as f:
        json.dump(bitcoin_news, f)
    logger.info(f"Generated and saved {len(bitcoin_news)} Bitcoin news items to cache")
    
    # Save to macro news cache
    macro_service.news_database = macro_news
    macro_service.save_to_cache()
    logger.info(f"Generated and saved {len(macro_news)} macro news items to cache")
    
    logger.info("Cache data generation completed!")

if __name__ == "__main__":
    main() 