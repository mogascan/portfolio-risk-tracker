// frontend/src/contexts/SpecificCoinsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useConfig } from './ConfigContext';

const SpecificCoinsContext = createContext();

export const useSpecificCoins = () => {
  const context = useContext(SpecificCoinsContext);
  if (!context) {
    throw new Error('useSpecificCoins must be used within a SpecificCoinsProvider');
  }
  return context;
};

export function SpecificCoinsProvider({ children }) {
  const { apiBaseUrl } = useConfig();
  const [specificCoins, setSpecificCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(null);
  const [rateLimitReset, setRateLimitReset] = useState(null);

  const fetchSpecificCoins = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching specific coins beyond rank 500...');
      const response = await axios.get(`${apiBaseUrl}/api/v1/market/specific-coins`);
      
      // Check headers for rate limit information
      if (response.headers['x-ratelimit-remaining']) {
        setRateLimitRemaining(parseInt(response.headers['x-ratelimit-remaining']));
      }
      if (response.headers['x-ratelimit-reset']) {
        setRateLimitReset(parseInt(response.headers['x-ratelimit-reset']));
      }
      
      if (response.data && response.data.coins) {
        console.log('Specific coins fetched:', response.data.coins);
        setSpecificCoins(response.data.coins);
        setLastUpdate(new Date());
      } else {
        console.log('No specific coins data received');
        setSpecificCoins([]);
      }
    } catch (err) {
      console.error('Error fetching specific coins:', err);
      // Handle rate limiting gracefully
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. Please try again later.');
        console.log('Rate limit exceeded for specific coins API');
      } else {
        setError(err.message);
      }
      setSpecificCoins([]);
    } finally {
      setLoading(false);
    }
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

  // Fetch specific coins on context initialization and set up interval
  useEffect(() => {
    // Fetch immediately on mount
    fetchSpecificCoins();
    
    // Set up interval to refresh data every 5 minutes (same as top coins)
    const interval = setInterval(() => {
      if (shouldRefetch()) {
        fetchSpecificCoins();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const contextValue = {
    specificCoins,
    loading,
    error,
    lastUpdate,
    rateLimitRemaining,
    rateLimitReset,
    refetch: fetchSpecificCoins
  };

  return (
    <SpecificCoinsContext.Provider value={contextValue}>
      {children}
    </SpecificCoinsContext.Provider>
  );
}

export default SpecificCoinsContext;
