/**
 * Common cryptocurrency symbols and names for detection in text
 */
const COMMON_CRYPTO_SYMBOLS = [
  'BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'ADA', 
  'SOL', 'DOGE', 'DOT', 'AVAX', 'LINK', 'MATIC',
  'TRX', 'UNI', 'SHIB', 'LTC', 'EUL',
  'XLM', 'ALGO', 'BCH', 'ATOM', 'XMR', 'ETC'
];

// Single-letter tokens require more strict matching to avoid false positives
const SINGLE_LETTER_TOKENS = {
  'S': 'Sonic'
};

const CRYPTO_NAMES = {
  'BTC': ['Bitcoin', 'BTC'],
  'ETH': ['Ethereum', 'ETH'],
  'USDT': ['Tether', 'USDT'],
  'BNB': ['Binance Coin', 'BNB'],
  'XRP': ['Ripple', 'XRP'],
  'ADA': ['Cardano', 'ADA'],
  'SOL': ['Solana', 'SOL'],
  'DOGE': ['Dogecoin', 'DOGE'],
  'DOT': ['Polkadot', 'DOT'],
  'AVAX': ['Avalanche', 'AVAX'],
  'LINK': ['Chainlink', 'LINK'],
  'MATIC': ['Polygon', 'MATIC'],
  'TRX': ['Tron', 'TRX'],
  'UNI': ['Uniswap', 'UNI'],
  'SHIB': ['Shiba Inu', 'SHIB'],
  'LTC': ['Litecoin', 'LTC'],
  'EUL': ['Euler', 'EUL'],
  'S': ['Sonic', 'Sonic Finance'],
  'XLM': ['Stellar', 'XLM'],
  'ALGO': ['Algorand', 'ALGO'],
  'BCH': ['Bitcoin Cash', 'BCH'],
  'ATOM': ['Cosmos', 'ATOM'],
  'XMR': ['Monero', 'XMR'],
  'ETC': ['Ethereum Classic', 'ETC']
};

/**
 * Get full token name from symbol
 * @param {string} symbol - Token symbol
 * @returns {string} - Full token name or symbol if not found
 */
export const getTokenName = (symbol) => {
  if (!symbol) return '';
  
  const upperSymbol = symbol.toUpperCase();
  if (CRYPTO_NAMES[upperSymbol] && CRYPTO_NAMES[upperSymbol].length > 0) {
    return CRYPTO_NAMES[upperSymbol][0]; // Return first name (usually the full name)
  }
  
  return symbol;
};

/**
 * Extract cryptocurrency symbols mentioned in the given text
 * @param {string} text - The text to analyze
 * @returns {string[]} - Array of found cryptocurrency symbols
 */
export const extractRelevantCoins = (text) => {
  if (!text) return [];
  
  const upperText = text.toUpperCase();
  const foundCoins = [];
  
  // Check for regular symbol matches (non-single letters)
  COMMON_CRYPTO_SYMBOLS.forEach(symbol => {
    // Look for the symbol with word boundaries to avoid false positives
    const regex = new RegExp(`\\b${symbol}\\b`, 'i');
    if (regex.test(upperText)) {
      foundCoins.push(symbol);
    }
  });
  
  // Special handling for single-letter tokens to avoid false positives
  Object.entries(SINGLE_LETTER_TOKENS).forEach(([symbol, name]) => {
    // For single letter tokens, only match if full name is present
    if (text.toLowerCase().includes(name.toLowerCase())) {
      foundCoins.push(symbol);
    }
  });
  
  // Check for name matches
  Object.entries(CRYPTO_NAMES).forEach(([symbol, names]) => {
    if (foundCoins.includes(symbol)) return; // Skip if already found by symbol
    
    for (const name of names) {
      // Skip empty names or single letters
      if (!name || name.length <= 1) continue;
      
      const lowerName = name.toLowerCase();
      const lowerText = text.toLowerCase();
      
      // For short names (2-3 chars), use word boundary matching
      if (name.length <= 3) {
        const nameRegex = new RegExp(`\\b${name}\\b`, 'i');
        if (nameRegex.test(text)) {
          foundCoins.push(symbol);
          break;
        }
      } 
      // For longer names, a simple includes is usually sufficient
      else if (lowerText.includes(lowerName)) {
        foundCoins.push(symbol);
        break;
      }
    }
  });
  
  return [...new Set(foundCoins)]; // Remove duplicates
};

/**
 * Truncate text to a specific length
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, length = 150) => {
  if (!text) return '';
  
  if (text.length <= length) return text;
  
  return text.substring(0, length) + '...';
};

/**
 * Remove HTML tags from a string
 * @param {string} html - String containing HTML
 * @returns {string} - Plain text without HTML tags
 */
export const stripHtml = (html) => {
  if (!html) return '';
  
  // Simple regex to remove HTML tags
  return html.replace(/<[^>]*>?/gm, '');
};

export default {
  extractRelevantCoins,
  getTokenName,
  truncateText,
  stripHtml
}; 