# Import each prompt file individually with detailed error handling
try:
    # Attempt to import system prompt
    try:
        from .system_prompt import system_prompt
        print("Successfully imported system_prompt")
    except ImportError as e:
        print(f"Error importing system_prompt: {str(e)}")
        system_prompt = "You are a crypto portfolio assistant providing helpful information."
    
    # Attempt to import asset evaluation prompt
    try:
        from .asset_evaluation_prompt import asset_evaluation_prompt
        print("Successfully imported asset_evaluation_prompt")
    except ImportError as e:
        print(f"Error importing asset_evaluation_prompt: {str(e)}")
        asset_evaluation_prompt = "You are a cryptocurrency asset evaluation expert."
    
    # Attempt to import tax analysis prompt
    try:
        from .tax_analysis_prompt import tax_analysis_prompt
        print("Successfully imported tax_analysis_prompt")
    except ImportError as e:
        print(f"Error importing tax_analysis_prompt: {str(e)}")
        tax_analysis_prompt = "You are a cryptocurrency tax analysis expert."
    
    # Attempt to import news summarization prompt
    try:
        from .news_summarization_prompt import news_summarization_prompt
        print("Successfully imported news_summarization_prompt")
    except ImportError as e:
        print(f"Error importing news_summarization_prompt: {str(e)}")
        news_summarization_prompt = "You are a cryptocurrency news summarization expert."
    
    # Attempt to import portfolio rebalancing prompt
    try:
        from .portfolio_rebalancing_prompt import portfolio_rebalancing_prompt
        print("Successfully imported portfolio_rebalancing_prompt")
    except ImportError as e:
        print(f"Error importing portfolio_rebalancing_prompt: {str(e)}")
        portfolio_rebalancing_prompt = "You are a cryptocurrency portfolio rebalancing expert."
    
    # Attempt to import performance review prompt
    try:
        from .performance_review_prompt import performance_review_prompt
        print("Successfully imported performance_review_prompt")
    except ImportError as e:
        print(f"Error importing performance_review_prompt: {str(e)}")
        performance_review_prompt = "You are a cryptocurrency performance review expert."
    
    # Attempt to import trade history prompt
    try:
        from .trade_history_prompt import trade_history_prompt
        print("Successfully imported trade_history_prompt")
    except ImportError as e:
        print(f"Error importing trade_history_prompt: {str(e)}")
        trade_history_prompt = "You are a cryptocurrency trade history expert."
    
    # Attempt to import risk alert prompt
    try:
        from .risk_alert_prompt import risk_alert_prompt
        print("Successfully imported risk_alert_prompt")
    except ImportError as e:
        print(f"Error importing risk_alert_prompt: {str(e)}")
        risk_alert_prompt = "You are a cryptocurrency risk alert expert."
    
    # Attempt to import wallet analysis prompt
    try:
        from .wallet_analysis_prompt import wallet_analysis_prompt
        print("Successfully imported wallet_analysis_prompt")
    except ImportError as e:
        print(f"Error importing wallet_analysis_prompt: {str(e)}")
        wallet_analysis_prompt = "You are a cryptocurrency wallet analysis expert."
        
except Exception as e:
    print(f"General error in prompt imports: {str(e)}")
    
    # Define fallback prompts if imports fail
    system_prompt = "You are a crypto portfolio assistant providing helpful information."
    asset_evaluation_prompt = "You are a cryptocurrency asset evaluation expert."
    tax_analysis_prompt = "You are a cryptocurrency tax analysis expert."
    news_summarization_prompt = "You are a cryptocurrency news summarization expert."
    portfolio_rebalancing_prompt = "You are a cryptocurrency portfolio rebalancing expert."
    performance_review_prompt = "You are a cryptocurrency performance review expert."
    trade_history_prompt = "You are a cryptocurrency trade history expert."
    risk_alert_prompt = "You are a cryptocurrency risk alert expert."
    wallet_analysis_prompt = "You are a cryptocurrency wallet analysis expert."

print("Setting up PROMPT_REGISTRY with keys:")
PROMPT_REGISTRY = {
    "system": system_prompt,
    "asset_evaluation": asset_evaluation_prompt,
    "tax_analysis": tax_analysis_prompt,
    "news_summarization": news_summarization_prompt,
    "portfolio_rebalancing": portfolio_rebalancing_prompt,
    "performance_review": performance_review_prompt,
    "trade_history": trade_history_prompt,
    "risk_alert": risk_alert_prompt,
    "wallet_analysis": wallet_analysis_prompt,
}
print(f"PROMPT_REGISTRY keys: {list(PROMPT_REGISTRY.keys())}")
