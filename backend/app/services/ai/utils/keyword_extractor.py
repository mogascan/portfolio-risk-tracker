"""
Unified keyword extractor for AI services
"""
import re
import logging
from typing import List, Set, Dict, Any, Optional
import spacy # type: ignore

# Configure logger
logger = logging.getLogger(__name__)

# Common stop words to exclude from keywords
STOP_WORDS = {
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 
    'about', 'in', 'me', 'you', 'he', 'she', 'it', 'we', 'they', 'is', 'am', 'are', 'was', 
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could',
    'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'this', 'that', 'these', 
    'those', 'i', 'of', 'with', 'as', 'if', 'when', 'where', 'why', 'how', 'all', 'any', 
    'both', 'each', 'few', 'more', 'most', 'some', 'such', 'no', 'nor', 'not', 'only', 
    'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'what', 'who', 'news', 'article',
    'articles', 'headlines', 'latest', 'recent', 'get', 'show', 'tell', 'know', 'find',
    'search', 'please', 'thanks', 'information', 'any', 'looking'
}

# Relevant verbs that should be included in keyword extraction
RELEVANT_VERBS = {
    'buy', 'sell', 'trade', 'invest', 'stake', 'mine', 'hold', 'analyze', 'compare',
    'track', 'increase', 'decrease', 'grow', 'fall', 'rise', 'drop', 'crash', 'surge',
    'perform', 'transfer', 'withdraw', 'deposit', 'convert', 'exchange', 'swap'
}

# Cryptocurrency mappings between names and symbols
CRYPTO_MAPPINGS = {
    'bitcoin': 'btc',
    'ethereum': 'eth',
    'cardano': 'ada',
    'solana': 'sol',
    'chainlink': 'link',
    'polkadot': 'dot',
    'ripple': 'xrp',
    'dogecoin': 'doge',
    'binance coin': 'bnb',
    'uniswap': 'uni',
    'avalanche': 'avax',
    'polygon': 'matic',
    'shiba inu': 'shib',
    'tether': 'usdt',
    'usd coin': 'usdc'
}

# Special terms that need exact matching and should be recognized regardless of context
SPECIAL_TERMS = {
    # Crypto-specific terms
    'pump.fun': ['pumpfun', 'pump fun', 'PumpFun'],  
    'ethereum': ['eth', 'ETH'],
    'bitcoin': ['btc', 'BTC'],
    'cardano': ['ada', 'ADA'],
    'solana': ['sol', 'SOL'],
    'chainlink': ['link', 'LINK'],
    'polkadot': ['dot', 'DOT'],
    'ripple': ['xrp', 'XRP'],
    'dogecoin': ['doge', 'DOGE'],
    'binance coin': ['bnb', 'BNB'],
    'uniswap': ['uni', 'UNI'],
    'avalanche': ['avax', 'AVAX'],
    'polygon': ['matic', 'MATIC'],
    'shiba inu': ['shib', 'SHIB'],
    'grayscale': ['gbtc', 'ethe', 'GBTC', 'ETHE'],
    
    # Exchanges and platforms
    'binance': ['binance'],
    'coinbase': ['coinbase'],
    'kraken': ['kraken'],
    'ftx': ['ftx'],
    
    # Technical terms
    'defi': ['defi', 'DeFi'],
    'nft': ['nft', 'NFT', 'NFTs'],
    'dao': ['dao', 'DAO'],
    'web3': ['web3', 'Web3'],
    'metaverse': ['metaverse'],
    
    # Financial terms
    'stablecoin': ['usdt', 'usdc', 'USDT', 'USDC'],
    'yield farming': ['yield', 'farming', 'yield farming'],
    'staking': ['staking', 'stake'],
    'airdrop': ['airdrop'],
    'ico': ['ico', 'ICO'],
    
    # Organizations/People
    'sec': ['SEC'],
    'cftc': ['CFTC'],
    'gary gensler': ['gensler'],
    'elon musk': ['musk', 'elon'],
    'vitalik': ['buterin', 'vitalik'],
    'sam bankman-fried': ['sbf', 'SBF'],
}

# Add time-related keywords extraction function
def extract_time_keywords(query: str) -> List[str]:
    """Extract time-related keywords from the query"""
    time_keywords = []
    
    # Time periods
    time_patterns = {
        'day': [r'\bday\b', r'\btoday\b', r'\bdaily\b'],
        'week': [r'\bweek\b', r'\bweekly\b', r'\blast week\b'],
        'month': [r'\bmonth\b', r'\bmonthly\b', r'\blast month\b'],
        'year': [r'\byear\b', r'\byearly\b', r'\blast year\b', r'\bannual\b'],
        'hour': [r'\bhour\b', r'\bhourly\b'],
        'minute': [r'\bminute\b']
    }
    
    query_lower = query.lower()
    for period, patterns in time_patterns.items():
        for pattern in patterns:
            if re.search(pattern, query_lower):
                time_keywords.append(period)
                break
    
    return time_keywords

# Add spaCy model
nlp = spacy.load("en_core_web_sm")

def extract_keywords_from_query(query: str) -> List[str]:
    """
    Extract keywords from a query using spaCy.
    """
    try:
        # Process the text with spaCy
        doc = nlp(query.lower())
        
        # Extract relevant tokens (nouns, proper nouns, and certain verbs)
        keywords = []
        for token in doc:
            if (token.pos_ in ['NOUN', 'PROPN'] or 
                (token.pos_ == 'VERB' and token.lemma_ in RELEVANT_VERBS)):
                # Skip stop words and tokens that are too short
                if not token.is_stop and len(token.text) > 1:
                    keywords.append(token.lemma_)
        
        # Check for cryptocurrency names and symbols
        crypto_keywords = []
        for name, symbol in CRYPTO_MAPPINGS.items():
            if name.lower() in query.lower() or symbol.lower() in query.lower():
                crypto_keywords.append(name.lower())
        
        # Add time-related keywords
        time_keywords = extract_time_keywords(query)
        
        # Combine all keywords
        all_keywords = list(set(keywords + crypto_keywords + time_keywords))
        
        logger.info(f"Extracted keywords: {all_keywords} from query: {query}")
        return all_keywords
    except Exception as e:
        logger.error(f"Error extracting keywords: {str(e)}")
        return []

def filter_content_by_keywords(content: Dict[str, Any], keywords: List[str]) -> bool:
    """
    Check if content (news article, post, etc.) matches any of the given keywords
    
    Args:
        content: Dictionary containing content data (title, text, etc.)
        keywords: List of keywords to match against
        
    Returns:
        True if content matches any keyword, False otherwise
    """
    if not keywords:
        return True  # If no keywords provided, include all content
        
    # Create a combined text field from common content fields
    combined_text = ""
    
    # Add fields based on common schema patterns
    for field in ['title', 'content', 'summary', 'description', 'text', 'body']:
        if field in content and content[field]:
            field_value = str(content[field]).lower()
            combined_text += " " + field_value
    
    # Check for matches using word boundaries where possible
    for keyword in keywords:
        keyword_lower = keyword.lower()
        
        # Try exact word/phrase match first
        try:
            pattern = r'\b' + re.escape(keyword_lower) + r'\b'
            if re.search(pattern, combined_text):
                logger.debug(f"Word boundary match found for keyword '{keyword_lower}'")
                return True
        except re.error:
            # Fallback to simple contains for complex patterns
            pass
            
        # Check for simple contains as fallback
        if keyword_lower in combined_text:
            logger.debug(f"Simple contains match found for keyword '{keyword_lower}'")
            return True
            
        # For shorter keywords (e.g., BTC), be more strict about matching
        if len(keyword_lower) <= 3:
            # Only match if it's a standalone token
            for token in combined_text.split():
                if token == keyword_lower:
                    logger.debug(f"Exact token match for short keyword '{keyword_lower}'")
                    return True
    
    return False 

# Add main function to demonstrate functionality when run directly
if __name__ == "__main__":
    test_queries = [
        "Show me bitcoin price",
        "What's the current price of Ethereum?",
        "How has Solana performed over the last week?",
        "Compare Bitcoin and Ethereum prices",
        "Add 2 BTC to my portfolio",
        "Show me my transaction history"
    ]
    
    print("Keyword Extractor Test\n" + "="*20)
    for query in test_queries:
        keywords = extract_keywords_from_query(query)
        print(f"\nQuery: {query}")
        print(f"Keywords: {keywords}")