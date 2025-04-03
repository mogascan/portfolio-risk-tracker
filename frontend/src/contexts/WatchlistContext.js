// frontend/src/contexts/WatchlistContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMarket } from './MarketContext';
import { updateWatchlistTokens } from '../api/newsService';

const WatchlistContext = createContext();

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};

export function WatchlistProvider({ children }) {
  const { topCoins } = useMarket();
  
  // Initialize watchlist from localStorage
  const [watchlist, setWatchlist] = useState(() => {
    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
      try {
        const parsedWatchlist = JSON.parse(savedWatchlist);
        console.log('[WatchlistContext] Loaded watchlist from localStorage:', parsedWatchlist);
        return parsedWatchlist;
      } catch (err) {
        console.error('Error parsing watchlist data:', err);
        return [];
      }
    }
    console.log('[WatchlistContext] No saved watchlist found, starting with empty list');
    return [];
  });
  
  // Track when watchlist was last updated to trigger API updates
  const [watchlistUpdated, setWatchlistUpdated] = useState(Date.now());

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    console.log('[WatchlistContext] Watchlist changed, updating storage and backend:', watchlist);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    // Update the timestamp when watchlist changes
    setWatchlistUpdated(Date.now());
    
    // Update watchlist on backend
    updateWatchlistTokens(watchlist)
      .then(response => {
        console.log('[WatchlistContext] Watchlist updated on backend:', response);
      })
      .catch(error => {
        console.error('[WatchlistContext] Failed to update watchlist on backend:', error);
      });
      
  }, [watchlist]);

  // Synchronize with backend on mount
  useEffect(() => {
    console.log('[WatchlistContext] Initial sync with backend');
    updateWatchlistTokens(watchlist)
      .then(response => {
        console.log('[WatchlistContext] Initial backend sync response:', response);
      })
      .catch(error => {
        console.error('[WatchlistContext] Failed initial backend sync:', error);
      });
  }, []);

  // Get current data for watchlist items from topCoins
  const watchlistWithData = watchlist.map(coinId => {
    console.log(`[WatchlistContext] Looking for coin with ID: ${coinId}`);
    const coinData = topCoins.find(coin => coin.id === coinId);
    console.log(`[WatchlistContext] Found coinData for ${coinId}:`, coinData ? 'Yes' : 'No');
    
    // If the coin is not found in topCoins, return a minimal placeholder object
    if (!coinData) {
      console.log(`[WatchlistContext] Creating placeholder for missing coin: ${coinId}`);
      return { 
        id: coinId, 
        name: coinId, 
        symbol: coinId, 
        error: true,
        market_cap_rank: null,
        current_price: null,
        priceUsd: null,
        price_change_percentage_24h_in_currency: null,
        price_change_percentage_7d_in_currency: null,
        price_change_percentage_30d_in_currency: null,
        price_change_percentage_1y_in_currency: null,
        change24h: null,
        change7d: null,
        change30d: null,
        market_cap: null,
        marketCap: null,
        total_volume: null,
        volume24h: null
      };
    }
    
    return coinData;
  });

  // Add coin to watchlist
  const addToWatchlist = (coinId) => {
    if (!watchlist.includes(coinId)) {
      setWatchlist([...watchlist, coinId]);
    }
  };

  // Remove coin from watchlist
  const removeFromWatchlist = (coinId) => {
    setWatchlist(watchlist.filter(id => id !== coinId));
  };

  // Check if a coin is in the watchlist
  const isInWatchlist = (coinId) => {
    return watchlist.includes(coinId);
  };
  
  // Get the symbols of coins in the watchlist for use in news filtering
  const getWatchlistCoins = () => {
    // Include both symbols and names for more comprehensive news matching
    const keywords = watchlistWithData.flatMap(coin => {
      const items = [];
      
      // Add symbol (uppercase for consistency with API conventions)
      if (coin.symbol) {
        items.push(coin.symbol.toUpperCase());
      }
      
      // Add full name (lowercase for better text matching in content)
      if (coin.name) {
        items.push(coin.name.toLowerCase());
      }
      
      return items;
    }).filter(keyword => keyword !== '');
    
    // Remove duplicates
    const uniqueKeywords = [...new Set(keywords)];
    
    console.log('WatchlistContext - getWatchlistCoins (with names):', uniqueKeywords);
    return uniqueKeywords;
  };

  const value = {
    watchlist,
    watchlistWithData,
    watchlistUpdated,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    getWatchlistCoins
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}; 