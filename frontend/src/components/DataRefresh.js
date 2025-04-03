import React, { useState, useEffect } from 'react';
import { ActionIcon, Tooltip, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useMarket } from '../contexts/MarketContext';
import { usePortfolio } from '../contexts/PortfolioContext';

function DataRefresh({ size = 'md' }) {
  const { colorScheme } = useMantineColorScheme();
  const mantineTheme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [nextRefreshTime, setNextRefreshTime] = useState(null);
  
  // Get the market context for checking rate limits and refreshing
  const { 
    fetchTopCoins, 
    rateLimitRemaining, 
    rateLimitReset, 
    lastUpdate,
    loading: marketLoading 
  } = useMarket();
  
  // Get portfolio context for refreshing portfolio data
  const { fetchPortfolio, loading: portfolioLoading } = usePortfolio();

  // Refresh function that updates all data
  const refreshAllData = async () => {
    if (!isAvailable || isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      // Fetch market data first
      await fetchTopCoins();
      
      // Then fetch portfolio data which may depend on market data
      await fetchPortfolio();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check if refresh is available based on rate limits and time since last refresh
  useEffect(() => {
    // Default refresh interval is 5 minutes
    const refreshInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    const calculateRefreshAvailability = () => {
      // If we're already loading data, refresh is not available
      if (marketLoading || portfolioLoading) {
        setIsAvailable(false);
        return;
      }
      
      // If we've never updated before, refresh is available
      if (!lastUpdate) {
        setIsAvailable(true);
        return;
      }
      
      const now = new Date();
      const timeSinceLastUpdate = now - new Date(lastUpdate);
      
      // If rate limit is low, check if reset time has passed
      if (rateLimitRemaining !== null && rateLimitRemaining <= 10) {
        if (rateLimitReset) {
          const resetTime = new Date(rateLimitReset * 1000);
          if (now < resetTime) {
            setIsAvailable(false);
            setNextRefreshTime(resetTime);
            return;
          }
        }
      }
      
      // If we're within the refresh interval, disable refresh
      if (timeSinceLastUpdate < refreshInterval) {
        setIsAvailable(false);
        const nextTime = new Date(new Date(lastUpdate).getTime() + refreshInterval);
        setNextRefreshTime(nextTime);
      } else {
        setIsAvailable(true);
      }
    };
    
    calculateRefreshAvailability();
    
    // Check availability every 30 seconds
    const checkInterval = setInterval(calculateRefreshAvailability, 30000);
    
    return () => clearInterval(checkInterval);
  }, [lastUpdate, rateLimitRemaining, rateLimitReset, marketLoading, portfolioLoading]);

  // Format the next refresh time for display
  const formatNextRefreshTime = () => {
    if (!nextRefreshTime) return '';
    
    const now = new Date();
    const diffMs = nextRefreshTime - now;
    
    if (diffMs <= 0) return 'Refresh available now';
    
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMinutes > 0) {
      return `Refresh available in ${diffMinutes}m ${diffSeconds}s`;
    } else {
      return `Refresh available in ${diffSeconds}s`;
    }
  };

  // Determine button color based on availability
  const buttonColor = isAvailable ? 'lime' : (isDark ? 'gray.7' : 'gray.4');
  const iconColor = isAvailable ? (isDark ? 'lime' : 'lime.7') : (isDark ? 'gray.5' : 'gray.6');
  
  // Determine tooltip message
  const tooltipMessage = isRefreshing 
    ? 'Refreshing data...'
    : (isAvailable 
        ? 'Refresh all data now' 
        : `${formatNextRefreshTime()}`);

  return (
    <Tooltip 
      label={tooltipMessage}
      withArrow
      position="bottom"
      color={isDark ? 'dark.9' : 'dark.9'}
      styles={{
        tooltip: {
          fontSize: '12px',
          padding: '8px 12px',
          color: 'white'
        }
      }}
    >
      <ActionIcon
        variant="transparent"
        color={iconColor}
        onClick={refreshAllData}
        size={size}
        loading={isRefreshing}
        disabled={!isAvailable}
        style={{
          cursor: isAvailable ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          backgroundColor: 'transparent'
        }}
        styles={{
          root: {
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
            }
          }
        }}
      >
        <IconRefresh 
          size={18} 
          style={{ 
            color: isRefreshing ? undefined : iconColor,
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
          }} 
        />
      </ActionIcon>
    </Tooltip>
  );
}

export default DataRefresh; 