"""
Context registry for AI service.

This module provides a central registry for managing context providers and their metadata,
enabling coordinated context loading based on intent classification.
"""
import logging
from typing import Dict, List, Optional, Any, Type
from enum import Enum

from app.core.logging import get_logger
from app.services.ai.intent_classifier import IntentType

# Initialize logger
logger = get_logger(__name__)

class ContextPriority(Enum):
    """Priority levels for context sources"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class ContextRegistry:
    """
    Central registry for context providers that manages loading and prioritization
    of context data based on the detected intent of a user query.
    """
    
    def __init__(self):
        """Initialize the context registry"""
        self._providers = {}
        self._intent_mappings = {}
        self._token_budget = 3000  # Default token budget
        logger.info("ContextRegistry initialized")
    
    def register_provider(self, 
                          provider_id: str, 
                          provider_instance: Any,
                          supports_intents: List[IntentType],
                          priority: ContextPriority = ContextPriority.MEDIUM,
                          max_tokens: int = 1000) -> None:
        """
        Register a context provider with the registry.
        
        Args:
            provider_id: Unique identifier for the provider
            provider_instance: Instance of a context provider
            supports_intents: List of intent types this provider can serve
            priority: Priority level for this provider
            max_tokens: Maximum tokens this provider should use
        """
        if provider_id in self._providers:
            logger.warning(f"Provider {provider_id} already registered, replacing")
            
        self._providers[provider_id] = {
            "instance": provider_instance,
            "priority": priority,
            "max_tokens": max_tokens
        }
        
        # Map intents to this provider
        for intent in supports_intents:
            if intent not in self._intent_mappings:
                self._intent_mappings[intent] = []
            self._intent_mappings[intent].append(provider_id)
        
        logger.info(f"Registered provider '{provider_id}' for intents: {[i.name for i in supports_intents]}")
    
    def get_providers_for_intent(self, intent_type: IntentType) -> List[Dict[str, Any]]:
        """
        Get all context providers that support a given intent.
        
        Args:
            intent_type: The intent type to get providers for
            
        Returns:
            List of provider instances sorted by priority
        """
        # Include general query providers for all intents
        provider_ids = self._intent_mappings.get(intent_type, []).copy()
        general_providers = self._intent_mappings.get(IntentType.GENERAL_QUERY, [])
        
        # Combine specific and general providers without duplicates
        for provider_id in general_providers:
            if provider_id not in provider_ids:
                provider_ids.append(provider_id)
        
        # Get provider details
        providers = []
        for provider_id in provider_ids:
            if provider_id in self._providers:
                providers.append({
                    "id": provider_id,
                    "instance": self._providers[provider_id]["instance"],
                    "priority": self._providers[provider_id]["priority"],
                    "max_tokens": self._providers[provider_id]["max_tokens"]
                })
        
        # Sort by priority (highest first)
        providers.sort(key=lambda x: x["priority"].value, reverse=True)
        
        logger.info(f"Found {len(providers)} providers for intent {intent_type.name}")
        return providers
    
    async def get_context_for_intent(self, 
                                intent_type: IntentType, 
                                query: str, 
                                token_budget: Optional[int] = None) -> Dict[str, Any]:
        """
        Get consolidated context from all relevant providers for an intent.
        
        Args:
            intent_type: The intent type to load context for
            query: The user's query for targeted context
            token_budget: Optional override for the token budget
            
        Returns:
            Dictionary with combined context data
        """
        if token_budget is not None:
            self._token_budget = token_budget
            
        providers = self.get_providers_for_intent(intent_type)
        
        # Track how much of the budget we've used
        remaining_budget = self._token_budget
        combined_context = {}
        
        for provider in providers:
            # Skip if we're out of budget
            if remaining_budget <= 0:
                logger.warning(f"Token budget exhausted, skipping provider {provider['id']}")
                continue
                
            # Allocate a portion of the remaining budget based on priority
            if provider["priority"] == ContextPriority.CRITICAL:
                # Critical providers get up to 50% of remaining budget
                token_allocation = min(provider["max_tokens"], int(remaining_budget * 0.5))
            elif provider["priority"] == ContextPriority.HIGH:
                # High priority gets up to 30% of remaining budget
                token_allocation = min(provider["max_tokens"], int(remaining_budget * 0.3))
            elif provider["priority"] == ContextPriority.MEDIUM:
                # Medium priority gets up to 15% of remaining budget
                token_allocation = min(provider["max_tokens"], int(remaining_budget * 0.15))
            else:
                # Low priority gets up to 5% of remaining budget
                token_allocation = min(provider["max_tokens"], int(remaining_budget * 0.05))
            
            # Get context from this provider
            try:
                logger.info(f"Fetching context from provider {provider['id']} with {token_allocation} tokens")
                context_data = await provider["instance"].get_context(query, token_allocation)
                
                # Add to combined context, allowing override of same keys based on priority
                if context_data:
                    for key, value in context_data.items():
                        # Only override if higher priority
                        if key in combined_context:
                            logger.info(f"Key '{key}' already exists in context, provider {provider['id']} priority: {provider['priority'].value}")
                        
                        # Always add new or higher priority data
                        combined_context[key] = value
                    
                    # Roughly estimate token usage and deduct from budget
                    # This is a very simple approximation
                    estimated_tokens = sum(len(str(v)) // 4 for v in context_data.values())
                    remaining_budget -= estimated_tokens
                    logger.info(f"Provider {provider['id']} used ~{estimated_tokens} tokens, remaining: {remaining_budget}")
                else:
                    logger.warning(f"Provider {provider['id']} returned no context data")
            
            except Exception as e:
                logger.error(f"Error getting context from provider {provider['id']}: {str(e)}")
        
        # Add metadata about the context
        combined_context["_meta"] = {
            "intent": intent_type.name,
            "providers_used": [p["id"] for p in providers if p["id"] in combined_context],
            "remaining_budget": remaining_budget
        }
        
        return combined_context
    
    def set_token_budget(self, budget: int) -> None:
        """
        Set the token budget for context loading.
        
        Args:
            budget: New token budget
        """
        self._token_budget = budget
        logger.info(f"Token budget set to {budget}")
    
    def get_provider(self, provider_id: str) -> Optional[Any]:
        """
        Get a specific provider instance by ID.
        
        Args:
            provider_id: ID of the provider
            
        Returns:
            Provider instance or None if not found
        """
        if provider_id in self._providers:
            return self._providers[provider_id]["instance"]
        return None 