import React, { memo } from 'react';
import { Text, useMantineColorScheme, Group } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { formatDollarWithCommas, formatPercentage } from '../utils/formatters';

function StickyTotalValue({ visible }) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const { portfolio } = usePortfolio();
  const { totalValue = 0, performance = {} } = portfolio || {};
  const dailyChange = performance.daily || 0;
  const isPositive = dailyChange > 0;
  const isNegative = dailyChange < 0;
  
  // Determine color based on daily performance - with higher contrast
  const changeColor = isPositive 
    ? (isDark ? '#5CFF5C' : '#008F00') 
    : isNegative 
      ? (isDark ? '#FF5C5C' : '#D00000') 
      : 'dimmed';
  
  // Choose arrow icon based on direction
  const ArrowIcon = isPositive ? IconArrowUpRight : IconArrowDownRight;

  return (
    <div 
      style={{
        position: 'absolute',
        left: '60px', // Position it after the burger menu
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? '0' : '-10px'})`,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: visible ? 'auto' : 'none',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Text
          weight={800}
          style={{
            fontSize: '24px',
            color: '#339AF0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {formatDollarWithCommas(totalValue)}
        </Text>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginLeft: '12px', 
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.07)'
        }}>
          <ArrowIcon 
            size={18}
            stroke={3}
            style={{ 
              color: changeColor,
              marginRight: '3px'
            }} 
          />
          <Text
            size="sm"
            weight={700}
            style={{
              whiteSpace: 'nowrap',
              color: changeColor,
              letterSpacing: '0.01em'
            }}
          >
            {formatPercentage(dailyChange)}
          </Text>
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(StickyTotalValue); 