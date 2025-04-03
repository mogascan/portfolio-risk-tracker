# Crypto Portfolio Tracker - Backend

This directory contains the backend services for the Crypto Portfolio Tracker application. The backend is built with FastAPI (Python) and provides comprehensive cryptocurrency portfolio tracking and AI-powered analysis.

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

- Python 3.8+ (recommended: Python 3.10+)
- pip

### Installation

1. Clone the repository (if you haven't already)

2. Set up a Python virtual environment (recommended)
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

## Running the Services

### Starting the Backend Server

```bash
# From the backend directory with venv activated
python -m uvicorn app.main:app --reload --port 8000
```

Or use the convenience script:

```bash
./scripts/start_backend.sh
```

This will:
- Start the FastAPI server on port 8000
- Enable hot-reloading for development
- Initialize all required services

### Stopping the Server

To stop the server, simply press `Ctrl+C` in the terminal where it's running.

## API Endpoints

### Main API (http://localhost:8000)

- `/api/v1/market`: Market data endpoints
- `/api/v1/portfolio`: Portfolio management endpoints
- `/api/v1/news`: News aggregation endpoints
- `/api/v1/ai`: AI assistant endpoints

#### Documentation

FastAPI automatically generates interactive API documentation:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Log Files

- Server logs: `server.log`
- Application logs: `app.log` 

## Troubleshooting

If you encounter any issues:

1. Check the log files for error messages:
   ```bash
   tail -f server.log
   ```

2. Ensure all required dependencies are installed:
   ```bash
   source venv/bin/activate  # if using a virtual environment
   pip install -r requirements.txt
   ```

3. Verify the port is not already in use by another application
   ```bash
   # Check port
   lsof -i :8000
   ```

4. Ensure your `.env` file is correctly set up with all required API keys

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

## Real-Time Data Sources

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

### Data Refresh Intervals

- Market data: Every 5 minutes
- News data: Every 15 minutes
- Reddit data: Every 30 minutes

### Key API Endpoints

- GET `/api/v1/market/data` - Get all current market data
- GET `/api/v1/market/prices` - Get current crypto prices
- GET `/api/v1/market/trending` - Get trending coins based on 24h performance
- GET `/api/v1/news/crypto` - Get latest crypto news
- GET `/api/v1/news/reddit` - Get latest Reddit posts

## Development Guidelines

1. **Code Style**: 
   - Follow PEP 8 guidelines
   - Use type hints wherever possible
   - Document functions and classes with docstrings

2. **Error Handling**:
   - Use proper exception handling
   - Log errors with appropriate severity
   - Return standardized error responses

3. **Testing**:
   - Write unit tests for new functionality
   - Place all tests in the `/backend/tests/` directory
   - Follow the naming convention `test_*.py`

4. **Environment Variables**:
   - Always use environment variables for configuration
   - Add new variables to `.env.example` with dummy values
   - Document new variables in this README 