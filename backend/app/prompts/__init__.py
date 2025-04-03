"""
Prompt templates for AI interactions
"""

# Import the modules that should be directly accessible when importing from app.prompts
try:
    # Import intent classifier to convert intents to prompt templates
    from app.services.ai.intent_classifier import IntentType
    from app.services.ai.prompt_templates import get_prompt_for_intent, create_custom_prompt, INTENT_PROMPTS
    
    # Optional: also expose all prompt templates directly
    from app.services.ai.prompt_templates import (
        GENERIC_SYSTEM_PROMPT,
        MARKET_PRICE_PROMPT,
        MARKET_ANALYSIS_PROMPT,
        NEWS_QUERY_PROMPT,
        PORTFOLIO_ANALYSIS_PROMPT,
        RISK_ASSESSMENT_PROMPT,
        TAX_ANALYSIS_PROMPT,
        TRADE_HISTORY_PROMPT
    )
except ImportError as e:
    print(f"Unable to import prompt modules: {str(e)}")
    
    # Fallback definition to prevent crashes
    def get_prompt_for_intent(intent_type):
        return "You are a cryptocurrency portfolio assistant. Please help the user with their query."
