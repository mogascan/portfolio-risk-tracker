"""
Test suite for AI pipeline components.

This file contains tests for verifying the functionality of all AI pipeline components:
- Intent Classification
- Keyword Extraction
- Context Providers
- OpenAI Service
"""
import pytest
import os
import json
from unittest.mock import patch, MagicMock, AsyncMock
from typing import Dict, List, Any

from app.services.ai.intent_classifier import IntentClassifier, IntentType
from app.services.ai.utils.keyword_extractor import extract_keywords_from_query
from app.services.ai.context_providers import (
    MarketContextProvider, 
    NewsContextProvider, 
    PortfolioContextProvider
)
from app.services.ai.openai_service import OpenAIService

# Fixtures for test data
@pytest.fixture
def sample_queries():
    """Sample queries for different intents"""
    return {
        "market_price": [
            "What is the price of Bitcoin?",
            "How much is Ethereum worth?",
            "Show me the current BTC price"
        ],
        "news_query": [
            "Any news about crypto today?",
            "What's the latest on Ethereum?",
            "Show me headlines about Bitcoin"
        ],
        "portfolio_analysis": [
            "How is my portfolio performing?",
            "What's my best performing asset?",
            "Show me my crypto holdings"
        ]
    }

@pytest.fixture
def sample_context_data():
    """Sample context data for testing"""
    return {
        "market": {
            "crypto_prices": {
                "bitcoin": {
                    "price": 55000,
                    "change_24h": 2.5
                }
            },
            "market_indexes": {},
            "_metadata": {
                "tokens_used": 100
            }
        },
        "news": {
            "crypto_news": [
                {
                    "title": "Bitcoin reaches new high",
                    "url": "https://example.com/news/1",
                    "source": "CryptoNews"
                }
            ],
            "_metadata": {
                "tokens_used": 150
            }
        },
        "portfolio": {
            "overview": {
                "total_value": 10000,
                "daily_change_percent": 1.5
            },
            "holdings": [
                {
                    "symbol": "BTC",
                    "name": "Bitcoin",
                    "amount": 0.5,
                    "value": 27500
                }
            ],
            "_metadata": {
                "tokens_used": 200
            }
        }
    }

@pytest.fixture
def mock_openai_response():
    """Mock response from OpenAI API"""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "This is a test response from the AI."
    return mock_response

# Intent Classification Tests
class TestIntentClassifier:
    """Tests for the Intent Classifier"""
    
    def test_intent_classifier_initialization(self):
        """Test that IntentClassifier initializes correctly"""
        classifier = IntentClassifier()
        assert classifier is not None
        assert hasattr(classifier, 'market_patterns')
        assert hasattr(classifier, 'news_patterns')
        assert hasattr(classifier, 'portfolio_patterns')
    
    def test_market_price_intent_classification(self, sample_queries):
        """Test classification of market price queries"""
        classifier = IntentClassifier()
        for query in sample_queries["market_price"]:
            intent_type, confidence = classifier.classify(query)
            assert intent_type == IntentType.MARKET_PRICE
            assert confidence > 0.5
    
    def test_news_query_intent_classification(self, sample_queries):
        """Test classification of news queries"""
        classifier = IntentClassifier()
        for query in sample_queries["news_query"]:
            intent_type, confidence = classifier.classify(query)
            assert intent_type == IntentType.NEWS_QUERY
            assert confidence > 0.5
    
    def test_portfolio_intent_classification(self, sample_queries):
        """Test classification of portfolio queries"""
        classifier = IntentClassifier()
        for query in sample_queries["portfolio_analysis"]:
            intent_type, confidence = classifier.classify(query)
            assert intent_type == IntentType.PORTFOLIO_ANALYSIS
            assert confidence > 0.5
    
    def test_fallback_to_general_query(self):
        """Test fallback to general query for unclear requests"""
        classifier = IntentClassifier()
        unclear_query = "Hello there how are you today"
        intent_type, confidence = classifier.classify(unclear_query)
        assert intent_type == IntentType.GENERAL_QUERY
        assert confidence < 0.5

# Keyword Extraction Tests
class TestKeywordExtraction:
    """Tests for the keyword extraction functionality"""
    
    def test_extract_keywords_from_query(self):
        """Test basic keyword extraction"""
        query = "Show me the price of Bitcoin and Ethereum"
        keywords = extract_keywords_from_query(query)
        assert "price" in keywords
        assert "bitcoin" in keywords
        assert "ethereum" in keywords
    
    def test_extract_keywords_with_special_characters(self):
        """Test keyword extraction with special characters and multi-word phrases"""
        query = "Any news about pump.fun or Bitcoin?"
        keywords = extract_keywords_from_query(query)
        assert "bitcoin" in keywords
        # Should handle the special case with dot
        assert any(k for k in keywords if "pump" in k)
    
    def test_stopword_filtering(self):
        """Test that stopwords are properly filtered"""
        query = "Tell me about the price of the Bitcoin"
        keywords = extract_keywords_from_query(query)
        assert "the" not in keywords
        assert "tell" not in keywords
        assert "me" not in keywords
        assert "about" not in keywords
        assert "price" in keywords
        assert "bitcoin" in keywords

# Context Provider Tests
class TestContextProviders:
    """Tests for the context providers"""
    
    @pytest.mark.asyncio
    async def test_market_context_provider_initialization(self):
        """Test MarketContextProvider initialization"""
        provider = MarketContextProvider()
        assert provider is not None
    
    @pytest.mark.asyncio
    async def test_news_context_provider_initialization(self):
        """Test NewsContextProvider initialization"""
        provider = NewsContextProvider()
        assert provider is not None
    
    @pytest.mark.asyncio
    async def test_portfolio_context_provider_initialization(self):
        """Test PortfolioContextProvider initialization"""
        provider = PortfolioContextProvider()
        assert provider is not None
    
    @pytest.mark.asyncio
    @patch('app.services.ai.context_providers.market.MarketContextProvider._get_coin_data')
    async def test_market_context_provider_get_context(self, mock_get_coin_data, sample_context_data):
        """Test MarketContextProvider.get_context method"""
        mock_get_coin_data.return_value = sample_context_data["market"]["crypto_prices"]["bitcoin"]
        
        provider = MarketContextProvider()
        context = await provider.get_context("What is the price of Bitcoin?", token_budget=1000)
        
        assert context is not None
        assert "_metadata" in context
        assert "token_budget" in context["_metadata"]
        assert context["_metadata"]["token_budget"] == 1000
    
    @pytest.mark.asyncio
    @patch('app.services.ai.context_providers.market.MarketContextProvider._get_coin_data')
    async def test_market_context_provider_fallback(self, mock_get_coin_data):
        """Test MarketContextProvider fallback functionality"""
        mock_get_coin_data.side_effect = Exception("Test exception")
        
        provider = MarketContextProvider()
        context = await provider.get_fallback_context("What is the price of Bitcoin?", token_budget=500)
        
        assert context is not None
        assert "market" in context
        assert "_metadata" in context["market"]
        assert "status" in context["market"]["_metadata"]
        assert context["market"]["_metadata"]["status"] == "fallback"

# OpenAI Service Tests
class TestOpenAIService:
    """Tests for the OpenAI Service"""
    
    def test_openai_service_initialization(self):
        """Test OpenAIService initialization"""
        with patch('app.services.ai.openai_service.settings', MagicMock(OPENAI_API_KEY='test_key')):
            service = OpenAIService()
            assert service is not None
            assert service.api_key == 'test_key'
    
    @pytest.mark.asyncio
    @patch('app.services.ai.openai_service.AsyncOpenAI')
    async def test_process_with_context(self, mock_async_openai, sample_context_data, mock_openai_response):
        """Test process_with_context method"""
        # Setup the mock
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_openai_response
        mock_async_openai.return_value = mock_client
        
        with patch('app.services.ai.openai_service.settings', MagicMock(OPENAI_API_KEY='test_key')):
            service = OpenAIService()
            service.async_client = mock_client
            
            messages = [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "What is the price of Bitcoin?"}
            ]
            
            result = await service.process_with_context(
                messages=messages,
                context=sample_context_data,
                model="gpt-4-turbo-preview"
            )
            
            assert result is not None
            assert "answer" in result
            assert result["answer"] == "This is a test response from the AI."
            assert "metadata" in result
            assert "context_sources" in result["metadata"]
            assert "market" in result["metadata"]["context_sources"]
            assert "news" in result["metadata"]["context_sources"]
            assert "portfolio" in result["metadata"]["context_sources"]
    
    @pytest.mark.asyncio
    @patch('app.services.ai.openai_service.AsyncOpenAI')
    async def test_error_handling_in_process_with_context(self, mock_async_openai):
        """Test error handling in process_with_context method"""
        # Setup the mock to raise an exception
        mock_client = AsyncMock()
        mock_client.chat.completions.create.side_effect = Exception("Test exception")
        mock_async_openai.return_value = mock_client
        
        with patch('app.services.ai.openai_service.settings', MagicMock(OPENAI_API_KEY='test_key')):
            service = OpenAIService()
            service.async_client = mock_client
            
            messages = [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "What is the price of Bitcoin?"}
            ]
            
            result = await service.process_with_context(
                messages=messages,
                context={},
                model="gpt-4-turbo-preview"
            )
            
            assert result is not None
            assert "answer" in result
            assert "error" in result["answer"].lower()
            assert "metadata" in result
            assert result["metadata"]["intent"] == "ERROR"

# Integration Tests
class TestAIPipelineIntegration:
    """Integration tests for the AI pipeline"""
    
    @pytest.mark.asyncio
    @patch('app.services.ai.openai_service.AsyncOpenAI')
    async def test_end_to_end_pipeline(self, mock_async_openai, mock_openai_response, sample_context_data):
        """Test end-to-end pipeline flow from intent classification to OpenAI response"""
        # Setup the mock
        mock_client = AsyncMock()
        mock_client.chat.completions.create.return_value = mock_openai_response
        mock_async_openai.return_value = mock_client
        
        # Mock the context providers
        market_provider = MagicMock()
        market_provider.get_context = AsyncMock(return_value=sample_context_data["market"])
        
        news_provider = MagicMock()
        news_provider.get_context = AsyncMock(return_value=sample_context_data["news"])
        
        portfolio_provider = MagicMock()
        portfolio_provider.get_context = AsyncMock(return_value=sample_context_data["portfolio"])
        
        with patch('app.services.ai.openai_service.settings', MagicMock(OPENAI_API_KEY='test_key')):
            # Create services
            service = OpenAIService()
            service.async_client = mock_client
            service.market_context_provider = market_provider
            service.news_context_provider = news_provider
            service.portfolio_context_provider = portfolio_provider
            
            # Test query
            query = "What is the price of Bitcoin?"
            
            # Classify intent
            classifier = IntentClassifier()
            intent_type, confidence = classifier.classify(query)
            
            # Get context (using our already mocked data)
            context_data, _ = await service._get_context_for_intent(query, intent_type, 3000)
            
            # Format context
            context_text = service._format_context_for_prompt(context_data)
            
            # Create messages
            messages = [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": f"Context: {context_text}\n\nQuery: {query}"}
            ]
            
            # Get response
            result = await service.process_with_context(
                messages=messages,
                context=context_data,
                model="gpt-4-turbo-preview"
            )
            
            # Verify the result
            assert result is not None
            assert "answer" in result
            assert result["answer"] == "This is a test response from the AI."
            assert "metadata" in result
``` 