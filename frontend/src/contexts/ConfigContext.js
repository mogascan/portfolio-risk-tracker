import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const ConfigContext = createContext();

// Hook to use the config context
export const useConfig = () => useContext(ConfigContext);

// Provider component
export const ConfigProvider = ({ children }) => {
  // Get system preference for dark mode
  const getSystemPreference = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // Default to light if not detectable
  };

  // Get saved theme from localStorage or use system preference as fallback
  const getSavedTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    return getSystemPreference();
  };
  
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
  
  // Initialize theme state
  const [config, setConfig] = useState({
    // API base URL - can be overridden with environment variable
    apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    
    // Default refresh interval in milliseconds (5 minutes)
    refreshInterval: parseInt(process.env.REACT_APP_REFRESH_INTERVAL || '300000'),
    
    // Default page size for tables
    defaultPageSize: 20,
    
    // Max items per API request
    maxItemsPerRequest: 250,
    
    // User preference for theme (light or dark)
    theme: getSavedTheme(),
    
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

  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = config.theme === 'light' ? 'dark' : 'light';
    setConfig({
      ...config,
      theme: newTheme
    });
    localStorage.setItem('theme', newTheme);
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
    root.classList.add(`${config.theme}-theme`);
    
    // Also set the data-theme attribute for CSS selectors
    root.setAttribute('data-theme', config.theme);
  }, [config.theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only update if user hasn't explicitly set a preference
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setConfig(prev => ({
          ...prev,
          theme: newTheme
        }));
      }
    };
    
    // Add listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // For older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return (
    <ConfigContext.Provider value={{ 
      ...config, 
      toggleTheme, 
      updateMaxLossPercentage,
      updateTakeProfitSettings
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export default ConfigContext; 