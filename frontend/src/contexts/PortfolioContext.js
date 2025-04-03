// frontend/src/contexts/PortfolioContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMarket } from './MarketContext';
import { updatePortfolioHoldings } from '../api/newsService';

const PortfolioContext = createContext();

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

// Default sample portfolio data
const defaultPortfolio = {
  assets: [
    {
      id: 1,
      symbol: 'S',
      name: 'Sonic',
      coinId: 'sonic',
      amount: 1000,
      purchasePrice: 0.5,
      purchaseDate: new Date('2024-01-01'),
      currentPrice: 0.55,
      value: 550,
      price_change_24h: 10.0
    },
    {
      id: 2,
      symbol: 'EUL',
      name: 'Euler',
      coinId: 'euler',
      amount: 250,
      purchasePrice: 4.0,
      purchaseDate: new Date('2024-02-01'),
      currentPrice: 4.2,
      value: 1050,
      price_change_24h: 5.0
    }
  ],
  totalValue: 1600,
  performance: {
    daily: 7.5,
    weekly: 12.8,
    monthly: 5.6,
    yearly: 20.4
  }
};

// Helper function to safely parse JSON with date objects
const parsePortfolioData = (jsonData) => {
  try {
    const data = JSON.parse(jsonData);
    
    // Convert date strings back to Date objects
    if (data.assets && Array.isArray(data.assets)) {
      data.assets = data.assets.map(asset => ({
        ...asset,
        purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : new Date()
      }));
    }
    
    return data;
  } catch (err) {
    console.error('Error parsing portfolio data:', err);
    return null;
  }
};

export function PortfolioProvider({ children }) {
  const { topCoins, getCoinPrice, getCoin24hChange } = useMarket();
  const [loading, setLoading] = useState(false);
  
  // Initialize state from localStorage or default data
  const [portfolio, setPortfolio] = useState(() => {
    const savedPortfolio = localStorage.getItem('portfolio');
    if (savedPortfolio) {
      const parsedData = parsePortfolioData(savedPortfolio);
      return parsedData || defaultPortfolio;
    }
    return defaultPortfolio;
  });

  // Save portfolio to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    
    // Send portfolio holdings to backend for news filtering
    // Include symbols for backend processing and news filtering
    const holdingsData = portfolio.assets.map(asset => ({
      symbol: asset.symbol.toUpperCase(),
      name: asset.name,
      quantity: asset.amount
    }));
    
    console.log('Sending portfolio holdings to backend:', holdingsData);
    
    updatePortfolioHoldings(holdingsData)
      .then(response => {
        console.log('Portfolio holdings updated on backend:', response);
      })
      .catch(error => {
        console.error('Failed to update portfolio holdings on backend:', error);
      });
  }, [portfolio]);

  // Function to explicitly fetch and update portfolio data
  const fetchPortfolio = async () => {
    if (topCoins.length === 0) return;
    
    setLoading(true);
    
    try {
      // Update the portfolio with the latest top coins data
      setPortfolio(prev => {
        console.log("=== Portfolio Update (Manual Refresh) ===");
        const updatedAssets = prev.assets.map(asset => {
          // Find the coin in topCoins
          const coin = topCoins.find(c => 
            c.id === asset.coinId || 
            c.symbol.toLowerCase() === asset.symbol.toLowerCase()
          );

          if (coin) {
            // Use the new property names from the API
            const currentPrice = coin.priceUsd || 0;
            const value = asset.amount * currentPrice;
            console.log(`Asset: ${asset.symbol}, Amount: ${asset.amount}, Current Price: $${currentPrice}, Value: $${value.toFixed(2)}`);
            return {
              ...asset,
              currentPrice,
              value,
              price_change_24h: coin.change24h || 0
            };
          }
          return asset;
        });

        const totalValue = updatedAssets.reduce((sum, asset) => sum + asset.value, 0);
        console.log(`Total Portfolio Value: $${totalValue.toFixed(2)}`);
        
        const totalCost = calculateTotalCost(updatedAssets);
        const absoluteProfit = calculateAbsoluteProfit(updatedAssets, totalValue);
        
        // Calculate overall portfolio performance
        const dailyPerformance = calculateDailyPerformance(updatedAssets, totalValue);
        const weeklyPerformance = calculateWeeklyPerformance(updatedAssets, totalValue);
        const monthlyPerformance = calculateMonthlyPerformance(updatedAssets, totalValue);
        const overallPerformance = calculateOverallPerformance(updatedAssets, totalValue);

        return {
          ...prev,
          assets: updatedAssets,
          totalValue,
          totalCost,
          absoluteProfit,
          performance: {
            ...prev.performance,
            daily: dailyPerformance,
            weekly: weeklyPerformance,
            monthly: monthlyPerformance,
            overall: overallPerformance
          }
        };
      });
    } catch (error) {
      console.error('Error updating portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update portfolio with live market data when topCoins changes
  useEffect(() => {
    fetchPortfolio();
  }, [topCoins]);

  // Calculate daily performance weighted by asset allocation
  const calculateDailyPerformance = (assets, totalValue) => {
    if (assets.length === 0 || totalValue === 0) return 0;
    
    const performance = assets.reduce((performance, asset) => {
      const weight = asset.value / totalValue;
      const contribution = weight * (asset.price_change_24h || 0);
      return performance + contribution;
    }, 0);
    
    // Return a number, not a string
    return parseFloat(performance.toFixed(2));
  };

  // Calculate weekly performance weighted by asset allocation
  const calculateWeeklyPerformance = (assets, totalValue) => {
    if (assets.length === 0 || totalValue === 0) return 0;
    
    const performance = assets.reduce((performance, asset) => {
      const coin = topCoins.find(c => 
        c.id === asset.coinId || 
        c.symbol.toLowerCase() === asset.symbol.toLowerCase()
      );
      
      const weeklyChange = coin?.change7d || 0;
      const weight = asset.value / totalValue;
      const contribution = weight * weeklyChange;
      return performance + contribution;
    }, 0);
    
    // Return a number, not a string
    return parseFloat(performance.toFixed(2));
  };

  // Calculate monthly performance weighted by asset allocation
  const calculateMonthlyPerformance = (assets, totalValue) => {
    if (assets.length === 0 || totalValue === 0) return 0;
    
    const performance = assets.reduce((performance, asset) => {
      const coin = topCoins.find(c => 
        c.id === asset.coinId || 
        c.symbol.toLowerCase() === asset.symbol.toLowerCase()
      );
      
      const monthlyChange = coin?.change30d || 0;
      const weight = asset.value / totalValue;
      const contribution = weight * monthlyChange;
      return performance + contribution;
    }, 0);
    
    // Return a number, not a string
    return parseFloat(performance.toFixed(2));
  };

  // Calculate overall performance (total profit/loss percentage)
  const calculateOverallPerformance = (assets, totalValue) => {
    if (assets.length === 0 || totalValue === 0) return 0;
    
    const totalCost = assets.reduce((sum, asset) => sum + (asset.amount * asset.purchasePrice), 0);
    if (totalCost === 0) return 0;
    
    const profitLossPercent = ((totalValue - totalCost) / totalCost) * 100;
    
    // Return a number, not a string
    return parseFloat(profitLossPercent.toFixed(2));
  };

  // Calculate total cost of all assets
  const calculateTotalCost = (assets) => {
    console.log("=== Total Cost Calculation ===");
    let totalCost = 0;
    
    assets.forEach(asset => {
      const assetCost = asset.amount * asset.purchasePrice;
      console.log(`Asset: ${asset.symbol}, Amount: ${asset.amount}, Purchase Price: $${asset.purchasePrice}, Cost: $${assetCost.toFixed(2)}`);
      totalCost += assetCost;
    });
    
    console.log(`Total Portfolio Cost: $${totalCost.toFixed(2)}`);
    return totalCost;
  };
  
  // Calculate absolute profit/loss (in dollars)
  const calculateAbsoluteProfit = (assets, totalValue) => {
    const totalCost = calculateTotalCost(assets);
    const profit = totalValue - totalCost;
    console.log("=== Profit Calculation ===");
    console.log(`Total Value: $${totalValue.toFixed(2)}`);
    console.log(`Total Cost: $${totalCost.toFixed(2)}`);
    console.log(`Profit: $${profit.toFixed(2)}`);
    return profit;
  };

  const addAsset = (newAsset) => {
    setPortfolio(prev => {
      // Find coin data from market context
      const coin = topCoins.find(c => 
        c.id === newAsset.coinId || 
        c.symbol.toLowerCase() === newAsset.symbol.toLowerCase()
      );
      
      const currentPrice = coin?.current_price || newAsset.purchasePrice;
      const price_change_24h = coin?.price_change_percentage_24h || 0;
      
      const updatedAssets = [...prev.assets, {
        id: Date.now(),
        symbol: newAsset.symbol,
        name: newAsset.name || coin?.name || newAsset.symbol,
        coinId: newAsset.coinId || coin?.id,
        amount: newAsset.amount,
        purchasePrice: newAsset.purchasePrice,
        purchaseDate: newAsset.purchaseDate,
        currentPrice,
        value: newAsset.amount * currentPrice,
        price_change_24h
      }];

      const totalValue = updatedAssets.reduce((sum, asset) => sum + asset.value, 0);
      const totalCost = calculateTotalCost(updatedAssets);
      const absoluteProfit = calculateAbsoluteProfit(updatedAssets, totalValue);
      
      const dailyPerformance = calculateDailyPerformance(updatedAssets, totalValue);
      const weeklyPerformance = calculateWeeklyPerformance(updatedAssets, totalValue);
      const monthlyPerformance = calculateMonthlyPerformance(updatedAssets, totalValue);
      const overallPerformance = calculateOverallPerformance(updatedAssets, totalValue);

      return {
        ...prev,
        assets: updatedAssets,
        totalValue,
        totalCost,
        absoluteProfit,
        performance: {
          ...prev.performance,
          daily: dailyPerformance,
          weekly: weeklyPerformance,
          monthly: monthlyPerformance,
          overall: overallPerformance
        }
      };
    });
  };

  const removeAsset = (assetId) => {
    setPortfolio(prev => {
      const updatedAssets = prev.assets.filter(asset => asset.id !== assetId);
      const totalValue = updatedAssets.reduce((sum, asset) => sum + asset.value, 0);
      const totalCost = calculateTotalCost(updatedAssets);
      const absoluteProfit = calculateAbsoluteProfit(updatedAssets, totalValue);
      
      const dailyPerformance = calculateDailyPerformance(updatedAssets, totalValue);
      const weeklyPerformance = calculateWeeklyPerformance(updatedAssets, totalValue);
      const monthlyPerformance = calculateMonthlyPerformance(updatedAssets, totalValue);
      const overallPerformance = calculateOverallPerformance(updatedAssets, totalValue);

      return {
        ...prev,
        assets: updatedAssets,
        totalValue,
        totalCost,
        absoluteProfit,
        performance: {
          ...prev.performance,
          daily: dailyPerformance,
          weekly: weeklyPerformance,
          monthly: monthlyPerformance,
          overall: overallPerformance
        }
      };
    });
  };

  const updateAsset = (assetId, updates) => {
    setPortfolio(prev => {
      const updatedAssets = prev.assets.map(asset => {
        if (asset.id === assetId) {
          const updatedAsset = { ...asset, ...updates };
          
          // If amount is updated, recalculate value
          if (updates.amount) {
            updatedAsset.value = updatedAsset.amount * updatedAsset.currentPrice;
          }
          
          return updatedAsset;
        }
        return asset;
      });

      const totalValue = updatedAssets.reduce((sum, asset) => sum + asset.value, 0);
      const totalCost = calculateTotalCost(updatedAssets);
      const absoluteProfit = calculateAbsoluteProfit(updatedAssets, totalValue);
      
      const dailyPerformance = calculateDailyPerformance(updatedAssets, totalValue);
      const weeklyPerformance = calculateWeeklyPerformance(updatedAssets, totalValue);
      const monthlyPerformance = calculateMonthlyPerformance(updatedAssets, totalValue);
      const overallPerformance = calculateOverallPerformance(updatedAssets, totalValue);

      return {
        ...prev,
        assets: updatedAssets,
        totalValue,
        totalCost,
        absoluteProfit,
        performance: {
          ...prev.performance,
          daily: dailyPerformance,
          weekly: weeklyPerformance,
          monthly: monthlyPerformance,
          overall: overallPerformance
        }
      };
    });
  };

  const clearPortfolio = () => {
    // Reset to empty portfolio
    const emptyPortfolio = {
      assets: [],
      totalValue: 0,
      totalCost: 0,
      absoluteProfit: 0,
      performance: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
        overall: 0
      }
    };
    setPortfolio(emptyPortfolio);
    localStorage.setItem('portfolio', JSON.stringify(emptyPortfolio));
  };

  // Get an array of portfolio coin symbols for news filtering
  const getPortfolioCoins = () => {
    return portfolio.assets.map(asset => asset.symbol.toUpperCase());
  };

  const value = {
    portfolio,
    addAsset,
    removeAsset,
    updateAsset,
    clearPortfolio,
    getPortfolioCoins,
    fetchPortfolio,
    loading
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export default PortfolioContext;