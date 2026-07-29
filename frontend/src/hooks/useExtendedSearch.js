import { useState, useEffect } from 'react';
import axios from 'axios';

export const useSpecificCoins = () => {
  const [specificCoins, setSpecificCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSpecificCoins = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching specific coins beyond rank 500...');
      const response = await axios.get('http://localhost:8000/api/v1/market/specific-coins');
      
      if (response.data && response.data.coins) {
        console.log('Specific coins fetched:', response.data.coins);
        setSpecificCoins(response.data.coins);
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

  // Fetch specific coins on hook initialization
  useEffect(() => {
    fetchSpecificCoins();
  }, []);

  return {
    specificCoins,
    loading,
    error,
    refetch: fetchSpecificCoins
  };
};
