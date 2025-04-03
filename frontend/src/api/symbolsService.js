import axios from 'axios';
import { saveToStorage, loadFromStorage } from '../utils/storageUtils';

// Webhook server URL - this would come from your environment configuration
const WEBHOOK_SERVER_URL = process.env.REACT_APP_WEBHOOK_SERVER_URL || 'http://localhost:8000';

const symbolsService = {
  // Fetch all TradingView symbols mapped from CoinGecko
  getSymbols: async () => {
    try {
      // Try to load from cache first
      const cachedSymbols = loadFromStorage('tv_symbols_cache');
      const cacheTime = loadFromStorage('tv_symbols_cache_time');
      
      // Check if cache is valid (less than 1 hour old)
      const now = new Date().getTime();
      const cacheAge = now - (cacheTime || 0);
      const CACHE_VALID_TIME = 60 * 60 * 1000; // 1 hour
      
      if (cachedSymbols && cacheAge < CACHE_VALID_TIME) {
        return cachedSymbols;
      }
      
      // Fetch fresh data
      const response = await axios.get(`${WEBHOOK_SERVER_URL}/api/symbols`);
      
      // Cache the response
      saveToStorage('tv_symbols_cache', response.data);
      saveToStorage('tv_symbols_cache_time', now);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching TradingView symbols:', error);
      
      // Return cached data if available, even if expired
      const cachedSymbols = loadFromStorage('tv_symbols_cache');
      if (cachedSymbols) {
        return cachedSymbols;
      }
      
      throw error;
    }
  },
  
  // Force refresh of symbols
  refreshSymbols: async (exchange = 'BINANCE') => {
    try {
      const response = await axios.post(`${WEBHOOK_SERVER_URL}/api/symbols/refresh`, null, {
        params: { exchange }
      });
      
      // Update cache
      saveToStorage('tv_symbols_cache', null);
      
      return response.data;
    } catch (error) {
      console.error('Error refreshing TradingView symbols:', error);
      throw error;
    }
  },
  
  // Get alert setup instructions
  getAlertSetup: async () => {
    try {
      const response = await axios.get(`${WEBHOOK_SERVER_URL}/api/symbols/alert-setup`);
      return response.data;
    } catch (error) {
      console.error('Error fetching alert setup:', error);
      throw error;
    }
  },
  
  // Get excluded symbols
  getExcludedSymbols: () => {
    return loadFromStorage('excluded_tv_symbols', []);
  },
  
  // Save excluded symbols
  saveExcludedSymbols: (symbols) => {
    return saveToStorage('excluded_tv_symbols', symbols);
  },
  
  // Generate TradingView alert instructions document
  generateAlertInstructions: async () => {
    try {
      const alertSetup = await symbolsService.getAlertSetup();
      const excludedSymbols = symbolsService.getExcludedSymbols();
      
      // Filter out excluded symbols
      const filteredSymbols = alertSetup.symbols.filter(s => 
        !excludedSymbols.includes(s.symbol));
      
      // Generate markdown instructions
      let instructions = `# TradingView Alert Setup Instructions\n\n`;
      instructions += `*Generated on ${new Date().toLocaleString()}*\n\n`;
      instructions += `## 1. Apply the Golden/Death Cross Detector Indicator\n\n`;
      instructions += `First, add the Golden/Death Cross Detector indicator to each chart.\n\n`;
      instructions += `## 2. Configure the following ${filteredSymbols.length} alerts:\n\n`;
      
      // Group by conditions to minimize repeating instructions
      const alertsByCondition = {
        "Approaching Golden Cross": [],
        "Golden Cross Complete": [],
        "Death Cross": []
      };
      
      // Group symbols by condition
      filteredSymbols.forEach(symbol => {
        symbol.alerts.forEach(alert => {
          alertsByCondition[alert.condition].push({
            symbol: symbol.symbol,
            name: symbol.name,
            rank: symbol.rank,
            message: alert.message
          });
        });
      });
      
      // Generate instructions for each condition type
      Object.keys(alertsByCondition).forEach(condition => {
        const alertsForCondition = alertsByCondition[condition];
        
        instructions += `### ${condition} Alert:\n\n`;
        instructions += `Set up this alert for these ${alertsForCondition.length} symbols:\n\n`;
        instructions += "```\n";
        alertsForCondition.forEach(alert => {
          instructions += `${alert.rank}. ${alert.name} (${alert.symbol})\n`;
        });
        instructions += "```\n\n";
        
        instructions += `For each symbol:\n`;
        instructions += `1. Open the chart for the symbol\n`;
        instructions += `2. Right-click and select "Create Alert"\n`;
        instructions += `3. Select condition: "${condition}"\n`;
        instructions += `4. Set "Trigger" to "Once Per Bar Close"\n`;
        instructions += `5. Under "Actions", check "Webhook URL"\n`;
        instructions += `6. Enter webhook URL: \`${WEBHOOK_SERVER_URL}/api/tradingview/webhook\`\n`;
        instructions += `7. Enter message format (replace with proper symbol for each):\n\n`;
        
        instructions += "```json\n";
        instructions += `${alertsForCondition[0].message}\n`;
        instructions += "```\n\n";
      });
      
      instructions += `## Using Trading View Alert Creator Extension (Recommended)\n\n`;
      instructions += `For easier setup, consider using a TradingView alert creation extension that can create multiple alerts at once.\n`;
      
      return instructions;
    } catch (error) {
      console.error('Error generating alert instructions:', error);
      throw error;
    }
  }
};

export default symbolsService; 