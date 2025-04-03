import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useConfig } from './ConfigContext';

const MarketContext = createContext();

export const useMarket = () => useContext(MarketContext);

export const MarketProvider = ({ children }) => {
  const { apiBaseUrl } = useConfig();
  const [topCoins, setTopCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(null);
  const [rateLimitReset, setRateLimitReset] = useState(null);
  const [coinLimit, setCoinLimit] = useState(500); // Default to 500 coins

  // Function to fetch top coins
  const fetchTopCoins = async (limit = coinLimit) => {
    setLoading(true);
    setError(null);
    
    try {
      // Enforce max limit of 500
      const requestLimit = Math.min(limit, 500);
      console.log(`[MarketContext] Fetching from ${apiBaseUrl}/api/v1/market/topcoins with limit: ${requestLimit}`);
      console.log(`[MarketContext] Current apiBaseUrl: ${apiBaseUrl}`);
      // Get top coins from the backend API
      const response = await axios.get(`${apiBaseUrl}/api/v1/market/topcoins`, {
        params: { limit: requestLimit }
      });
      console.log("[MarketContext] API response received:", response.status, response.statusText);
      console.log("[MarketContext] Response data count:", response.data?.length || 0);
      console.log("[MarketContext] First coin data example:", JSON.stringify(response.data?.[0] || "No data", null, 2));
      
      // Check headers for rate limit information
      if (response.headers['x-ratelimit-remaining']) {
        setRateLimitRemaining(parseInt(response.headers['x-ratelimit-remaining']));
      }
      if (response.headers['x-ratelimit-reset']) {
        setRateLimitReset(parseInt(response.headers['x-ratelimit-reset']));
      }
      
      // Ensure no duplicates by using a Map with coin ID as key
      const uniqueCoins = new Map();
      response.data.forEach(coin => {
        if (!uniqueCoins.has(coin.id)) {
          uniqueCoins.set(coin.id, coin);
        }
      });
      
      // Convert Map back to array and sort by market cap rank or add ranking if missing
      const coinsArray = Array.from(uniqueCoins.values())
        .map((coin, index) => ({
          ...coin,
          market_cap_rank: coin.market_cap_rank || index + 1
        }))
        .sort((a, b) => (a.market_cap_rank || Infinity) - (b.market_cap_rank || Infinity));
      
      console.log("[MarketContext] Processed unique coins:", coinsArray.length);
      console.log("[MarketContext] First processed coin:", JSON.stringify(coinsArray[0] || "No processed data", null, 2));
      
      setTopCoins(coinsArray);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching market data:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError(error.response?.data?.detail || error.message || 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  // Function to update coin limit and fetch data
  const updateCoinLimit = (newLimit) => {
    setCoinLimit(newLimit);
    fetchTopCoins(newLimit);
  };

  // Create a function to get the coin by ID
  const getCoinById = (id) => {
    return topCoins.find(coin => coin.id === id) || null;
  };

  // Create a function to get multiple coins by their IDs
  const getCoinsByIds = (ids) => {
    return topCoins.filter(coin => ids.includes(coin.id));
  };

  // Function to check if we should refetch based on rate limits
  const shouldRefetch = () => {
    // If we don't have rate limit info, allow refetch
    if (rateLimitRemaining === null) return true;
    
    // If we have plenty of requests left, allow refetch
    if (rateLimitRemaining > 10) return true;
    
    // If rate limit is low but reset time has passed, allow refetch
    if (rateLimitReset && new Date() > new Date(rateLimitReset * 1000)) return true;
    
    // Otherwise, be conservative with our remaining requests
    return false;
  };

  // Fetch data on component mount
  useEffect(() => {
    // Explicitly fetch 500 coins on initial load
    fetchTopCoins(500);
    
    // Set up interval to refresh data every 5 minutes
    const interval = setInterval(() => {
      if (shouldRefetch()) {
        // Always fetch the current coinLimit during regular refreshes
        fetchTopCoins(coinLimit);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [apiBaseUrl]); // Only re-run when the API base URL changes

  // Calculate market stats
  const calculateMarketStats = () => {
    if (!topCoins.length) return { totalMarketCap: 0, totalVolume: 0, btcDominance: 0 };
    
    const totalMarketCap = topCoins.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
    const totalVolume = topCoins.reduce((sum, coin) => sum + (coin.total_volume || 0), 0);
    
    // Calculate BTC dominance
    const btc = topCoins.find(coin => coin.id === 'bitcoin');
    const btcDominance = btc ? (btc.market_cap / totalMarketCap) * 100 : 0;
    
    return {
      totalMarketCap,
      totalVolume,
      btcDominance
    };
  };

  const marketStats = calculateMarketStats();

  const contextValue = {
    topCoins,
    loading,
    error,
    lastUpdate,
    rateLimitRemaining,
    rateLimitReset,
    fetchTopCoins,
    getCoinById,
    getCoinsByIds,
    marketStats,
    coinLimit,
    updateCoinLimit
  };

  return (
    <MarketContext.Provider value={contextValue}>
      {children}
    </MarketContext.Provider>
  );
};

export default MarketContext; 