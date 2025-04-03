import client from './client';
import axios from 'axios';

// Mock data for development
const MOCK_CRYPTO_NEWS = [
  {
    id: 1,
    title: 'Bitcoin Price Hits New All-Time High',
    summary: 'Bitcoin surpassed the $70,000 mark for the first time in history after major institutional adoption.',
    source: 'CryptoNews',
    url: 'https://example.com/bitcoin-ath',
    publishedAt: '2025-03-28T14:30:00Z',
    sentiment: 'positive',
    relatedCoins: ['BTC']
  },
  {
    id: 2,
    title: 'Ethereum 2.0 Final Upgrade Scheduled',
    summary: 'The Ethereum Foundation has announced the date for the final phase of the ETH 2.0 upgrade.',
    source: 'DeFi Daily',
    url: 'https://example.com/eth-upgrade',
    publishedAt: '2025-03-27T09:15:00Z',
    sentiment: 'positive',
    relatedCoins: ['ETH']
  },
  {
    id: 3,
    title: 'Regulatory Concerns Impact Crypto Market',
    summary: 'New regulatory proposals from the SEC have created uncertainty in the cryptocurrency markets.',
    source: 'Crypto Regulation',
    url: 'https://example.com/crypto-regulations',
    publishedAt: '2025-03-26T16:45:00Z',
    sentiment: 'negative',
    relatedCoins: ['BTC', 'ETH', 'XRP']
  }
];

const MOCK_MACRO_NEWS = [
  {
    id: 1,
    title: 'Federal Reserve Raises Interest Rates',
    summary: 'The Fed has raised interest rates by 0.25% in response to rising inflation concerns.',
    source: 'Bloomberg',
    url: 'https://example.com/fed-rates',
    publishedAt: '2025-03-28T10:00:00Z',
    sentiment: 'neutral',
    category: 'monetary-policy'
  },
  {
    id: 2,
    title: 'Global Market Volatility Increases',
    summary: 'Global markets showing increased volatility due to geopolitical tensions and economic uncertainty.',
    source: 'Financial Times',
    url: 'https://example.com/market-volatility',
    publishedAt: '2025-03-27T08:30:00Z',
    sentiment: 'negative',
    category: 'markets'
  }
];

// Bitcoin specific news mock data
const MOCK_BITCOIN_NEWS = [
  {
    id: 1,
    title: 'Bitcoin Price Hits New All-Time High',
    summary: 'Bitcoin surpassed the $70,000 mark for the first time in history after major institutional adoption.',
    source: 'CryptoNews',
    url: 'https://example.com/bitcoin-ath',
    publishedAt: '2025-03-28T14:30:00Z',
    sentiment: 'positive',
    relatedCoins: ['BTC']
  },
  {
    id: 4,
    title: 'Bitcoin Mining Difficulty Reaches Record High',
    summary: 'Bitcoin network difficulty has reached an all-time high, indicating strong network security.',
    source: 'Mining News',
    url: 'https://example.com/btc-mining',
    publishedAt: '2025-03-25T11:20:00Z',
    sentiment: 'positive',
    relatedCoins: ['BTC']
  }
];

// Portfolio news mock data
const MOCK_PORTFOLIO_NEWS = MOCK_CRYPTO_NEWS;

// RWA (Real World Asset) news mock data
const MOCK_RWA_NEWS = [
  {
    id: 5,
    title: 'Tokenized Real Estate Market Grows',
    summary: 'The market for tokenized real estate assets has grown by 300% in the past year.',
    source: 'RWA News',
    url: 'https://example.com/rwa-growth',
    publishedAt: '2025-03-27T16:45:00Z',
    sentiment: 'positive',
    relatedCoins: ['RWA', 'USDT', 'USDC']
  }
];

// Messari research news mock data
const MOCK_MESSARI_NEWS = [
  {
    id: 6,
    title: 'Messari Research: DeFi Market Analysis',
    summary: 'New research from Messari shows strong growth in DeFi protocols despite market volatility.',
    source: 'Messari',
    url: 'https://example.com/messari-defi',
    publishedAt: '2025-03-26T13:15:00Z',
    sentiment: 'positive',
    relatedCoins: ['ETH', 'AAVE', 'UNI']
  }
];

// Watchlist news mock data
const MOCK_WATCHLIST_NEWS = [
  {
    id: 'watchlist-1',
    title: 'Ethereum Layer 2 Solutions See Record Growth in Q1 2023',
    summary: 'Ethereum scaling solutions are experiencing unprecedented adoption as gas fees on the main chain remain high.',
    source: 'DECRYPT',
    url: 'https://decrypt.co/articles/ethereum-layer-2-growth',
    publishedAt: '2023-03-28T09:15:00Z',
    sentiment: 'positive',
    relatedCoins: ['ETH', 'MATIC', 'OP', 'ARB']
  },
  {
    id: 'watchlist-2',
    title: 'Polkadot Unveils Upgraded Governance Model',
    summary: 'Polkadot has announced a significant update to its on-chain governance system, aiming to improve decentralization.',
    source: 'POLKADOT BLOG',
    url: 'https://polkadot.network/blog/governance-update',
    publishedAt: '2023-03-27T17:30:00Z',
    sentiment: 'neutral',
    relatedCoins: ['DOT', 'KSM']
  },
  {
    id: 'watchlist-3',
    title: 'Chainlink Expands Integration with Major Banking Networks',
    summary: 'Chainlink oracle services are now being adopted by several traditional financial institutions for data verification.',
    source: 'COINDESK',
    url: 'https://www.coindesk.com/business/chainlink-banking-integration',
    publishedAt: '2023-03-26T14:20:00Z',
    sentiment: 'positive',
    relatedCoins: ['LINK']
  }
];

// Watchlist tokens mock data
let watchlistTokens = ['BTC', 'ETH', 'SOL'];

// Remove duplicate client definition
// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
// 
// // Create an API client with timeout and base URL
// const apiClient = axios.create({
//   baseURL: API_URL,
//   timeout: 10000, // 10 seconds timeout
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

// Replace all apiClient instances with client
// Update the fetchMacroNews function
export const fetchMacroNews = async ({ category = 'business', limit = 10 } = {}) => {
  try {
    console.log('Fetching macro news:', { category, limit });
    
    // Try to fetch from latest endpoint first (which includes all categories)
    try {
      const latestResponse = await client.get('/api/v1/news/latest', {
        params: { limit }
      });
      
      if (latestResponse.data && latestResponse.data.macro) {
        // If we have the category requested in the latest data
        if (category === 'all') {
          // Return all macro categories
          console.log('Successfully fetched all macro news categories from latest endpoint');
          return {
            success: true,
            data: latestResponse.data.macro
          };
        } else if (latestResponse.data.macro[category]) {
          // Return the specific category requested
          console.log(`Successfully fetched ${category} news from latest endpoint`);
          return {
            success: true,
            data: latestResponse.data.macro[category]
          };
        }
      }
    } catch (latestError) {
      console.warn('Error fetching from latest endpoint, falling back to category endpoint:', latestError);
    }
    
    // Fall back to the category-specific endpoint
    const response = await client.get('/api/v1/news/macro', {
      params: {
        category,
        limit
      }
    });
    
    return {
      success: true,
      data: response.data && response.data.items ? response.data.items : []
    };
  } catch (error) {
    console.error('Error fetching macro news:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Failed to fetch macroeconomic news'
    };
  }
};

// Update the fetchCryptoNews function
export const fetchCryptoNews = async ({ limit = 10, query = null, sentiment = null } = {}) => {
  try {
    console.log('Fetching crypto news:', { limit, query, sentiment });
    
    const response = await client.get('/api/v1/news/crypto', {
      params: {
        limit,
        query,
        sentiment
      }
    });
    
    return {
      success: true,
      data: response.data && response.data.items ? response.data.items : []
    };
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Failed to fetch cryptocurrency news'
    };
  }
};

/**
 * Fetch news related to a specific asset
 * @param {string} symbol - Asset symbol
 * @param {number} limit - Number of news items to fetch
 * @returns {Promise<Object>} - News items and status
 */
export const fetchAssetNews = async (symbol, limit = 10) => {
  try {
    console.log(`Fetching news for asset ${symbol}, limit: ${limit}`);
    
    const response = await client.get(`/api/v1/news/asset/${symbol}`, {
      params: { limit }
    });
    
    if (response.data && response.data.items) {
      console.log(`Successfully fetched ${response.data.items.length} news items for ${symbol}`);
      return {
        success: true,
        data: response.data.items
      };
    } else {
      console.warn(`Asset news API returned empty or invalid data for ${symbol}`);
      return {
        success: false,
        data: [],
        error: `No news data available for ${symbol}`
      };
    }
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return {
      success: false,
      data: [],
      error: error.message || `Failed to fetch news for ${symbol}`
    };
  }
};

/**
 * Fetch Reddit posts from a specific subreddit
 * @param {string} subreddit - Subreddit name
 * @param {string} sort - Sort method (hot, new, top)
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Object>} - Posts and status
 */
export const fetchRedditPosts = async (subreddit, sort = 'hot', limit = 25) => {
  try {
    console.log(`Fetching Reddit posts from r/${subreddit}, sorted by ${sort}, limit: ${limit}`);
    
    const response = await client.get(`/api/v1/news/reddit/${subreddit}/${sort}`, {
      params: { limit }
    });
    
    if (response.data && response.data.items) {
      console.log(`Successfully fetched ${response.data.items.length} posts from r/${subreddit}`);
      return {
        success: true,
        data: response.data.items
      };
    } else {
      console.warn(`Reddit API returned empty or invalid data for r/${subreddit}`);
      return {
        success: false,
        data: [],
        error: `No posts available from r/${subreddit}`
      };
    }
  } catch (error) {
    console.error(`Error fetching posts from r/${subreddit}:`, error);
    return {
      success: false,
      data: [],
      error: error.message || `Failed to fetch posts from r/${subreddit}`
    };
  }
};

/**
 * Search for Reddit posts containing a specific query
 * @param {string} query - Search query
 * @param {string} subreddit - Optional subreddit to restrict search to
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Object>} - Search results and status
 */
export const searchRedditPosts = async (query, subreddit = null, limit = 25) => {
  try {
    console.log(`Searching Reddit for "${query}" ${subreddit ? `in r/${subreddit}` : 'across all subreddits'}, limit: ${limit}`);
    
    const params = { q: query, limit };
    if (subreddit) {
      params.subreddit = subreddit;
    }
    
    const response = await client.get('/api/v1/news/reddit/search', { params });
    
    if (response.data && response.data.items) {
      console.log(`Successfully fetched ${response.data.items.length} search results for "${query}"`);
      return {
        success: true,
        data: response.data.items
      };
    } else {
      console.warn(`Reddit search API returned empty or invalid data for "${query}"`);
      return {
        success: false,
        data: [],
        error: `No search results found for "${query}"`
      };
    }
  } catch (error) {
    console.error(`Error searching Reddit for "${query}":`, error);
    return {
      success: false,
      data: [],
      error: error.message || `Failed to search Reddit for "${query}"`
    };
  }
};

/**
 * Fetch Bitcoin-specific news
 * @param {number} limit - Number of news items to fetch
 * @returns {Promise<Object>} - News items and status
 */
export const fetchBitcoinNews = async (limit = 10) => {
  try {
    console.log(`Fetching Bitcoin news, limit: ${limit}`);
    
    const response = await client.get('/api/v1/news/bitcoin', {
      params: { limit }
    });
    
    return {
      success: true,
      data: response.data && response.data.items ? response.data.items : []
    };
  } catch (error) {
    console.error('Error fetching Bitcoin news:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Failed to fetch Bitcoin news'
    };
  }
};

/**
 * Fetch portfolio-related news
 * @param {number} limit - Number of news items to fetch
 * @returns {Promise<Object>} - News items and status
 */
export const fetchPortfolioNews = async (limit = 10) => {
  try {
    console.log(`Fetching portfolio news, limit: ${limit}`);
    
    const response = await client.get('/api/v1/news/portfolio', {
      params: { limit }
    });
    
    return {
      success: true,
      data: response.data && response.data.items ? response.data.items : []
    };
  } catch (error) {
    console.error('Error fetching portfolio news:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Failed to fetch portfolio news'
    };
  }
};

/**
 * Update watchlist tokens in the news service
 * @param {Array} tokens - Array of watchlist tokens
 * @returns {Promise<Object>} - Response with success status
 */
export const updateWatchlistTokens = async (tokens = []) => {
  try {
    const payload = {
      user_id: "user123",
      action: "add",
      symbols: tokens.map(token => typeof token === 'string' ? token : String(token))
    };
    
    console.log('Sending watchlist update to backend:', payload);
    
    const response = await client.post('/api/v1/portfolio/watchlist/update', payload);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error updating watchlist tokens:', error);
    return {
      success: false,
      error: error.message || 'Failed to update watchlist tokens'
    };
  }
};

/**
 * Fetch news related to watchlist tokens
 * @param {Array} tokens - Array of token symbols to watch
 * @param {number} limit - Number of news items to fetch
 * @returns {Promise<Object>} - News items and status
 */
export const fetchWatchlistNews = async (limit = 10) => {
  try {
    console.log(`Fetching watchlist news, limit: ${limit}`);
    
    // First try to get news using the specialized backend endpoint
    let response = await client.get('/api/v1/news/watchlist', {
      params: { limit }
    });
    
    if (response.data && response.data.items && response.data.items.length > 0) {
      return {
        success: true,
        data: response.data.items
      };
    }
    
    // If that doesn't work or returns no data, use the crypto news endpoint
    // as a fallback - this is still real data, not mock data
    console.log('Watchlist news endpoint returned no data, trying crypto news as fallback');
    response = await client.get('/api/v1/news/crypto', {
      params: { limit }
    });
    
    return {
      success: true,
      data: response.data && response.data.items ? response.data.items : []
    };
  } catch (error) {
    console.error('Error fetching watchlist news:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Failed to fetch watchlist news'
    };
  }
};

/**
 * Fetch Real World Asset (RWA) news
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - News items
 */
export const fetchRwaNews = async (limit = 10) => {
  try {
    console.log(`Fetching RWA news, limit: ${limit}`);
    
    const response = await client.get('/api/v1/news/rwa', {
      params: { limit }
    });
    
    return {
      success: true,
      data: response.data && response.data.items ? response.data.items : []
    };
  } catch (error) {
    console.error('Error fetching RWA news:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Failed to fetch RWA news'
    };
  }
};

/**
 * Fetch Messari research news
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - News items
 */
export const fetchMessariNews = async (limit = 10) => {
  try {
    console.log(`Fetching Messari news, limit: ${limit}`);
    
    const response = await client.get('/api/v1/news/messari', {
      params: { limit }
    });
    
    return {
      success: true,
      data: response.data && response.data.items ? response.data.items : []
    };
  } catch (error) {
    console.error('Error fetching Messari news:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Failed to fetch Messari news'
    };
  }
};

/**
 * Update portfolio holdings in the news service
 * @param {Array} holdings - Array of portfolio holdings objects or symbols
 * @returns {Promise<Object>} - Response with success status
 */
export const updatePortfolioHoldings = async (holdings = []) => {
  try {
    // Check if holdings is already properly formatted (array of objects with symbol, name, quantity)
    const isProperlyFormatted = holdings.length > 0 && 
                               typeof holdings[0] === 'object' && 
                               holdings[0].symbol !== undefined;
    
    let payload;
    if (isProperlyFormatted) {
      // If properly formatted, create the payload with the holdings
      payload = {
        user_id: "user123",
        assets: holdings
      };
    } else {
      // If it's an array of strings, convert to expected format
      payload = {
        user_id: "user123",
        assets: holdings.map((item, index) => ({
          symbol: typeof item === 'string' ? item : String(item),
          name: typeof item === 'string' ? item : String(item),
          quantity: 1
        }))
      };
    }
    
    console.log('Sending formatted portfolio data to backend:', payload);
    
    const response = await client.post('/api/v1/portfolio/holdings/update', payload);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error updating portfolio holdings:', error);
    return {
      success: false,
      error: error.message || 'Failed to update portfolio holdings'
    };
  }
};

export default {
  fetchMacroNews,
  fetchCryptoNews,
  fetchAssetNews,
  fetchPortfolioNews,
  updatePortfolioHoldings
}; 