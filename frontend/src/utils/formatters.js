/**
 * Utility functions for formatting numbers, currencies, and other values
 */

/**
 * Format a number with commas for thousands
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default 2)
 * @returns {string} - Formatted number with commas
 */
export const formatNumberWithCommas = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return parseFloat(value).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format a dollar amount with commas and $ symbol
 * @param {number} value - The dollar amount to format
 * @param {number} decimals - Number of decimal places (default 2)
 * @returns {string} - Formatted dollar amount with $ symbol and commas
 */
export const formatDollarWithCommas = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0';
  }
  return `$${formatNumberWithCommas(value, decimals)}`;
};

/**
 * Format a percentage with specified decimal places and +/- sign
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places (default 1)
 * @param {boolean} showSign - Whether to show + sign for positive values (default true)
 * @returns {string} - Formatted percentage with appropriate sign
 */
export const formatPercentage = (value, decimals = 1, showSign = true) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  const num = parseFloat(value);
  if (num === 0) return '0%';
  
  const prefix = showSign ? (num > 0 ? '↗ ' : '↘ ') : '';
  return `${prefix}${Math.abs(num).toFixed(decimals)}%`;
};

// Add new responsive formatter functions

// Format dollar values with K/M/B for thousands/millions/billions on small screens
export const formatDollarResponsive = (value, screenSize = 'large') => {
  if (value === undefined || value === null || isNaN(value)) {
    return '$0';
  }
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  // For large screens, use commas
  if (screenSize === 'large') {
    return formatDollarWithCommas(value);
  }
  
  // For medium and small screens, use K/M/B format
  if (absValue >= 1000000000) {
    return `${sign}$${Math.round(absValue / 1000000000)}B`;
  } else if (absValue >= 1000000) {
    return `${sign}$${Math.round(absValue / 1000000)}M`;
  } else if (absValue >= 1000) {
    return `${sign}$${Math.round(absValue / 1000)}K`;
  } else if (absValue >= 100) {
    return `${sign}$${Math.round(absValue)}`;
  }
  
  // For very small values on medium/small screens, show 1 decimal place if under 100
  return absValue < 100 ? `${sign}$${absValue.toFixed(1)}` : `${sign}$${Math.round(absValue)}`;
};

// Format percentage values with more compact representation on smaller screens
export const formatPercentageResponsive = (value, screenSize = 'large') => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0%';
  }
  
  const num = parseFloat(value);
  if (num === 0) return '0%';
  
  const prefix = num > 0 ? '↗ ' : '↘ ';
  const absNum = Math.abs(num);
  
  // For large screens, use 1 decimal place
  if (screenSize === 'large') {
    return `${prefix}${absNum.toFixed(1)}%`;
  }
  
  // For medium screens, use K format for 1000+ and 1 decimal for small numbers
  if (screenSize === 'medium') {
    if (absNum >= 1000) {
      return `${prefix}${Math.round(absNum / 1000)}K%`;
    }
    return `${prefix}${absNum < 10 ? absNum.toFixed(1) : Math.round(absNum)}%`;
  }
  
  // For small screens, use compact format
  if (absNum >= 1000) {
    return `${prefix}${Math.round(absNum / 1000)}K%`;
  } else if (absNum < 10) {
    return `${prefix}${absNum.toFixed(1)}%`;
  }
  
  // Round to whole number for all other cases on small screens
  return `${prefix}${Math.round(absNum)}%`;
};

// Get appropriate screen size based on window width
export const getScreenSize = () => {
  if (typeof window === 'undefined') return 'large';
  
  const width = window.innerWidth;
  if (width <= 480) return 'small';
  if (width <= 768) return 'medium';
  return 'large';
};

