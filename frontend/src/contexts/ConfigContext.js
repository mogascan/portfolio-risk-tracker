import React, { createContext, useContext, useState, useEffect } from 'react';
import { useComputedColorScheme, useMantineColorScheme } from '@mantine/core';

// Create the context
const ConfigContext = createContext();

// Hook to use the config context
export const useConfig = () => useContext(ConfigContext);

// Provider component
export const ConfigProvider = ({ children }) => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const theme = useComputedColorScheme('light', { getInitialValueInEffect: false });
  
  // Get saved max loss percentage from localStorage or use default
  const getSavedMaxLossPercentage = () => {
    const savedMaxLoss = localStorage.getItem('maxLossPercentage');
    if (savedMaxLoss !== null && !isNaN(parseFloat(savedMaxLoss))) {
      return parseFloat(savedMaxLoss);
    }
    return 8.0; // Default to 8% (92% of total value as stop loss)
  };
  
  // Get saved take profit settings from localStorage or use defaults
  const getSavedTakeProfitSettings = () => {
    const savedSettings = localStorage.getItem('takeProfitSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Error parsing take profit settings:', e);
      }
    }
    return {
      targetValue: 0,
      targetPercentage: 20.0, // Default to 20% profit target
      entryValue: 0,
      entryDate: null
    };
  };
  
  // Initialize app configuration state
  const [config, setConfig] = useState({
    // API base URL - can be overridden with environment variable
    apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    
    // Default refresh interval in milliseconds (5 minutes)
    refreshInterval: parseInt(process.env.REACT_APP_REFRESH_INTERVAL || '300000'),
    
    // Default page size for tables
    defaultPageSize: 20,
    
    // Max items per API request
    maxItemsPerRequest: 250,
    
    // Maximum loss percentage (stop loss threshold)
    maxLossPercentage: getSavedMaxLossPercentage(),
    
    // Take profit settings
    takeProfit: getSavedTakeProfitSettings(),
    
    // Feature flags
    features: {
      marketStats: true,
      portfolio: true,
      chat: true,
      insights: true
    }
  });

  const setTheme = (value) => {
    if (value === 'dark' || value === 'light' || value === 'auto') {
      setColorScheme(value);
    }
  };

  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  // Function to update max loss percentage
  const updateMaxLossPercentage = (value) => {
    const maxLoss = parseFloat(value);
    if (!isNaN(maxLoss) && maxLoss >= 0) {
      setConfig({
        ...config,
        maxLossPercentage: maxLoss
      });
      localStorage.setItem('maxLossPercentage', maxLoss.toString());
    }
  };
  
  // Function to update take profit settings
  const updateTakeProfitSettings = (settings) => {
    setConfig({
      ...config,
      takeProfit: {
        ...config.takeProfit,
        ...settings
      }
    });
    localStorage.setItem('takeProfitSettings', JSON.stringify({
      ...config.takeProfit,
      ...settings
    }));
  };

  // Apply theme class to HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light-theme', 'dark-theme');
    root.classList.add(`${theme}-theme`);
    
    // Also set the data-theme attribute for CSS selectors
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ConfigContext.Provider value={{ 
      ...config, 
      theme,
      themePreference: colorScheme,
      setTheme,
      toggleTheme, 
      updateMaxLossPercentage,
      updateTakeProfitSettings
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export default ConfigContext; 
