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

