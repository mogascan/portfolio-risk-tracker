import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

/**
 * Service for interacting with the CoinGecko API
 */
const coinGeckoService = {
  /**
   * Fetch token data by token ID (e.g., bitcoin, ethereum)
   * @param {string} tokenId - The CoinGecko token ID
   * @returns {Promise<Object>} - Token data
   */
  getTokenById: async (tokenId) => {
    try {
      const response = await axios.get(`${COINGECKO_API_URL}/coins/${tokenId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        }
      });
      
      if (!response.data || !response.data.market_data) {
        console.error('Invalid response format from CoinGecko API:', response.data);
        throw new Error('Invalid data format received from API');
      }
      
      const { market_data } = response.data;
      
      return {
        id: response.data.id,
        name: response.data.name,
        symbol: response.data.symbol.toUpperCase(),
        image: response.data.image?.small,
        price: market_data.current_price?.usd || 0,
        priceChangePercentage24h: market_data.price_change_percentage_24h || 0,
        circulatingSupply: market_data.circulating_supply || 0,
        totalSupply: market_data.total_supply || 0,
        maxSupply: market_data.max_supply || null,
        marketCap: market_data.market_cap?.usd || 0,
        fdv: market_data.fully_diluted_valuation?.usd || (market_data.total_supply ? (market_data.current_price?.usd || 0) * market_data.total_supply : market_data.market_cap?.usd || 0),
        volume24h: market_data.total_volume?.usd || 0,
      };
    } catch (error) {
      if (error.response?.status === 429) {
        console.error('CoinGecko API rate limit exceeded');
        error.isRateLimit = true;
      }
      console.error('Error fetching token data from CoinGecko:', error);
      throw error;
    }
  },
  
  /**
   * Search for tokens by query string
   * @param {string} query - The search query
   * @returns {Promise<Array>} - List of matching tokens
   */
  searchTokens: async (query) => {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return [];
    }
    
    try {
      const response = await axios.get(`${COINGECKO_API_URL}/search`, {
        params: { query }
      });
      
      if (!response || !response.data || !Array.isArray(response.data.coins)) {
        console.error('Invalid response format from CoinGecko API:', response?.data);
        return [];
      }
      
      return response.data.coins.map(coin => {
        if (!coin) return null;
        
        return {
          id: coin.id || '',
          name: coin.name || '',
          symbol: (coin.symbol && typeof coin.symbol === 'string') ? coin.symbol.toUpperCase() : '',
          marketCapRank: coin.market_cap_rank || null,
          thumb: coin.thumb || ''
        };
      }).filter(Boolean); // Remove any null items
    } catch (error) {
      if (error.response?.status === 429) {
        console.error('CoinGecko API rate limit exceeded');
      }
      console.error('Error searching tokens on CoinGecko:', error);
      return []; // Return empty array on error
    }
  },
  
  /**
   * Get trending tokens (top-7 trending coins on CoinGecko)
   * @returns {Promise<Array>} - List of trending tokens
   */
  getTrendingTokens: async () => {
    try {
      const response = await axios.get(`${COINGECKO_API_URL}/search/trending`);
      
      if (!response || !response.data || !Array.isArray(response.data.coins)) {
        console.error('Invalid response format from CoinGecko API:', response?.data);
        return [];
      }
      
      return response.data.coins
        .filter(item => item && item.item) // Filter out items without item property
        .map(item => {
          const coin = item.item;
          if (!coin) return null;
          
          return {
            id: coin.id || '',
            name: coin.name || '',
            symbol: (coin.symbol && typeof coin.symbol === 'string') ? coin.symbol.toUpperCase() : '',
            marketCapRank: coin.market_cap_rank || null,
            thumb: coin.thumb || ''
          };
        })
        .filter(Boolean); // Remove any null items
    } catch (error) {
      if (error.response?.status === 429) {
        console.error('CoinGecko API rate limit exceeded');
      }
      console.error('Error fetching trending tokens from CoinGecko:', error);
      return []; // Return empty array on error
    }
  }
};

export default coinGeckoService; 