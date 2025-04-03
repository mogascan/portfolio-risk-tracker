// frontend/src/components/Portfolio/ProfitLossChart.js
import React, { useState, useEffect } from 'react';
import { Paper, Group, Text, Stack, Button } from '@mantine/core';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { format } from 'date-fns';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useMarket } from '../../contexts/MarketContext';
import './Portfolio.css';

const timeRanges = [
  { label: '1D', value: '24h' },
  { label: '1W', value: '7d' },
  { label: '1M', value: '30d' },
  { label: '1Y', value: '1y' },
];

const formatTimeByRange = (time, range) => {
  const date = new Date(time);
  switch (range) {
    case '24h':
      return format(date, 'HH:mm');
    case '7d':
      return format(date, 'EEE');
    case '30d':
      return format(date, 'MMM d');
    case '1y':
      return format(date, 'MMM');
    default:
      return format(date, 'HH:mm');
  }
};

const formatDollar = (value) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '$0.00';
  }
  
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
};

const ProfitLossChart = () => {
  const { portfolio } = usePortfolio();
  const { topCoins } = useMarket();
  const [timeRange, setTimeRange] = useState('24h');
  const [chartData, setChartData] = useState([]);
  const [activeDataPoint, setActiveDataPoint] = useState(null);

  // Add debug logging
  useEffect(() => {
    console.log("ProfitLossChart - Portfolio:", {
      totalValue: portfolio.totalValue,
      assetCount: portfolio.assets.length,
      performance: portfolio.performance
    });
    console.log("ProfitLossChart - Daily performance:", portfolio.performance?.daily);
    console.log("ProfitLossChart - Top coins count:", topCoins.length);
  }, [portfolio, topCoins]);

  // Generate chart data whenever portfolio or market data changes
  useEffect(() => {
    if (portfolio.assets.length === 0 || topCoins.length === 0) {
      console.log("ProfitLossChart - No data available to generate chart");
      setChartData([]);
      return;
    }
    
    // Ensure we have valid performance metrics
    const dailyPerformance = parseFloat(portfolio.performance?.daily) || 0;
    console.log("ProfitLossChart - Using daily performance:", dailyPerformance);
    
    const data = generateChartData(
      portfolio.totalValue, 
      timeRange, 
      dailyPerformance, 
      portfolio.assets, 
      topCoins
    );
    console.log("ProfitLossChart - Generated chart data points:", data.length);
    console.log("ProfitLossChart - First and last data points:", {
      first: data[0],
      last: data[data.length - 1]
    });
    setChartData(data);
  }, [portfolio.totalValue, portfolio.assets, topCoins, timeRange, portfolio.performance?.daily]);

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const date = new Date(label);
      
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'white',
          padding: '12px 16px',
          border: '1px solid #F1F3F5',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
          <Text size="sm" color="dimmed" mb={4}>
            {format(date, 'MMM d, yyyy h:mm a')}
          </Text>
          <Text size="md" weight={700}>
            {formatDollar(value)}
          </Text>
        </div>
      );
    }
    return null;
  };

  const handleMouseMove = (data) => {
    if (data && data.activePayload) {
      setActiveDataPoint({
        value: data.activePayload[0].value,
        index: data.activeTooltipIndex
      });
    }
  };

  const handleMouseLeave = () => {
    setActiveDataPoint(null);
  };

  if (portfolio.totalValue === 0) {
    return <div className="empty-state">No portfolio data available.</div>;
  }

  // Add data debugging display
  const debugSection = (
    <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
      <div><strong>Debug Info:</strong></div>
      <div>Total Value: {formatDollar(portfolio.totalValue)}</div>
      <div>Assets: {portfolio.assets.length}</div>
      <div>Daily Performance: {portfolio.performance?.daily || 'N/A'}%</div>
      <div>Chart Data Points: {chartData.length}</div>
      <div>Time Range: {timeRange}</div>
    </div>
  );

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack spacing="xs">
        <Group position="apart" align="flex-start" style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            <Text size="lg" weight={700} mb={6}>
              Performance
            </Text>
            <Text size="sm" color="dimmed">
              {format(new Date(), 'MMM d yyyy')}
            </Text>
          </div>
          <div>
            <Group spacing={8}>
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant="subtle"
                  size="sm"
                  onClick={() => setTimeRange(range.value)}
                  styles={(theme) => ({
                    root: {
                      padding: '4px 8px',
                      minWidth: '36px',
                      textAlign: 'center',
                      '&:hover': {
                        backgroundColor: 'transparent'
                      }
                    },
                    label: {
                      fontSize: '14px',
                      color: timeRange === range.value ? '#339AF0' : theme.colors.gray[6],
                      fontWeight: timeRange === range.value ? 600 : 400
                    }
                  })}
                >
                  {range.label}
                </Button>
              ))}
            </Group>
          </div>
        </Group>

        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#339AF0" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#339AF0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(time) => formatTimeByRange(new Date(time), timeRange)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#868E96', fontSize: 12 }}
                dy={10}
                minTickGap={30}
              />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#868E96', fontSize: 10 }}
                dx={-10}
                tickFormatter={formatDollar}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#339AF0"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
              {activeDataPoint && chartData.length > 0 && activeDataPoint.index < chartData.length && (
                <ReferenceDot
                  x={chartData[activeDataPoint.index].date}
                  y={activeDataPoint.value}
                  r={6}
                  fill="#339AF0"
                  stroke="white"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {debugSection}
      </Stack>
    </Paper>
  );
};

// Helper function to generate more realistic chart data based on portfolio assets
const generateChartData = (currentValue, timeRange, dailyChange, assets, topCoins) => {
  const now = new Date();
  const data = [];
  const points = {
    '24h': 24,
    '7d': 7,
    '30d': 30,
    '1y': 12
  };

  const intervals = {
    '24h': 60 * 60 * 1000,
    '7d': 24 * 60 * 60 * 1000,
    '30d': 24 * 60 * 60 * 1000,
    '1y': 30 * 24 * 60 * 60 * 1000
  };

  const count = points[timeRange];
  const interval = intervals[timeRange];
  
  // Calculate how much of the daily change has happened at each point
  // This makes the chart end at the current value and reflect the actual daily change
  let dailyChangePercent = parseFloat(dailyChange) / 100;
  
  // Ensure dailyChangePercent is a valid number
  if (isNaN(dailyChangePercent)) {
    dailyChangePercent = 0.01; // Default to 1% if not valid
    console.log("ProfitLossChart - Using default daily change percent");
  }
  
  let startValue;
  
  switch(timeRange) {
    case '24h':
      // For 24h, use the daily percent change to calculate start value
      startValue = currentValue / (1 + dailyChangePercent);
      break;
    case '7d':
      // For 7d, assume a smoother change over the week
      // Use a multiplier based on daily change but smoothed for the period
      startValue = currentValue * (1 - (dailyChangePercent * 3));
      break;
    case '30d':
      // For 30d, create a more long-term trend
      startValue = currentValue * (1 - (dailyChangePercent * 8));
      break;
    case '1y':
      // For 1y, create an even longer trend with more variance
      startValue = currentValue * (1 - (dailyChangePercent * 15));
      break;
    default:
      startValue = currentValue * 0.9;
  }
  
  // Ensure startValue is positive and not too small compared to currentValue
  startValue = Math.max(startValue, currentValue * 0.8);
  console.log(`ProfitLossChart - Start value: ${startValue}, Current value: ${currentValue}`);
  
  let prevValue = startValue;
  
  // Create variations based on actual asset weights
  const volatilityMap = {};
  if (assets.length > 0 && topCoins.length > 0) {
    // Map of coin volatility based on actual market data
    assets.forEach(asset => {
      const coin = topCoins.find(c => 
        c.id === asset.coinId || 
        c.symbol.toLowerCase() === asset.symbol.toLowerCase()
      );
      
      if (coin) {
        const weight = asset.value / currentValue;
        const volatility = Math.abs((coin.price_change_percentage_24h_in_currency || coin.change24h || 0) / 100);
        volatilityMap[asset.symbol] = {
          weight,
          volatility: isNaN(volatility) ? 0.01 : volatility
        };
      }
    });
  }
  
  // Default volatility if we don't have enough data
  const defaultVolatility = 0.01;
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i) * interval);
    
    // Calculate weighted volatility
    let totalVolatility = defaultVolatility;
    if (Object.keys(volatilityMap).length > 0) {
      totalVolatility = Object.values(volatilityMap).reduce((sum, asset) => {
        return sum + (asset.volatility * asset.weight);
      }, 0);
    }
    
    // Smoother progression toward the end value
    const progressionFactor = (i / count);
    const targetValue = startValue + (currentValue - startValue) * progressionFactor;
    
    // Add some noise but keep the overall trend
    const noise = targetValue * totalVolatility * (Math.random() - 0.5) * 0.5; // Reduce noise
    let value = targetValue + noise;
    
    // Ensure the last point is exactly the current value
    if (i === count - 1) {
      value = currentValue;
    }
    
    data.push({
      date: time.getTime(), // Use timestamp instead of ISO string
      value: value
    });
    
    prevValue = value;
  }

  console.log("ProfitLossChart - Chart data sample:", data.slice(0, 3));
  return data;
};

export default ProfitLossChart;