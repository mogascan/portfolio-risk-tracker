// frontend/src/api/ai.js
import client from './client';

/**
 * Send a query to the AI assistant
 * @param {string} query - User's natural language query
 * @param {object} options - Additional options for the query (optional)
 */
export const sendAiQuery = async (query, options = {}) => {
  try {
    const timeoutDuration = 30000; // 30 seconds timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    console.debug(`Sending query to AI: ${query}`);
    console.debug('Options:', options);
    
    // Try using the chat endpoint
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/ai/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        model: options.model || 'gpt-4',
        debug: options.debug === true
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI query failed with status ${response.status}: ${errorText}`);
      return {
        message: `Error: ${response.status} - ${errorText || 'Unknown error occurred'}`,
        isError: true
      };
    }
    
    const data = await response.json();
    console.debug('AI response received:', data);
    
    // Extract the message from the response based on its structure
    let message = '';
    
    if (typeof data === 'string') {
      message = data;
    } else if (data && typeof data === 'object') {
      // Try to find the message content in various possible fields
      if (data.content) {
        message = data.content;
      } else if (data.message) {
        message = data.message;
      } else if (data.text) {
        message = data.text;
      } else if (data.answer) {
        message = data.answer;
      } else {
        // Don't include raw data in message, just a friendly message
        console.warn('Unexpected response format from AI service:', data);
        message = 'I received your request, but the response format was unexpected.';
      }
    } else {
      console.warn('Invalid response type from AI service:', typeof data);
      message = 'Received an invalid response from the AI service.';
    }
    
    // Include metadata from response
    return {
      message: message,
      source: data.source || null,
      metadata: data.metadata || null,
      isError: false
    };
  } catch (error) {
    console.error('Error in AI query:', error);
    
    let errorMessage = 'An error occurred while processing your request.';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out. The AI service took too long to respond.';
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    return {
      message: errorMessage,
      isError: true
    };
  }
};

/**
 * Get AI-generated insights about the portfolio
 */
export const fetchAiInsights = async () => {
  try {
    const response = await client.get('/v1/ai/insights');
    return response.data;
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    throw error;
  }
};

/**
 * Get AI analysis for a specific asset
 * @param {string} assetId - Asset identifier
 */
export const fetchAssetAnalysis = async (assetId) => {
  try {
    const response = await client.post('/v1/ai/analyze-asset', {
      asset_id: assetId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching asset analysis:', error);
    throw error;
  }
};

/**
 * Get AI-generated recommendations for portfolio improvement
 */
export const fetchAiRecommendations = async () => {
  try {
    const response = await client.post('/v1/ai/recommendations');
    return response.data;
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    throw error;
  }
};