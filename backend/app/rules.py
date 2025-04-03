"""
API Rules and Rate Limiting Information
"""

# CoinGecko API Configuration
COINGECKO_API = {
    "base_url": "https://api.coingecko.com/api/v3",
    "documentation": "https://www.coingecko.com/api/documentation",
    "rate_limit": {
        "free_tier": {
            "calls_per_minute": 2,  # Even more conservative
            "retry_after_seconds": 300  # 5 minutes
        }
    }
}

# Popular CoinGecko Endpoints
COINGECKO_ENDPOINTS = {
    "coins_list": "/coins/list",  # List all supported coins with id, name, and symbol
    "coins_markets": "/coins/markets",  # List all supported coins price, market cap, volume, and market related data
    "coin_details": "/coins/{id}",  # Get current data for a specific coin
    "simple_price": "/simple/price"  # Get the current price of any cryptocurrency
}

# Rate Limiting Rules
RATE_LIMIT_RULES = {
    "coingecko": {
        "calls_per_minute": 2,  # Even more conservative
        "retry_after_seconds": 300,  # 5 minutes
        "error_code": 429
    }
} 