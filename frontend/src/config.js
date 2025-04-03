const config = {
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  aiApiBaseUrl: process.env.REACT_APP_AI_API_URL || 'http://localhost:8000',
  // Add other configuration settings here
};

// Export the webhook server URL for use in components
export const WEBHOOK_SERVER_URL = process.env.REACT_APP_WEBHOOK_SERVER_URL || 'http://localhost:8000';

export default config; 