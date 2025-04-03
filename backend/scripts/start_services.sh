#!/bin/bash

# Script to start all services and ensure we're using real data

echo "Starting services and ensuring live data use..."

# Create necessary directories
mkdir -p data/portfolio

# Remove old data files to force refresh
echo "Removing old cached data files..."
rm -f data/market_data.json
rm -f data/coingecko_cache.json

# Ensure portfolio data directories exist
echo "Creating portfolio data directories..."
mkdir -p data/portfolio

# Initialize empty portfolio data if not exists
if [ ! -f data/portfolio/user_portfolio_holdings.json ]; then
    echo "[]" > data/portfolio/user_portfolio_holdings.json
    echo "Created empty portfolio holdings file"
fi

if [ ! -f data/portfolio/user_watchlist.json ]; then
    echo '{"user_id": "user123", "symbols": ["BTC", "ETH", "SOL"], "last_updated": "'$(date -Iseconds)'"}' > data/portfolio/user_watchlist.json
    echo "Created initial watchlist data"
fi

echo "Starting backend server..."
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 