// frontend/src/api/portfolio.js
import apiClient from './client';

/**
 * Fetch portfolio summary
 */
export const fetchPortfolioSummary = async () => {
  try {
    const response = await apiClient.get('/portfolio/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    throw error;
  }
};

/**
 * Fetch portfolio performance
 * @param {string} period - Time period (24h, 7d, 30d, 90d, 1y)
 */
export const fetchPortfolioPerformance = async (period = '30d') => {
  try {
    const response = await apiClient.get('/portfolio/performance', {
      params: { period }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio performance:', error);
    throw error;
  }
};

/**
 * Fetch all assets in the portfolio
 */
export const fetchAssets = async () => {
  try {
    const response = await apiClient.get('/portfolio/assets');
    return response.data;
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
};

/**
 * Fetch transactions
 * @param {number} limit - Number of transactions to return
 * @param {number} offset - Offset for pagination
 */
export const fetchTransactions = async (limit = 50, offset = 0) => {
  try {
    const response = await apiClient.get('/portfolio/transactions', {
      params: { limit, offset }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

/**
 * Fetch tax summary
 * @param {number} year - Tax year
 */
export const fetchTaxSummary = async (year = new Date().getFullYear()) => {
  try {
    const response = await apiClient.get('/portfolio/tax', {
      params: { year }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tax summary:', error);
    throw error;
  }
};

// Return default portfolio data as fallback
console.log('Using local fallback data instead');
return {
  assets: [
    {
      id: 1,
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: 0.5,
      purchasePrice: 30000,
      purchaseDate: new Date('2023-01-01'),
      currentPrice: 55000,
      value: 27500,
    },
    {
      id: 2,
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 5,
      purchasePrice: 1500,
      purchaseDate: new Date('2023-02-01'),
      currentPrice: 2500,
      value: 12500,
    },
    {
      id: 3,
      symbol: 'EUL',
      name: 'Euler',
      amount: 1000,
      purchasePrice: 3.5,
      purchaseDate: new Date('2023-03-01'),
      currentPrice: 6.04,
      value: 6040,
    },
    {
      id: 4,
      symbol: 'S',
      name: 'Sonic',
      amount: 1000,
      purchasePrice: 1.0,
      purchaseDate: new Date('2023-04-01'),
      currentPrice: 1.2,
      value: 1200,
    }
  ],
  totalValue: 47240,
  performance: {
    daily: 2.3,
    weekly: 5.7,
    monthly: 12.4,
    yearly: 35.2
  }
};
