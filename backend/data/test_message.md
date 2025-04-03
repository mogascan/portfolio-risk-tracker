# Testing Context Providers

This document provides instructions for testing the context providers after the Phase 2 improvements.

## Manual Testing Procedure

To test the updated context providers, follow these steps:

1. **Start the backend API server**:
   ```bash
   cd backend
   python3 -m uvicorn app.main:app --reload
   ```

2. **Test Market Context Provider with cURL**:
   ```bash
   # Test price query for SOL
   curl -X POST "http://localhost:8000/api/v1/ai/chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "What is the price of SOL?", "debug": true}'
   
   # Test price query for a non-existent coin to test fallback
   curl -X POST "http://localhost:8000/api/v1/ai/chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "What is the price of NOTACOIN?", "debug": true}'
   ```

3. **Test Portfolio Context Provider with cURL**:
   ```bash
   # Test portfolio performance query
   curl -X POST "http://localhost:8000/api/v1/ai/chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "How is my portfolio performing?", "debug": true}'
   ```

4. **Test News Context Provider with cURL**:
   ```bash
   # Test news query with key terms
   curl -X POST "http://localhost:8000/api/v1/ai/chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "What are the latest headlines about Bitcoin?", "debug": true}'
   ```

## Verification Checklist

For each test, verify the following:

1. **Response Structure**:
   - Contains the appropriate context data (market/portfolio/news)
   - Includes the new `_metadata` object with fields:
     - `source`: Identifies which provider generated the context
     - `status`: Should be "live" if data was available, "fallback" if using fallback data
     - Execution metrics like `estimated_tokens` and `execution_time_seconds`

2. **Fallback Behavior**:
   - When querying non-existent data (e.g., "NOTACOIN"), check that:
     - The response contains a clear "not found" message
     - The `status` in metadata indicates "fallback"
     - Some reasonable fallback data is provided

3. **Token Budgeting**:
   - Check that `estimated_tokens` is reported
   - If data was trimmed, check that the `trimmed` flag is true
   - Verify that the most relevant data is preserved when trimming occurs

4. **Key Term Extraction** (for news queries):
   - Check that appropriate key terms were extracted from the query
   - Verify these are logged in the `key_terms` field in the metadata

## Improvements for Non-existent Coins

One of the major improvements implemented is better handling of non-existent cryptocurrency queries:

1. **Improved Coin Extraction**:
   - Added pattern matching for "price of X" queries to better extract potential coin names
   - Enhanced the algorithm to properly extract coin names like "NOTACOIN" from queries

2. **Clear Error Messages**:
   - Added a `primary_not_found_message` at the root level for immediate visibility
   - This message explains clearly that the requested cryptocurrency wasn't found
   - Example: "I couldn't find information for the following cryptocurrency: NOTACOIN. It may not exist or may not be listed in our database."

3. **Consistent Fallback Behavior**:
   - When a non-existent coin is requested, the system now:
     - Returns a clear error message
     - Still provides general market data as context
     - Marks the response with `status: fallback` to indicate this is not live data

4. **Error Handling**:
   - Fixed potential errors related to the title() method on None
   - Better handling of multiple non-existent coins in a single query

These improvements ensure users get a much clearer error message when requesting data for cryptocurrencies that don't exist or aren't in our database, rather than silently failing or returning only general market data without explanation.

## Expected Results

- **Market Queries**: Should return price data for the requested cryptocurrency with proper metadata
- **Portfolio Queries**: Should return portfolio holdings and metrics with proper status
- **News Queries**: Should return filtered news based on extracted key terms

If you encounter any issues, please check the server logs for detailed error messages related to the context providers. 