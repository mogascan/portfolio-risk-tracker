import React, { useState, useEffect } from 'react';
import { Paper, Group, Text, Stack, Button, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { usePortfolio } from '../../contexts/PortfolioContext';
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
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
};

// Custom tooltip component for the chart
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
          {format(new Date(label), 'MMM dd, yyyy h:mm a')}
        </p>
        <p style={{ margin: 0, color: '#339AF0' }}>
          {formatDollar(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

function DashboardPerformanceChart() {
  const { portfolio } = usePortfolio();
  const [timeRange, setTimeRange] = useState('24h');
  const [chartData, setChartData] = useState([]);
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Get theme-appropriate border color
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  // Generate chart data whenever portfolio changes or time range changes
  useEffect(() => {
    const data = generateChartData(portfolio.totalValue, timeRange);
    setChartData(data);
  }, [portfolio.totalValue, timeRange]);

  if (portfolio.totalValue === 0) {
    return <div className="empty-state">No portfolio data available.</div>;
  }

  return (
    <Paper 
      p="md" 
      radius="md" 
      shadow="none"
      withBorder={false}
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDark ? theme.colors.dark[6] : 'white'
      }}
    >
      <Stack spacing="xs" style={{ flex: 1 }}>
        <Group position="apart" align="flex-start" style={{ width: '100%' }}>
          <div>
            <Text size="md" weight={700} style={{ lineHeight: 1.1 }}>
              Performance
            </Text>
            <Text size="xs" color="dimmed">
              {format(new Date(), 'MMM dd yyyy')}
            </Text>
          </div>
          <div>
            <Group spacing={4}>
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant="subtle"
                  size="xs"
                  compact
                  onClick={() => setTimeRange(range.value)}
                  styles={(theme) => ({
                    root: {
                      padding: '2px 6px',
                      '&:hover': {
                        backgroundColor: 'transparent'
                      }
                    },
                    label: {
                      fontSize: '12px',
                      color: timeRange === range.value ? '#339AF0' : theme.colors.gray[6],
                      fontWeight: timeRange === range.value ? 700 : 400
                    }
                  })}
                >
                  {range.label}
                </Button>
              ))}
            </Group>
          </div>
        </Group>

        <div style={{ flex: 1, minHeight: '180px', width: '100%' }}>
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#339AF0" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#339AF0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(time) => formatTimeByRange(time, timeRange)}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#868E96', fontSize: 8 }}
                dy={5}
                minTickGap={20}
              />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#868E96', fontSize: 8 }}
                dx={-5}
                tickFormatter={formatDollar}
                width={45}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#339AF0"
                strokeWidth={2}
                fill="url(#colorValue)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Stack>
    </Paper>
  );
}

// Helper function to generate chart data based on portfolio value
const generateChartData = (currentValue, timeRange) => {
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
  const volatility = 0.02; // 2% volatility

  let value = currentValue;
  for (let i = 0; i < count; i++) {
    const time = new Date(now - (count - i) * interval);
    // Generate smoother price movements
    const change = value * (Math.random() * volatility - volatility / 2);
    value = i === count - 1 ? currentValue : value + change;
    
    data.push({
      date: time.toISOString(),
      value: value
    });
  }

  return data;
};

export default DashboardPerformanceChart; 