import React, { useState, useEffect } from 'react';
import { Paper, Group, Text, Stack, Button } from '@mantine/core';
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
        padding: '15px',
        border: '1px solid #eee',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <p style={{ 
          margin: '0 0 10px 0', 
          fontWeight: 'bold',
          fontSize: '16px',
          color: '#000'
        }}>
          {format(new Date(label), 'MMM d, yyyy h:mm a')}
        </p>
        <p style={{ 
          margin: 0, 
          color: '#339AF0',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          {formatDollar(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

function PerformanceChart() {
  const { portfolio } = usePortfolio();
  const [timeRange, setTimeRange] = useState('24h');
  const [chartData, setChartData] = useState([]);

  // Generate chart data whenever portfolio changes or time range changes
  useEffect(() => {
    const data = generateChartData(portfolio.totalValue, timeRange);
    setChartData(data);
  }, [portfolio.totalValue, timeRange]);

  if (portfolio.totalValue === 0) {
    return <div className="empty-state">No portfolio data available.</div>;
  }

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack spacing="md">
        <Group position="apart" style={{ width: '100%' }}>
          <div>
            <Text size="xl" weight={700} style={{ fontSize: '36px', lineHeight: 1.2, marginBottom: '4px' }}>
              Performance
            </Text>
            <Text size="md" color="dimmed" style={{ fontSize: '16px' }}>
              {format(new Date(), 'MMM d yyyy')}
            </Text>
          </div>
          <Group spacing={16}>
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant="subtle"
                size="sm"
                onClick={() => setTimeRange(range.value)}
                styles={(theme) => ({
                  root: {
                    padding: '0',
                    minWidth: '30px',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  },
                  label: {
                    fontSize: '16px',
                    color: timeRange === range.value ? '#339AF0' : theme.colors.gray[6],
                    fontWeight: timeRange === range.value ? 700 : 400
                  }
                })}
              >
                {range.label}
              </Button>
            ))}
          </Group>
        </Group>

        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
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
                tick={{ fill: '#868E96', fontSize: 12 }}
                dy={10}
                minTickGap={30}
              />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#868E96', fontSize: 12 }}
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
                isAnimationActive={false}
                dot={false}
                activeDot={{ r: 6, fill: '#339AF0', stroke: '#fff', strokeWidth: 2 }}
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

export default PerformanceChart; 