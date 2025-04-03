# Crypto Portfolio Tracker - Backend

This directory contains the backend services for the Crypto Portfolio Tracker application. The backend consists of two main components:

1. **Main Server**: Node.js server that handles portfolio management, authentication, and core functionality
2. **News Server**: Python FastAPI server providing crypto and economic news data

## Security and API Keys

⚠️ **IMPORTANT: API Key Security** ⚠️

This application requires several API keys to function properly:
- OpenAI API key for AI analysis features
- CoinGecko API key for market data
- News API keys for news aggregation

**Never commit API keys to the repository!** Instead:

1. Create a `.env` file in the `backend/` directory using the template in `.env.example`
2. Add your API keys to this file
3. The application loads these keys using `load_dotenv()` during startup
4. All API keys should be accessed via `os.getenv()` or similar environment variable methods
5. The `.env` file is included in `.gitignore` to prevent accidental commits

Example `.env` file:
```
OPENAI_API_KEY=your_openai_key_here
COINGECKO_API_KEY=your_coingecko_key_here
NEWS_API_KEY=your_news_api_key_here
```

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- Python 3.8+
- npm
- pip

### Installation

1. Clone the repository (if you haven't already)

2. Install Node.js dependencies
   ```bash
   cd backend
   npm install
   ```

3. Install Python dependencies
   ```bash
   # Create and activate a Python virtual environment (recommended)
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

## Running the Services

### Starting All Services

To start both the main server and news server:

```bash
./start_services.sh
```

This will:
- Start the main Node.js server on port 5000
- Start the FastAPI news server on port 5001
- Save the process IDs to PID files for easy management
- Redirect logs to dedicated log files

### Starting Only the News Server

To start just the news server:

```bash
./start_news_server.sh
```

### Stopping All Services

To stop all running services:

```bash
./stop_services.sh
```

## Service Endpoints

### Main Server (http://localhost:5000)

- `/api/portfolio`: Portfolio management endpoints
- `/api/auth`: Authentication-related endpoints
- `/api/market`: Market data endpoints

### News Server (http://localhost:5001)

- `/news/crypto`: Cryptocurrency news
- `/news/macro`: Economic/financial news
- `/news/bitcoin`: Bitcoin-specific news
- `/reddit/{subreddit}/{sort}`: Reddit posts by subreddit
- `/reddit/search`: Search across Reddit
- `/health`: Health check endpoint

## Log Files

- Main server: `backend.log`
- News server: `news_server.log`

## Troubleshooting

If you encounter any issues:

1. Check the log files for error messages:
   ```bash
   tail -f backend.log
   tail -f news_server.log
   ```

2. Ensure all required dependencies are installed:
   ```bash
   npm install
   source venv/bin/activate  # if using a virtual environment
   pip install -r requirements.txt
   ```

3. Verify the ports are not already in use by other applications
   ```bash
   # Check ports
   lsof -i :5000
   lsof -i :5001
   ```

4. Restart the services
   ```bash
   ./stop_services.sh
   ./start_services.sh
   ```

# Backend API Structure

## AI Service Integration

The backend AI service provides a structured response format. The following structure is expected by the frontend:

```json
{
  "message": "Text response to display to the user",
  "status": "success",
  "intent": "detected_intent",
  "confidence": 0.95
}
```

### Response Structure

The frontend expects responses with the following fields:

- `message` (required): The text content to display to the user
- `status` (optional): Status of the response ("success", "error", etc.)
- `intent` (optional): The detected intent from the query
- `confidence` (optional): Confidence score for the intent detection
- Additional fields may be included but won't be displayed to the user unless in development mode

### Error Handling

If the backend encounters an error, it should return a response with:

```json
{
  "message": "User-friendly error message",
  "status": "error",
  "error_type": "validation_error",
  "error_details": "Details about the error (only shown in development mode)"
}
```

The frontend will display error messages differently from regular responses.

# Real-Time Data Sources

The application uses several real-time data sources:

1. **CoinGecko API**: All cryptocurrency market data is fetched directly from the CoinGecko API. This includes:
   - Current prices, market caps, and trading volumes
   - 24-hour, 7-day, and 30-day price changes
   - Trending coins and market overview statistics

2. **News Sources**: Crypto news is fetched from multiple sources:
   - RSS feeds from crypto news websites (Bitcoinist, Bitcoin.com, BTC Manager, Messari)
   - Reddit posts from cryptocurrency subreddits (r/Bitcoin, r/Ethereum, r/CryptoMarkets, etc.)
   - Macro economic news sources

3. **Portfolio Data**: User portfolio data is stored locally and can be updated through the API.

## Ensuring Live Data

When starting the application, all data sources are refreshed to ensure the most current information:

```bash
# Start all services with fresh data
./scripts/start_services.sh
```

Data refresh intervals:
- Market data: Every 5 minutes
- News data: Every 15 minutes
- Reddit data: Every 30 minutes

## API Endpoints for Live Data

- GET `/api/v1/market/data` - Get all current market data
- GET `/api/v1/market/prices` - Get current crypto prices
- GET `/api/v1/market/trending` - Get trending coins based on 24h performance
- GET `/api/v1/news/crypto` - Get latest crypto news
- GET `/api/v1/news/reddit` - Get latest Reddit posts 

# Recent Refactoring Notes

## AI Prompt System Refactoring

We've successfully completed refactoring of the prompt system:

1. **Removed Outdated Files**:
   - Deleted `prompt_dispatcher.py` and `intent_router.py` files which were causing duplication and confusion

2. **Standardized Imports**:
   - Updated `__init__.py` in the prompts directory to use the new imports from `app.services.ai`
   - All prompt templates are now centralized in `prompt_templates.py`

3. **Updated Service Integration**:
   - Updated `openai_service.py` and `openai_service_patched.py` to use the intent classifier and prompt templates
   - Updated API routes to use the new `process_chat` method instead of the deleted methods

4. **Known Issues**:
   - There are some issues with the import structure that should be addressed in future updates
   - A comprehensive testing framework needs to be implemented to ensure all imports work correctly
   - Current implementation works for the core functionality but should be properly tested in development environment

This refactoring resolves the issues identified in the initial audit and provides a more maintainable structure for prompt management. 

## Phase 2: Context Provider Improvements

We've updated the context providers to ensure they meet the following requirements:

1. **Unified Data Source**: All context providers now use `/backend/data/` for their primary data source:
   - MarketContextProvider: `market_data.json` 
   - PortfolioContextProvider: `portfolio/user_portfolio_holdings.json`
   - NewsContextProvider: `crypto_news.json`, `macro_news.json`, `reddit_posts.json`

2. **Consistent Metadata**: All providers now include structured metadata in their responses:
   ```json
   "_metadata": {
     "source": "market|portfolio|news",
     "status": "live|fallback|empty",
     "query_time": "ISO timestamp",
     "estimated_tokens": 1234,
     "execution_time_seconds": 0.35,
     "token_budget": 2000
   }
   ```

3. **Improved Fallback Handling**: Each provider now has robust fallback mechanisms:
   - MarketContextProvider: Falls back to cached data, then to static fallback data
   - PortfolioContextProvider: Falls back to direct file reading, then to example data
   - NewsContextProvider: Falls back to cached news, then to mock news with requested terms

4. **Context Sizing and Logging**: All providers now:
   - Estimate token usage via the `estimate_tokens()` method
   - Log context size and execution time metrics
   - Intelligently trim content to fit token budgets
   - Preserve crucial data when trimming (e.g., requested coin data)

5. **Key Term Extraction**: Improved the news provider's key term extraction:
   - Filters out words under 3 characters
   - Converts all terms to lowercase for consistent matching
   - Logs matched keywords for better debugging

These changes ensure that context providers deliver consistent, structured data to the AI service while providing clear fallback mechanisms when primary data sources are unavailable. 