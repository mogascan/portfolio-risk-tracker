# Cursor Operating Rules (Read First)

Cursor must follow these core rules when editing or generating any code in this project:

- Always use `python3`, not `python`
- Follow Mantine-first layout and styling conventions:
  - Use `sx`, `Stack`, `Grid`, `ScrollArea` from Mantine
  - Do not use inline styles or raw CSS unless explicitly required
- Use live data sources (CoinGecko public API, news feeds); avoid mock data unless explicitly testing
- Support dark mode styling using `theme.colorScheme`
- Do not create duplicate files; confirm file doesn't exist before creating
- Maintain the structure:
  - Frontend: `/frontend/`
  - Backend: `/backend/app/`
- Use versioned API routes (e.g., `/api/v1/`); avoid writing route logic directly in `main.py`
- Maintain clean folder structure and file placement
- All test files MUST reside in the `/backend/tests/` directory

These rules must be applied consistently during all code generation and refactoring.

---

# Project Overview

AI-Powered Crypto Portfolio Management

This project connects to Binance, Coinbase, and Ethereum wallets. The dashboard displays unified holdings, trend graphs, profit/loss tracking, and an AI assistant for queries like "What was my best-performing coin this month?" It also supports news aggregation and basic tax estimates.

The UI helps retail traders:
- Analyze trade history and performance
- Understand tax implications and estimate liabilities
- Ask questions and act on research trends using AI
- Add/remove dashboard sections with customizable layout

---

# File and Folder Structure

Follow this structure for all file creation:

- API routes: `/backend/app/api/v1/`
- Services: `/backend/app/services/`
- Webhooks: `/backend/app/webhooks/`
- DB logic and config: `/backend/app/db/`
- Models: `/backend/app/models/`
- Static JSON / cached data: `/backend/app/data/`
- Shell scripts: `/backend/scripts/`
- Tests: `/backend/tests/`
- Frontend pages: `/frontend/src/pages/`
- Frontend components: `/frontend/src/components/`

---

# Testing Rules and Structure

## HARD RULE: All test files MUST reside in the `/backend/tests/` directory

- No test files should exist outside the designated test directory
- Test files must follow the naming convention `test_*.py`
- Tests should not be placed in the application code directories

## Test Files and Their Purpose

The project contains several essential test files:

- `test_ai_context.py`: Tests AI context management, ensuring conversations maintain appropriate context and handle user queries with proper memory and boundaries
- `test_ai_pipeline.py`: Tests the entire AI processing pipeline, validating that queries flow through analysis, intent detection, and response generation correctly
- `test_context_protection.py`: Tests security features that prevent sensitive context leakage and ensure proper handling of potentially sensitive user information
- `test_query.py`: Tests basic query processing functionality, ensuring correct parsing and response formation
- `test_search.py`: Tests search functionality across news and market data, validating keyword matching and relevance ranking

## Documentation and Mock Data

- `mock_data_log.md`: Tracks all mock data created for testing purposes
- All mock data must be:
  - Documented in this log file
  - Given an expiration date
  - Removed when no longer needed for testing

## Test Code Quality

- Tests should be modular and focused on specific functionality
- Use proper assertions and not just print statements
- Avoid hardcoding credentials in tests; use environment variables
- Maintain proper test coverage for all critical application components

---

# Styling and Layout Rules

- Use Mantine's `sx` prop or `createStyles()` for all UI styles
- Use `Stack` for vertical spacing
- Use `Grid`, `Group`, or `Flex` for horizontal layout
- Use `ScrollArea` for scrollable components
- Do not use inline `style={{}}` unless absolutely required
- Use `.module.css` only for typography or global utility classes
- Avoid mixing global CSS with Mantine component styles
- Use `theme.colorScheme` to support light/dark mode styles

---

# API and Data Behavior

- Market data must use the free/public CoinGecko API:
  - Base: `https://api.coingecko.com/api/v3`
  - No Pro API keys
  - Example endpoint: `/coins/markets?vs_currency=usd`
- All news feeds (crypto, macro, Reddit) must use live data and proper API endpoints
- API errors must return clear user-facing messages (not fallbacks)
- Do not use mock data unless explicitly for testing; delete when no longer needed

---

# Dev Environment and Testing

- Use `python3` for all backend scripts and service runs:
  - `python3 -m uvicorn app.main:app --reload`
- Run frontend with `npm run dev`
- All test files go in `/backend/tests/`
- All mock data must be logged in `mock_data_log.md`
- Terminal must be in the correct working directory before executing commands
