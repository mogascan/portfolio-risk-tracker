"""
News context provider for AI service.

This module provides cryptocurrency and financial news data
as context for AI responses.
"""
import json
import logging
import os
import re
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

from app.core.logging import get_logger
from app.services.ai.context_providers.base import BaseContextProvider
from app.services.news import crypto_news_service, macro_news_service, reddit_service
from app.services.ai.utils.keyword_extractor import extract_keywords_from_query, filter_content_by_keywords
from app.services.ai.intent_classifier import IntentType

# Initialize logger
logger = get_logger(__name__)

class NewsContextProvider(BaseContextProvider):
    """
    News context provider that retrieves and formats cryptocurrency
    and financial news data for AI context.
    """
    
    def __init__(self):
        """Initialize the news context provider with necessary services"""
        super().__init__()
        self.base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
        
        # Define data paths
        self.data_dir = os.path.join(self.base_path, "data")
        self.crypto_news_path = os.path.join(self.data_dir, "crypto_news.json")
        self.macro_news_path = os.path.join(self.data_dir, "macro_news.json")
        self.reddit_news_path = os.path.join(self.data_dir, "reddit_news.json")
        self.bitcoin_news_path = os.path.join(self.data_dir, "bitcoin_news.json")
        self.messari_news_path = os.path.join(self.data_dir, "messari_news.json")
        
        # Maximum number of articles to return per source
        self.max_articles_per_source = 10
        
        # Set default token budgets for each source
        self.token_budgets = {
            "crypto": 1000,
            "macro": 800,
            "reddit": 600,
            "bitcoin": 600,
            "messari": 600
        }
        
        logger.info(f"News context provider initialized with data directory: {self.data_dir}")

    async def get_context(self, query: str, token_budget: int = 3000, intent_type = None) -> Dict[str, Any]:
        """
        Retrieve and format news context based on the query.
        
        Args:
            query: The user's query to target relevant news
            token_budget: Maximum number of tokens to use
            intent_type: Type of intent (optional, for specialized handling)
            
        Returns:
            Dictionary containing news context data
        """
        logger.info(f"Getting news context for query: '{query}' with token budget: {token_budget}")
        
        # Extract keywords from query
        keywords = extract_keywords_from_query(query)
        logger.info(f"Extracted {len(keywords)} keywords: {keywords}")
        
        # Adjust budgets based on total budget
        self._adjust_token_budgets(token_budget)
        
        # Dictionary to store results
        context = {
            "crypto_news": [],
            "macro_news": [],
            "reddit_posts": [],
            "bitcoin_news": [],
            "messari_news": [],
            "keywords_used": keywords,
            "sources_checked": [],
            "metadata": {
                "total_articles_found": 0,
                "total_tokens": 0,
                "query_time": datetime.now().isoformat()
            }
        }
        
        # If this is explicitly a NEWS_QUERY intent, prioritize accordingly
        is_news_query = intent_type == IntentType.NEWS_QUERY if intent_type else False
        
        # Load and filter news from each source
        sources_to_check = self._prioritize_sources(keywords, is_news_query)
        logger.info(f"Checking sources in order: {sources_to_check}")
        
        total_articles_found = 0
        total_tokens_used = 0
        
        for source in sources_to_check:
            # Skip if we've already reached the token budget
            if total_tokens_used >= token_budget:
                logger.info(f"Token budget exceeded ({total_tokens_used}/{token_budget}), stopping source checks")
                break
                
            source_budget = min(self.token_budgets[source], token_budget - total_tokens_used)
            
            if source == "crypto":
                articles = await self._get_crypto_news(keywords, source_budget)
                context["crypto_news"] = articles
                context["sources_checked"].append("crypto")
            elif source == "macro":
                articles = await self._get_macro_news(keywords, source_budget)
                context["macro_news"] = articles
                context["sources_checked"].append("macro")
            elif source == "reddit":
                posts = await self._get_reddit_posts(keywords, source_budget)
                context["reddit_posts"] = posts
                context["sources_checked"].append("reddit")
            elif source == "bitcoin":
                articles = await self._get_bitcoin_news(keywords, source_budget)
                context["bitcoin_news"] = articles
                context["sources_checked"].append("bitcoin")
            elif source == "messari":
                articles = await self._get_messari_news(keywords, source_budget)
                context["messari_news"] = articles
                context["sources_checked"].append("messari")
            
            # Update token count based on the added articles
            source_items = context[f"{source}_news"] if source != "reddit" else context["reddit_posts"]
            source_tokens = self._estimate_tokens_for_items(source_items)
            total_tokens_used += source_tokens
            total_articles_found += len(source_items)
            
            logger.info(f"Added {len(source_items)} items from {source} using ~{source_tokens} tokens")
        
        # Update metadata
        context["metadata"]["total_articles_found"] = total_articles_found
        context["metadata"]["total_tokens"] = total_tokens_used
        
        # Handle the case when no news items are found
        if total_articles_found == 0:
            fallback_message = f"No news articles found matching the keywords: {', '.join(keywords)}"
            context["fallback_message"] = fallback_message
            logger.warning(fallback_message)
        
        logger.info(f"Completed news context retrieval with {total_articles_found} articles using ~{total_tokens_used} tokens")
        return context
    
    def _prioritize_sources(self, keywords: List[str], is_news_query: bool = False) -> List[str]:
        """
        Prioritize which news sources to check based on keywords and intent.
        
        Args:
            keywords: Extracted keywords from query
            is_news_query: Whether this is explicitly a news query
            
        Returns:
            Ordered list of sources to check
        """
        # Default order
        sources = ["crypto", "macro", "reddit", "bitcoin", "messari"]
        
        # Keywords that suggest specific sources
        bitcoin_keywords = {"bitcoin", "btc", "satoshi", "lightning", "halving"}
        crypto_keywords = {"ethereum", "eth", "solana", "sol", "cardano", "ada", "defi", "nft", "altcoin"}
        macro_keywords = {"fed", "interest", "rates", "economy", "inflation", "regulation", "sec"}
        
        # Check for overlaps
        has_bitcoin = any(kw.lower() in bitcoin_keywords for kw in keywords)
        has_crypto = any(kw.lower() in crypto_keywords for kw in keywords)
        has_macro = any(kw.lower() in macro_keywords for kw in keywords)
        
        # Prioritize based on matches
        if has_bitcoin:
            # Move bitcoin to front
            sources.remove("bitcoin")
            sources.insert(0, "bitcoin")
        
        if has_macro:
            # Move macro economics to front/second
            sources.remove("macro")
            if has_bitcoin:
                sources.insert(1, "macro")
            else:
                sources.insert(0, "macro")
        
        if has_crypto and not has_bitcoin:
            # Move crypto to front if not already prioritizing bitcoin
            sources.remove("crypto")
            sources.insert(0, "crypto")
        
        # For explicit news queries with no specific focus, ensure crypto is first
        if is_news_query and not (has_bitcoin or has_macro or has_crypto):
            if "crypto" in sources:
                sources.remove("crypto")
                sources.insert(0, "crypto")
        
        return sources
    
    def _adjust_token_budgets(self, total_budget: int):
        """
        Adjust token budgets for each source based on total budget.
        
        Args:
            total_budget: Total token budget available
        """
        # Default distribution ratios
        ratios = {
            "crypto": 0.35,
            "macro": 0.25,
            "reddit": 0.15,
            "bitcoin": 0.15,
            "messari": 0.10
        }
        
        # Apply ratios to total budget
        for source, ratio in ratios.items():
            self.token_budgets[source] = int(total_budget * ratio)
        
        logger.debug(f"Adjusted token budgets: {self.token_budgets}")
    
    async def _get_crypto_news(self, keywords: List[str], token_budget: int) -> List[Dict[str, Any]]:
        """
        Get crypto news articles matching the keywords.
        
        Args:
            keywords: Keywords to match against articles
            token_budget: Maximum tokens to use
            
        Returns:
            List of matching articles
        """
        try:
            if not os.path.exists(self.crypto_news_path):
                logger.warning(f"Crypto news file not found at {self.crypto_news_path}")
                return []
            
            with open(self.crypto_news_path, 'r') as f:
                all_articles = json.load(f)
            
            logger.info(f"Loaded {len(all_articles)} crypto news articles")
            
            # Filter articles based on keywords
            filtered_articles = []
            for article in all_articles:
                if filter_content_by_keywords(article, keywords):
                    filtered_articles.append(article)
            
            logger.info(f"Found {len(filtered_articles)} crypto news articles matching keywords")
            
            # Sort by timestamp (most recent first)
            filtered_articles.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            
            # Limit to max articles and token budget
            return self._limit_to_budget(filtered_articles, token_budget)
                
        except Exception as e:
            logger.error(f"Error getting crypto news: {str(e)}")
            return []
    
    async def _get_macro_news(self, keywords: List[str], token_budget: int) -> List[Dict[str, Any]]:
        """
        Get macro economic news articles matching the keywords.
        
        Args:
            keywords: Keywords to match against articles
            token_budget: Maximum tokens to use
            
        Returns:
            List of matching articles
        """
        try:
            if not os.path.exists(self.macro_news_path):
                logger.warning(f"Macro news file not found at {self.macro_news_path}")
                return []
            
            with open(self.macro_news_path, 'r') as f:
                all_articles = json.load(f)
            
            logger.info(f"Loaded {len(all_articles)} macro news articles")
            
            # Filter articles based on keywords
            filtered_articles = []
            for article in all_articles:
                if filter_content_by_keywords(article, keywords):
                    filtered_articles.append(article)
            
            logger.info(f"Found {len(filtered_articles)} macro news articles matching keywords")
            
            # Sort by timestamp (most recent first)
            filtered_articles.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            
            # Limit to max articles and token budget
            return self._limit_to_budget(filtered_articles, token_budget)
            
        except Exception as e:
            logger.error(f"Error getting macro news: {str(e)}")
            return []
    
    async def _get_reddit_posts(self, keywords: List[str], token_budget: int) -> List[Dict[str, Any]]:
        """
        Get Reddit posts matching the keywords.
        
        Args:
            keywords: Keywords to match against posts
            token_budget: Maximum tokens to use
            
        Returns:
            List of matching posts
        """
        try:
            if not os.path.exists(self.reddit_news_path):
                logger.warning(f"Reddit news file not found at {self.reddit_news_path}")
                return []
            
            with open(self.reddit_news_path, 'r') as f:
                all_posts = json.load(f)
            
            logger.info(f"Loaded {len(all_posts)} Reddit posts")
            
            # Filter posts based on keywords
            filtered_posts = []
            for post in all_posts:
                if filter_content_by_keywords(post, keywords):
                    filtered_posts.append(post)
            
            logger.info(f"Found {len(filtered_posts)} Reddit posts matching keywords")
            
            # Sort by timestamp (most recent first)
            filtered_posts.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            
            # Limit to max articles and token budget
            return self._limit_to_budget(filtered_posts, token_budget)
            
        except Exception as e:
            logger.error(f"Error getting Reddit posts: {str(e)}")
            return []
    
    async def _get_bitcoin_news(self, keywords: List[str], token_budget: int) -> List[Dict[str, Any]]:
        """
        Get Bitcoin-specific news articles matching the keywords.
        
        Args:
            keywords: Keywords to match against articles
            token_budget: Maximum tokens to use
            
        Returns:
            List of matching articles
        """
        try:
            if not os.path.exists(self.bitcoin_news_path):
                logger.warning(f"Bitcoin news file not found at {self.bitcoin_news_path}")
                return []
            
            with open(self.bitcoin_news_path, 'r') as f:
                all_articles = json.load(f)
            
            logger.info(f"Loaded {len(all_articles)} Bitcoin news articles")
            
            # Filter articles based on keywords
            filtered_articles = []
            for article in all_articles:
                if filter_content_by_keywords(article, keywords):
                    filtered_articles.append(article)
            
            logger.info(f"Found {len(filtered_articles)} Bitcoin news articles matching keywords")
            
            # Sort by timestamp (most recent first)
            filtered_articles.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            
            # Limit to max articles and token budget
            return self._limit_to_budget(filtered_articles, token_budget)
            
        except Exception as e:
            logger.error(f"Error getting Bitcoin news: {str(e)}")
            return []
    
    async def _get_messari_news(self, keywords: List[str], token_budget: int) -> List[Dict[str, Any]]:
        """
        Get Messari research articles matching the keywords.
        
        Args:
            keywords: Keywords to match against articles
            token_budget: Maximum tokens to use
            
        Returns:
            List of matching articles
        """
        try:
            if not os.path.exists(self.messari_news_path):
                logger.warning(f"Messari news file not found at {self.messari_news_path}")
                return []
            
            with open(self.messari_news_path, 'r') as f:
                all_articles = json.load(f)
            
            logger.info(f"Loaded {len(all_articles)} Messari research articles")
            
            # Filter articles based on keywords
            filtered_articles = []
            for article in all_articles:
                if filter_content_by_keywords(article, keywords):
                    filtered_articles.append(article)
            
            logger.info(f"Found {len(filtered_articles)} Messari articles matching keywords")
            
            # Sort by timestamp (most recent first)
            filtered_articles.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            
            # Limit to max articles and token budget
            return self._limit_to_budget(filtered_articles, token_budget)
            
        except Exception as e:
            logger.error(f"Error getting Messari news: {str(e)}")
            return []
    
    def _limit_to_budget(self, items: List[Dict[str, Any]], token_budget: int) -> List[Dict[str, Any]]:
        """
        Limit items to fit within token budget.
        
        Args:
            items: List of items to limit
            token_budget: Maximum tokens to use
            
        Returns:
            Limited list of items
        """
        if not items:
            return []
            
        # First limit to max articles
        items = items[:self.max_articles_per_source]
        
        # Estimate token usage
        current_tokens = self._estimate_tokens_for_items(items)
        
        # If within budget, return all items
        if current_tokens <= token_budget:
            return items
            
        # Otherwise, reduce items until within budget
        while items and current_tokens > token_budget:
            items.pop()
            current_tokens = self._estimate_tokens_for_items(items)
        
        logger.info(f"Limited to {len(items)} items within token budget of {token_budget}")
        return items
    
    def _estimate_tokens_for_items(self, items: List[Dict[str, Any]]) -> int:
        """
        Estimate tokens used by a list of items.
        
        Args:
            items: List of items
            
        Returns:
            Estimated token count
        """
        token_count = 0
        
        for item in items:
            # Include title and content (or body)
            title = item.get("title", "")
            content = item.get("content", "") or item.get("body", "")
            source = item.get("source", "")
            
            # Estimate tokens (roughly 4 chars per token)
            item_tokens = (len(title) + len(content) + len(source)) // 4
            token_count += item_tokens
        
        return token_count

    async def get_fallback_context(self, query: str, token_budget: int) -> Dict[str, Any]:
        """
        Provide fallback context when main data sources are unavailable.
        
        Args:
            query: The user's query
            token_budget: Maximum tokens to use
            
        Returns:
            Dictionary with basic news data
        """
        logger.info("Using fallback news context")
        start_time = datetime.now()
        
        # Extract potential crypto mentions for more targeted fallback
        key_terms = self._extract_key_terms(query)
        
        # Create mock news with mention of the extracted terms if possible
        fallback_crypto_news = []
        if key_terms:
            for term in key_terms[:2]:  # Limit to first 2 terms
                fallback_crypto_news.append({
                    "id": f"fallback-{term.lower()}",
                    "title": f"Recent developments in {term} market trends",
                    "content": f"This is a placeholder for {term} news content that would normally be retrieved from news services.",
                    "url": "",
                    "source": "Fallback News Provider",
                    "timestamp": datetime.now().isoformat(),
                    "sentiment": "NEUTRAL"
                })
        
        if not fallback_crypto_news:
            # Generic fallback if no specific terms
            fallback_crypto_news = [{
                "id": "fallback-crypto",
                "title": "Recent cryptocurrency market overview",
                "content": "This is a placeholder for cryptocurrency news content that would normally be retrieved from news services.",
                "url": "",
                "source": "Fallback News Provider",
                "timestamp": datetime.now().isoformat(),
                "sentiment": "NEUTRAL"
            }]
        
        # Simple fallback data
        fallback_data = {
            "news": {
                "crypto": fallback_crypto_news,
                "macro": {
                    "markets": [{
                        "id": "fallback-market",
                        "title": "Global market update",
                        "content": "This is a placeholder for market news content.",
                        "source": "Fallback News Provider",
                        "timestamp": datetime.now().isoformat()
                    }]
                },
                "reddit": [],
                "lastUpdated": datetime.now().isoformat(),
                "_note": "Using fallback news data as the primary news sources were unavailable.",
                "_metadata": {
                    "source": "news",
                    "status": "fallback",
                    "query_time": datetime.now().isoformat(),
                    "key_terms": key_terms,
                    "reason": "Error retrieving news data from services"
                }
            }
        }
        
        # Estimate token size
        estimated_tokens = self.estimate_tokens(str(fallback_data))
        
        # Calculate execution time and update metadata
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds()
        fallback_data["news"]["_metadata"]["execution_time_seconds"] = execution_time
        fallback_data["news"]["_metadata"]["estimated_tokens"] = estimated_tokens
        fallback_data["news"]["_metadata"]["token_budget"] = token_budget
        
        logger.info(f"Fallback news context generation completed in {execution_time:.2f} seconds, " 
                    f"estimated tokens: {estimated_tokens}")
        
        return fallback_data

    def _extract_key_terms(self, query: str) -> List[str]:
        """
        Extract key terms from the query for filtering news.
        
        Args:
            query: The user query text
            
        Returns:
            List of key terms for news filtering
        """
        import re
        
        # Log the original query
        logger.info(f"Extracting key terms from query: '{query}'")
        
        # Common crypto symbols that should be preserved even if they're short
        crypto_symbols = ["btc", "eth", "xrp", "bnb", "sol", "ada", "dot", "link", "ton", "leo", "avax", 
                          "matic", "doge", "shib", "ltc", "bch", "etc", "xmr", "xlm", "algo", "near", 
                          "ftm", "dai", "usdc", "usdt"]
        
        # Common stop words to filter out
        stop_words = ["any", "with", "the", "and", "for", "that", "have", "this", "from", "has", "had",
                      "not", "are", "but", "what", "which", "when", "news", "headlines", "about", "latest"]
        
        # Normalize: tolerate punctuation in special cases like "pump.fun" or "Web3.js"
        # First, find special terms that might contain dots or hyphens
        # This improved regex will catch "pump.fun" more reliably
        special_terms = re.findall(r'\b\w+[.\-_]\w+\b', query.lower())
        logger.info(f"Found special terms with periods/hyphens: {special_terms}")
        
        # If no special terms found with standard regex, try alternative pattern
        if not special_terms and ('.' in query or '-' in query or '_' in query):
            # Fallback more lenient regex
            special_terms = re.findall(r'[a-z0-9]+[.\-_][a-z0-9]+', query.lower())
            logger.info(f"Found special terms with fallback regex: {special_terms}")
        
        # Special case for 'pump.fun' which might not be detected by the regex
        if 'pump.fun' in query.lower() and 'pump.fun' not in special_terms:
            special_terms.append('pump.fun')
            logger.info(f"Added pump.fun specifically: {special_terms}")
        
        # Clean the query but keep special terms intact
        clean = re.sub(r'[^\w\s]', ' ', query.lower())
        logger.info(f"After cleaning punctuation: '{clean}'")
        
        # Add back special terms
        for term in special_terms:
            if term not in clean:
                clean += " " + term
                logger.info(f"Added back special term: '{term}' -> '{clean}'")
        
        # Tokenize: extract words, keeping special terms
        words = [w.strip() for w in clean.split() if w.strip()]
        logger.info(f"Tokenized words: {words}")
        
        # Filter tokens
        filtered_words = []
        for word in words:
            # Always keep crypto symbols regardless of length
            if word.lower() in crypto_symbols:
                filtered_words.append(word.lower())
                logger.info(f"Keeping crypto symbol: {word}")
                continue
                
            # Always keep special terms with dots or hyphens
            if "." in word or "-" in word:
                filtered_words.append(word.lower())
                logger.info(f"Keeping special term with dot/hyphen: {word}")
                continue
                
            # Keep words that are at least 3 chars and not stop words
            if len(word) >= 3 and word.lower() not in stop_words:
                filtered_words.append(word.lower())
                logger.info(f"Keeping regular word: {word}")
            else:
                logger.info(f"Filtered out word (too short or stopword): {word}")
        
        # Log the extracted keywords
        if filtered_words:
            logger.info(f"Extracted keywords from query: {filtered_words}")
        else:
            logger.warning(f"No keywords extracted from query: '{query}'")
            
        return filtered_words

    def find_relevant_news(self, key_terms: List[str], max_results: int = 5) -> List[Dict]:
        """
        Find news articles that match the key terms
        
        Args:
            key_terms: List of keywords to search for in news
            max_results: Maximum number of results to return
            
        Returns:
            List of matched news articles
        """
        matches = []
        checked_urls = set()  # To avoid duplicates
        
        # Normalize key terms for better matching
        normalized_key_terms = []
        for term in key_terms:
            # If the term contains special characters (like pump.fun),
            # add both with and without special chars
            if any(c in term for c in ".-_"):
                # Add original term with special chars
                normalized_key_terms.append(term)
                # Also add version with special chars replaced with spaces
                clean_term = re.sub(r'[.\-_]', ' ', term).strip()
                if clean_term and clean_term != term:
                    normalized_key_terms.append(clean_term)
                # Add version with special chars removed completely
                compact_term = re.sub(r'[.\-_]', '', term)
                if compact_term and compact_term != term and compact_term != clean_term:
                    normalized_key_terms.append(compact_term)
            else:
                normalized_key_terms.append(term)
        
        # Check all crypto news first
        for article in self.crypto_news:
            if len(matches) >= max_results:
                break
                
            # Skip if we've already included this URL
            url = article.get('url', '')
            if url in checked_urls:
                continue
                
            # Build a single text combining title and summary for matching
            title = article.get('title', '')
            summary = article.get('summary', '')
            content = article.get('content', '')
            all_text = f"{title} {summary} {content}"
            
            # Check if any term matches in the concatenated text
            is_match = False
            matching_terms = []
            
            for term in normalized_key_terms:
                # Use the class method instead of defining a local function
                if self.term_matches_text(term, all_text):
                    is_match = True
                    matching_terms.append(term)
                    
            if is_match:
                matches.append(article)
                checked_urls.add(url)
                logger.info(f"News match found for terms [{', '.join(matching_terms)}]: {title}")
                
        # Then check macro news
        for category, articles in self.macro_news.items():
            if len(matches) >= max_results:
                break
                
            for article in articles:
                if len(matches) >= max_results:
                    break
                    
                # Skip if we've already included this URL
                url = article.get('url', '')
                if url in checked_urls:
                    continue
                    
                # Build a single text combining title and summary for matching
                title = article.get('title', '')
                summary = article.get('summary', '')
                content = article.get('content', '')
                all_text = f"{title} {summary} {content}"
                
                # Check if any term matches in the concatenated text
                is_match = False
                matching_terms = []
                
                for term in normalized_key_terms:
                    # Use the class method instead of defining a local function
                    if self.term_matches_text(term, all_text):
                        is_match = True
                        matching_terms.append(term)
                        
                if is_match:
                    matches.append(article)
                    checked_urls.add(url)
                    logger.info(f"Macro news match found for terms [{', '.join(matching_terms)}] in category {category}: {title}")
        
        return matches 

    def term_matches_text(self, term: str, text: str) -> bool:
        """
        Check if a term matches in a text, using various matching strategies.
        
        Args:
            term: The search term
            text: The text to search in
            
        Returns:
            True if the term matches, False otherwise
        """
        if not term or not text:
            return False
            
        # Check for exact match (case insensitive)
        if term.lower() in text.lower():
            return True
            
        # Handle terms with special characters like "pump.fun"
        if any(c in term for c in ".-_"):
            # Try different variations of the term
            # 1. Original with special chars (already checked above)
            # 2. Replace special chars with spaces
            spaced_term = re.sub(r'[.\-_]', ' ', term).strip()
            if spaced_term and spaced_term.lower() in text.lower():
                return True
                
            # 3. Remove special chars completely
            compact_term = re.sub(r'[.\-_]', '', term)
            if compact_term and compact_term.lower() in text.lower():
                return True
                
            # 4. Try as separate words (for terms like "pump.fun" -> match "pump" AND "fun")
            parts = re.split(r'[.\-_]', term)
            if len(parts) > 1:
                all_parts_match = True
                for part in parts:
                    if part and not part.lower() in text.lower():
                        all_parts_match = False
                        break
                if all_parts_match:
                    return True
        
        # If we get here, no match was found
        return False 