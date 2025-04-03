import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Container, Title, useMantineTheme } from '@mantine/core';
import { useConfig } from '../contexts/ConfigContext';

// Mock portfolio data
const portfolioData = {
  assets: [
    { 
      id: 'bitcoin', 
      symbol: 'BTC', 
      name: 'Bitcoin', 
      allocation: 45, 
      roi: 28.5,
      volatility: 65,
      beta: 0.85,
      sharpeRatio: 1.7,
      maxDrawdown: 42,
      color: '#F7931A'
    },
    { 
      id: 'ethereum', 
      symbol: 'ETH', 
      name: 'Ethereum', 
      allocation: 30, 
      roi: 35.2,
      volatility: 78,
      beta: 1.2,
      sharpeRatio: 1.5,
      maxDrawdown: 55,
      color: '#627EEA'
    },
    { 
      id: 'solana', 
      symbol: 'SOL', 
      name: 'Solana', 
      allocation: 15, 
      roi: 42.8,
      volatility: 92,
      beta: 1.8,
      sharpeRatio: 1.2,
      maxDrawdown: 72,
      color: '#00FFA3'
    },
    { 
      id: 'usdc', 
      symbol: 'USDC', 
      name: 'USD Coin', 
      allocation: 10, 
      roi: 2.5,
      volatility: 3,
      beta: 0.05,
      sharpeRatio: 0.9,
      maxDrawdown: 0.5,
      color: '#2775CA'
    }
  ],
  metrics: {
    roi: 29.4,
    volatility: 62,
    beta: 0.95,
    sharpeRatio: 1.55,
    maxDrawdown: 48,
  },
  // Correlation matrix (BTC, ETH, SOL, USDC)
  correlationMatrix: [
    [1.00, 0.82, 0.75, 0.12],
    [0.82, 1.00, 0.78, 0.15],
    [0.75, 0.78, 1.00, 0.18],
    [0.12, 0.15, 0.18, 1.00]
  ]
};

// Historical data for charts
const historicalMetrics = [
  { month: 'Jan', roi: 12.5, volatility: 55, beta: 0.9, sharpeRatio: 1.4, drawdown: 25 },
  { month: 'Feb', roi: 18.2, volatility: 60, beta: 0.95, sharpeRatio: 1.5, drawdown: 30 },
  { month: 'Mar', roi: 15.6, volatility: 52, beta: 0.88, sharpeRatio: 1.3, drawdown: 22 },
  { month: 'Apr', roi: 21.8, volatility: 65, beta: 1.1, sharpeRatio: 1.6, drawdown: 35 },
  { month: 'May', roi: 25.3, volatility: 70, beta: 1.2, sharpeRatio: 1.8, drawdown: 42 },
  { month: 'Jun', roi: 29.4, volatility: 62, beta: 0.95, sharpeRatio: 1.55, drawdown: 38 }
];

// Correlation data for visualization
const prepareCorrelationData = () => {
  const data = [];
  const assets = portfolioData.assets.map(a => a.symbol);
  
  portfolioData.correlationMatrix.forEach((row, i) => {
    row.forEach((value, j) => {
      // Skip identical pairs to avoid clutter
      if (i < j) {
        data.push({
          x: assets[i],
          y: assets[j],
          z: Math.abs(value) * 100, // Scale for bubble size
          value: value
        });
      }
    });
  });
  
  return data;
};

// Radar chart data for portfolio asset comparison
const prepareRadarData = () => {
  return portfolioData.assets.map(asset => ({
    asset: asset.symbol,
    roi: normalizeValue(asset.roi, 0, 50, 0, 100),
    volatility: normalizeValue(asset.volatility, 0, 100, 0, 100),
    beta: normalizeValue(asset.beta, 0, 2, 0, 100),
    sharpeRatio: normalizeValue(asset.sharpeRatio, 0, 2, 0, 100),
    maxDrawdown: normalizeValue(asset.maxDrawdown, 0, 100, 100, 0) // Inverse scale because lower is better
  }));
};

// Helper to normalize values to 0-100 scale for radar chart
const normalizeValue = (value, minInput, maxInput, minOutput, maxOutput) => {
  return ((value - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) + minOutput;
};

const MetricCard = ({ title, value, description, color = '#4285F4', suffix = '' }) => {
  const theme = useMantineTheme();
  const { theme: configTheme } = useConfig();
  const isDark = configTheme === 'dark';
  
  return (
    <div style={{ 
      padding: '16px', 
      borderRadius: '8px', 
      border: `1px solid ${isDark ? theme.colors.dark[5] : '#e0e0e0'}`,
      boxShadow: isDark ? '0 2px 4px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
      backgroundColor: isDark ? theme.colors.dark[6] : '#fff',
      height: '100%',
      color: isDark ? theme.colors.dark[0] : '#333',
    }}>
      <h3 style={{ marginTop: 0, color: isDark ? theme.colors.dark[0] : '#333', fontSize: '16px' }}>{title}</h3>
      <div style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        margin: '12px 0', 
        color
      }}>
        {value}{suffix}
      </div>
      <p style={{ fontSize: '14px', color: isDark ? theme.colors.dark[2] : '#666', margin: 0 }}>{description}</p>
    </div>
  );
};

const CryptoPortfolioMetrics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const theme = useMantineTheme();
  const { theme: configTheme } = useConfig();
  const isDark = configTheme === 'dark';
  
  // Theming variables
  const textColor = isDark ? theme.colors.dark[0] : '#333';
  const dimmedTextColor = isDark ? theme.colors.dark[2] : '#666';
  const borderColor = isDark ? theme.colors.dark[5] : '#e0e0e0';
  const backgroundColor = isDark ? theme.colors.dark[7] : '#fff';
  const altBackgroundColor = isDark ? theme.colors.dark[6] : '#f9f9f9';
  const tableHeaderColor = isDark ? theme.colors.dark[5] : '#f5f5f5';
  const tableRowEvenColor = isDark ? theme.colors.dark[6] : '#fff';
  const tableRowOddColor = isDark ? theme.colors.dark[7] : '#f9f9f9';
  const activeTabColor = isDark ? theme.colors.blue[4] : '#4285F4';
  
  const correlationData = prepareCorrelationData();
  const radarData = prepareRadarData();
  
  // Helper functions to interpret metrics
  const getRoiRating = (roi) => {
    if (roi > 30) return 'Excellent';
    if (roi > 20) return 'Very Good';
    if (roi > 10) return 'Good';
    if (roi > 0) return 'Positive';
    return 'Negative';
  };
  
  const getVolatilityRating = (volatility) => {
    if (volatility > 80) return 'Extremely High';
    if (volatility > 60) return 'High';
    if (volatility > 40) return 'Medium';
    if (volatility > 20) return 'Low';
    return 'Very Low';
  };
  
  const getBetaRating = (beta) => {
    if (beta > 1.5) return 'Highly Aggressive';
    if (beta > 1.2) return 'Aggressive';
    if (beta > 0.8) return 'Market-like';
    if (beta > 0.5) return 'Defensive';
    return 'Very Defensive';
  };
  
  const getSharpeRating = (sharpe) => {
    if (sharpe > 2) return 'Excellent';
    if (sharpe > 1.5) return 'Very Good';
    if (sharpe > 1) return 'Good';
    if (sharpe > 0.5) return 'Fair';
    return 'Poor';
  };
  
  const getDrawdownRating = (drawdown) => {
    if (drawdown > 60) return 'Extremely High Risk';
    if (drawdown > 40) return 'High Risk';
    if (drawdown > 20) return 'Medium Risk';
    if (drawdown > 10) return 'Low Risk';
    return 'Very Low Risk';
  };
  
  // Custom Tab component
  const Tabs = ({ tabs, activeTab, onChange }) => (
    <div style={{ 
      display: 'flex', 
      borderBottom: `1px solid ${borderColor}`, 
      marginBottom: '20px'
    }}>
      {tabs.map(tab => (
        <div 
          key={tab.value}
          onClick={() => onChange(tab.value)}
          style={{ 
            padding: '10px 20px', 
            cursor: 'pointer',
            borderBottom: tab.value === activeTab ? `2px solid ${activeTabColor}` : 'none',
            color: tab.value === activeTab ? activeTabColor : textColor,
            fontWeight: tab.value === activeTab ? 'bold' : 'normal'
          }}
        >
          {tab.label}
        </div>
      ))}
    </div>
  );
  
  return (
    <Container size="xl">
      <div style={{ color: textColor, fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title order={1} style={{ margin: 0, color: textColor }}>Crypto Portfolio Risk Analysis</Title>
          <div style={{ 
            display: 'inline-block', 
            padding: '8px 16px', 
            backgroundColor: isDark ? theme.colors.dark[6] : '#f0f4f8', 
            borderRadius: '4px', 
            fontSize: '14px',
            color: textColor
          }}>
            Last Updated: {new Date().toLocaleDateString()}
          </div>
        </div>
        
        <Tabs 
          tabs={[
            { value: 'overview', label: 'Portfolio Overview' },
            { value: 'metrics', label: 'Key Metrics' },
            { value: 'correlation', label: 'Correlation Analysis' },
            { value: 'recommendations', label: 'Portfolio Recommendations' }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        
        {activeTab === 'overview' && (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <MetricCard 
                title="Return on Investment" 
                value={portfolioData.metrics.roi.toFixed(1)} 
                suffix="%" 
                color="#4CAF50"
                description={`${getRoiRating(portfolioData.metrics.roi)} return compared to market average`} 
              />
              <MetricCard 
                title="Volatility" 
                value={portfolioData.metrics.volatility.toFixed(1)} 
                suffix="%" 
                color="#FF9800"
                description={`${getVolatilityRating(portfolioData.metrics.volatility)} price movement over time`} 
              />
              <MetricCard 
                title="Beta" 
                value={portfolioData.metrics.beta.toFixed(2)} 
                color="#2196F3"
                description={`${getBetaRating(portfolioData.metrics.beta)} risk relative to market`} 
              />
              <MetricCard 
                title="Sharpe Ratio" 
                value={portfolioData.metrics.sharpeRatio.toFixed(2)} 
                color="#9C27B0"
                description={`${getSharpeRating(portfolioData.metrics.sharpeRatio)} risk-adjusted return`} 
              />
              <MetricCard 
                title="Maximum Drawdown" 
                value={portfolioData.metrics.maxDrawdown.toFixed(1)} 
                suffix="%" 
                color="#F44336"
                description={`${getDrawdownRating(portfolioData.metrics.maxDrawdown)} potential loss from peak`} 
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '12px', color: textColor }}>Portfolio Metrics Over Time</h2>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalMetrics}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? theme.colors.dark[5] : '#e0e0e0'} />
                    <XAxis dataKey="month" stroke={textColor} tick={{ fill: textColor }} />
                    <YAxis yAxisId="left" orientation="left" stroke={textColor} tick={{ fill: textColor }} />
                    <YAxis yAxisId="right" orientation="right" stroke={textColor} tick={{ fill: textColor }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? theme.colors.dark[7] : '#fff',
                        borderColor: borderColor,
                        color: textColor
                      }}
                    />
                    <Legend wrapperStyle={{ color: textColor }} />
                    <Line yAxisId="left" type="monotone" dataKey="roi" name="ROI (%)" stroke="#4CAF50" activeDot={{ r: 8 }} />
                    <Line yAxisId="left" type="monotone" dataKey="volatility" name="Volatility (%)" stroke="#FF9800" />
                    <Line yAxisId="right" type="monotone" dataKey="beta" name="Beta" stroke="#2196F3" />
                    <Line yAxisId="right" type="monotone" dataKey="sharpeRatio" name="Sharpe Ratio" stroke="#9C27B0" />
                    <Line yAxisId="left" type="monotone" dataKey="drawdown" name="Drawdown (%)" stroke="#F44336" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '12px', color: textColor }}>Asset Comparison</h2>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={150} data={radarData}>
                    <PolarGrid stroke={isDark ? theme.colors.dark[5] : '#e0e0e0'} />
                    <PolarAngleAxis dataKey="asset" tick={{ fill: textColor }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: textColor }} />
                    <Radar name="ROI" dataKey="roi" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.2} />
                    <Radar name="Volatility" dataKey="volatility" stroke="#FF9800" fill="#FF9800" fillOpacity={0.2} />
                    <Radar name="Beta" dataKey="beta" stroke="#2196F3" fill="#2196F3" fillOpacity={0.2} />
                    <Radar name="Sharpe Ratio" dataKey="sharpeRatio" stroke="#9C27B0" fill="#9C27B0" fillOpacity={0.2} />
                    <Radar name="Max Drawdown (Inverted)" dataKey="maxDrawdown" stroke="#F44336" fill="#F44336" fillOpacity={0.2} />
                    <Legend wrapperStyle={{ color: textColor }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p style={{ fontSize: '14px', color: dimmedTextColor, fontStyle: 'italic', textAlign: 'center' }}>
                Note: Values are normalized to 0-100 scale for comparison. For Maximum Drawdown, higher values indicate lower risk (inverted scale).
              </p>
            </div>
            
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '12px', color: textColor }}>Risk Assessment Summary</h2>
              <div style={{ 
                padding: '16px', 
                backgroundColor: altBackgroundColor, 
                borderRadius: '8px', 
                border: `1px solid ${borderColor}`,
                color: textColor
              }}>
                <h3 style={{ marginTop: 0, fontSize: '16px', color: textColor }}>Portfolio Risk Profile: {
                  portfolioData.metrics.volatility > 70 ? 'Aggressive Growth' :
                  portfolioData.metrics.volatility > 50 ? 'Growth' :
                  portfolioData.metrics.volatility > 30 ? 'Balanced' : 'Conservative'
                }</h3>
                
                <p>Your portfolio shows <strong>{getRoiRating(portfolioData.metrics.roi).toLowerCase()}</strong> returns with <strong>{getVolatilityRating(portfolioData.metrics.volatility).toLowerCase()}</strong> volatility. The beta of {portfolioData.metrics.beta.toFixed(2)} indicates your portfolio is <strong>{getBetaRating(portfolioData.metrics.beta).toLowerCase()}</strong> compared to the overall crypto market.</p>
                
                <p>Your Sharpe ratio of {portfolioData.metrics.sharpeRatio.toFixed(2)} suggests <strong>{getSharpeRating(portfolioData.metrics.sharpeRatio).toLowerCase()}</strong> risk-adjusted returns. The maximum drawdown of {portfolioData.metrics.maxDrawdown}% represents <strong>{getDrawdownRating(portfolioData.metrics.maxDrawdown).toLowerCase()}</strong>.</p>
                
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '8px', color: textColor }}>Key Recommendations:</h4>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {portfolioData.metrics.volatility > 60 && (
                      <li>Consider increasing stablecoin allocation to reduce overall portfolio volatility</li>
                    )}
                    {portfolioData.metrics.beta > 1.2 && (
                      <li>Your portfolio is more volatile than the market - adding lower-beta assets could provide more stability</li>
                    )}
                    {portfolioData.metrics.sharpeRatio < 1.3 && (
                      <li>Improve your risk-adjusted returns by reducing exposure to high-volatility assets</li>
                    )}
                    {portfolioData.metrics.maxDrawdown > 45 && (
                      <li>Your maximum drawdown is significant - consider implementing stop-loss strategies</li>
                    )}
                    {portfolioData.assets.filter(a => a.allocation > 40).length > 0 && (
                      <li>Your portfolio has high concentration in certain assets - further diversification recommended</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'metrics' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '12px', color: textColor }}>Asset Metrics Breakdown</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                  color: textColor
                }}>
                  <thead>
                    <tr style={{ backgroundColor: tableHeaderColor }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${borderColor}` }}>Asset</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${borderColor}` }}>Allocation</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${borderColor}` }}>ROI (%)</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${borderColor}` }}>Volatility</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${borderColor}` }}>Beta</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${borderColor}` }}>Sharpe Ratio</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${borderColor}` }}>Max Drawdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioData.assets.map((asset, index) => (
                      <tr key={asset.id} style={{ backgroundColor: index % 2 === 0 ? tableRowEvenColor : tableRowOddColor }}>
                        <td style={{ padding: '12px 8px', borderBottom: `1px solid ${borderColor}` }}>
                          <div>
                            <strong>{asset.symbol}</strong>
                            <div style={{ fontSize: '12px', color: dimmedTextColor }}>{asset.name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', borderBottom: `1px solid ${borderColor}` }}>
                          {asset.allocation}%
                        </td>
                        <td style={{ padding: '12px 8px', borderBottom: `1px solid ${borderColor}`, color: asset.roi >= 0 ? '#4CAF50' : '#F44336' }}>
                          {asset.roi.toFixed(1)}%
                        </td>
                        <td style={{ padding: '12px 8px', borderBottom: `1px solid ${borderColor}` }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ 
                              width: `${Math.min(100, asset.volatility)}%`, 
                              height: '8px', 
                              backgroundColor: '#FF9800', 
                              borderRadius: '4px', 
                              marginRight: '8px' 
                            }}></div>
                            {asset.volatility}%
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', borderBottom: `1px solid ${borderColor}` }}>
                          {asset.beta.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 8px', borderBottom: `1px solid ${borderColor}` }}>
                          {asset.sharpeRatio.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 8px', borderBottom: `1px solid ${borderColor}` }}>
                          {asset.maxDrawdown}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '12px', color: textColor }}>Metric Comparisons</h2>
              </div>
              
              <div style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '16px', backgroundColor: isDark ? theme.colors.dark[6] : '#fff', height: '300px' }}>
                <h3 style={{ fontSize: '16px', marginTop: 0, color: textColor }}>ROI vs Volatility</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke={isDark ? theme.colors.dark[5] : '#e0e0e0'} />
                    <XAxis 
                      type="number" 
                      dataKey="volatility" 
                      name="Volatility (%)" 
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="roi" 
                      name="ROI (%)" 
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <ZAxis range={[60, 200]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      formatter={(value) => value.toFixed(2)} 
                      contentStyle={{ 
                        backgroundColor: isDark ? theme.colors.dark[7] : '#fff',
                        borderColor: borderColor,
                        color: textColor
                      }}
                    />
                    <Legend wrapperStyle={{ color: textColor }} />
                    <Scatter 
                      name="Assets" 
                      data={portfolioData.assets} 
                      fill={isDark ? theme.colors.blue[5] : "#8884d8"}
                      shape="circle"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              <div style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '16px', backgroundColor: isDark ? theme.colors.dark[6] : '#fff', height: '300px' }}>
                <h3 style={{ fontSize: '16px', marginTop: 0, color: textColor }}>Beta vs Sharpe Ratio</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke={isDark ? theme.colors.dark[5] : '#e0e0e0'} />
                    <XAxis 
                      type="number" 
                      dataKey="beta" 
                      name="Beta" 
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="sharpeRatio" 
                      name="Sharpe Ratio" 
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <ZAxis range={[60, 200]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      formatter={(value) => value.toFixed(2)} 
                      contentStyle={{ 
                        backgroundColor: isDark ? theme.colors.dark[7] : '#fff',
                        borderColor: borderColor,
                        color: textColor
                      }}
                    />
                    <Legend wrapperStyle={{ color: textColor }} />
                    <Scatter 
                      name="Assets" 
                      data={portfolioData.assets} 
                      fill={isDark ? theme.colors.blue[5] : "#8884d8"}
                      shape="circle"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              <div style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '16px', backgroundColor: isDark ? theme.colors.dark[6] : '#fff', height: '300px' }}>
                <h3 style={{ fontSize: '16px', marginTop: 0, color: textColor }}>Max Drawdown Comparison</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart
                    data={portfolioData.assets}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? theme.colors.dark[5] : '#e0e0e0'} />
                    <XAxis 
                      dataKey="symbol" 
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <YAxis
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? theme.colors.dark[7] : '#fff',
                        borderColor: borderColor,
                        color: textColor
                      }}
                    />
                    <Legend wrapperStyle={{ color: textColor }} />
                    <Bar dataKey="maxDrawdown" name="Max Drawdown (%)" fill="#F44336" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '16px', backgroundColor: isDark ? theme.colors.dark[6] : '#fff', height: '300px' }}>
                <h3 style={{ fontSize: '16px', marginTop: 0, color: textColor }}>Sharpe Ratio Comparison</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart
                    data={portfolioData.assets}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? theme.colors.dark[5] : '#e0e0e0'} />
                    <XAxis 
                      dataKey="symbol" 
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <YAxis 
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? theme.colors.dark[7] : '#fff',
                        borderColor: borderColor,
                        color: textColor
                      }}
                    />
                    <Legend wrapperStyle={{ color: textColor }} />
                    <Bar dataKey="sharpeRatio" name="Sharpe Ratio" fill="#9C27B0" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '12px', color: textColor }}>Understanding the Metrics</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '16px'
              }}>
                <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#4CAF50' }}>Return on Investment (ROI)</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: textColor }}>
                    ROI measures your portfolio's performance by comparing the initial amount invested across all assets to its current value. A high ROI indicates that your portfolio performs well, while a lower ROI suggests a loss.
                  </p>
                </div>
                
                <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#FF9800' }}>Volatility</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: textColor }}>
                    Volatility is the degree of price changes of your investments over time. A portfolio with high volatility experiences larger price swings, which could result in substantial gains or losses.
                  </p>
                </div>
                
                <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#2196F3' }}>Beta</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: textColor }}>
                    Beta measures the sensitivity of your portfolio's returns to changes in the total crypto market. A beta of 1 indicates movement in line with the market, greater than 1 means more volatile than the market, and less than 1 means less volatile.
                  </p>
                </div>
                
                <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#9C27B0' }}>Sharpe Ratio</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: textColor }}>
                    Sharpe ratio is a measure of risk-adjusted return that considers your portfolio's volatility. A higher Sharpe Ratio suggests that your portfolio generates greater returns relative to the level of risk.
                  </p>
                </div>
                
                <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#F44336' }}>Maximum Drawdown</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: textColor }}>
                    Maximum Drawdown refers to the maximum percentage decline in the value of your portfolio from its peak to its lowest point over a specific period. It helps measure potential losses and risk.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'correlation' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '12px', color: textColor }}>Asset Correlation Analysis</h2>
              <p style={{ fontSize: '14px', color: dimmedTextColor, marginBottom: '16px' }}>
                Understanding correlations between assets is crucial for effective diversification. Assets with low or negative correlation help reduce overall portfolio risk.
              </p>
              
              <div style={{ 
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: isDark ? theme.colors.dark[6] : '#fff',
                marginBottom: '24px',
                height: '400px'
              }}>
                <h3 style={{ fontSize: '16px', marginTop: 0, marginBottom: '16px', color: textColor }}>Asset Correlation Map</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 90, left: 20 }}>
                    <CartesianGrid stroke={isDark ? theme.colors.dark[5] : '#e0e0e0'} />
                    <XAxis 
                      type="category" 
                      dataKey="x" 
                      name="Asset" 
                      allowDuplicatedCategory={false}
                      stroke={textColor}
                      tick={{ fill: textColor, angle: -45, textAnchor: 'end' }}
                      height={80}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="y" 
                      name="Asset" 
                      allowDuplicatedCategory={false}
                      stroke={textColor}
                      tick={{ fill: textColor }}
                    />
                    <ZAxis type="number" dataKey="z" range={[40, 400]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      formatter={(value, name) => {
                        if (name === 'z') return [`Correlation: ${value.toFixed(2)}`, 'Correlation'];
                        return [value, name];
                      }} 
                      contentStyle={{ 
                        backgroundColor: isDark ? theme.colors.dark[7] : '#fff',
                        borderColor: borderColor,
                        color: textColor
                      }}
                    />
                    <Scatter 
                      name="Correlations" 
                      data={prepareCorrelationData()} 
                      fill={(entry) => {
                        const value = entry.z;
                        if (value >= 0.7) return '#F44336'; // High correlation - Red
                        if (value >= 0.3) return '#FF9800'; // Medium correlation - Orange
                        if (value >= -0.3) return '#4CAF50'; // Low correlation - Green
                        if (value >= -0.7) return '#2196F3'; // Medium negative correlation - Blue
                        return '#9C27B0'; // High negative correlation - Purple
                      }}
                      shape="circle"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: textColor }}>Correlation Matrix</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                    color: textColor
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: tableHeaderColor }}>
                        <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${borderColor}` }}>Asset</th>
                        {portfolioData.assets.map(asset => (
                          <th key={asset.id} style={{ padding: '12px 8px', textAlign: 'center', borderBottom: `2px solid ${borderColor}` }}>
                            {asset.symbol}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioData.assets.map((rowAsset, rowIndex) => (
                        <tr key={rowAsset.id} style={{ backgroundColor: rowIndex % 2 === 0 ? tableRowEvenColor : tableRowOddColor }}>
                          <td style={{ padding: '12px 8px', borderBottom: `1px solid ${borderColor}`, fontWeight: 'bold' }}>
                            {rowAsset.symbol}
                          </td>
                          {portfolioData.assets.map((colAsset, colIndex) => {
                            const correlationValue = portfolioData.correlationMatrix[rowIndex][colIndex];
                            let cellColor;
                            
                            if (correlationValue >= 0.7) cellColor = 'rgba(244, 67, 54, 0.3)'; // High correlation - Red
                            else if (correlationValue >= 0.3) cellColor = 'rgba(255, 152, 0, 0.3)'; // Medium correlation - Orange
                            else if (correlationValue >= -0.3) cellColor = 'rgba(76, 175, 80, 0.3)'; // Low correlation - Green
                            else if (correlationValue >= -0.7) cellColor = 'rgba(33, 150, 243, 0.3)'; // Medium negative correlation - Blue
                            else cellColor = 'rgba(156, 39, 176, 0.3)'; // High negative correlation - Purple
                            
                            return (
                              <td 
                                key={`${rowAsset.id}-${colAsset.id}`} 
                                style={{ 
                                  padding: '12px 8px', 
                                  textAlign: 'center', 
                                  borderBottom: `1px solid ${borderColor}`,
                                  backgroundColor: cellColor
                                }}
                              >
                                {correlationValue.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: textColor }}>Correlation Insights</h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: '16px'
                }}>
                  <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#F44336' }}>High Positive Correlation (0.7 to 1.0)</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: textColor }}>
                      Assets moving in the same direction with similar magnitude. May indicate redundancy in your portfolio and limited diversification benefit.
                    </p>
                    <div style={{ marginTop: '8px', fontSize: '13px', color: dimmedTextColor }}>
                      {(() => {
                        const highCorrelations = [];
                        portfolioData.assets.forEach((asset1, i) => {
                          portfolioData.assets.forEach((asset2, j) => {
                            if (i < j && portfolioData.correlationMatrix[i][j] >= 0.7) {
                              highCorrelations.push(`${asset1.symbol} & ${asset2.symbol} (${portfolioData.correlationMatrix[i][j].toFixed(2)})`);
                            }
                          });
                        });
                        return highCorrelations.length > 0 
                          ? `Examples: ${highCorrelations.join(', ')}` 
                          : 'No high positive correlations found in your portfolio.';
                      })()}
                    </div>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#FF9800' }}>Medium Positive Correlation (0.3 to 0.7)</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: textColor }}>
                      Assets that generally move in the same direction, but with some independence. Provides some diversification but still linked.
                    </p>
                    <div style={{ marginTop: '8px', fontSize: '13px', color: dimmedTextColor }}>
                      {(() => {
                        const medCorrelations = [];
                        portfolioData.assets.forEach((asset1, i) => {
                          portfolioData.assets.forEach((asset2, j) => {
                            if (i < j && portfolioData.correlationMatrix[i][j] >= 0.3 && portfolioData.correlationMatrix[i][j] < 0.7) {
                              medCorrelations.push(`${asset1.symbol} & ${asset2.symbol} (${portfolioData.correlationMatrix[i][j].toFixed(2)})`);
                            }
                          });
                        });
                        return medCorrelations.length > 0 
                          ? `Examples: ${medCorrelations.join(', ')}` 
                          : 'No medium positive correlations found in your portfolio.';
                      })()}
                    </div>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4CAF50' }}>Low Correlation (-0.3 to 0.3)</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: textColor }}>
                      Assets that move with little relationship to each other. Excellent for diversification as they respond differently to market conditions.
                    </p>
                    <div style={{ marginTop: '8px', fontSize: '13px', color: dimmedTextColor }}>
                      {(() => {
                        const lowCorrelations = [];
                        portfolioData.assets.forEach((asset1, i) => {
                          portfolioData.assets.forEach((asset2, j) => {
                            if (i < j && portfolioData.correlationMatrix[i][j] >= -0.3 && portfolioData.correlationMatrix[i][j] < 0.3) {
                              lowCorrelations.push(`${asset1.symbol} & ${asset2.symbol} (${portfolioData.correlationMatrix[i][j].toFixed(2)})`);
                            }
                          });
                        });
                        return lowCorrelations.length > 0 
                          ? `Examples: ${lowCorrelations.join(', ')}` 
                          : 'No low correlations found in your portfolio.';
                      })()}
                    </div>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2196F3' }}>Negative Correlation (-1.0 to -0.3)</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: textColor }}>
                      Assets that tend to move in opposite directions. Highly beneficial for reducing portfolio volatility and preserving capital during market downturns.
                    </p>
                    <div style={{ marginTop: '8px', fontSize: '13px', color: dimmedTextColor }}>
                      {(() => {
                        const negCorrelations = [];
                        portfolioData.assets.forEach((asset1, i) => {
                          portfolioData.assets.forEach((asset2, j) => {
                            if (i < j && portfolioData.correlationMatrix[i][j] < -0.3) {
                              negCorrelations.push(`${asset1.symbol} & ${asset2.symbol} (${portfolioData.correlationMatrix[i][j].toFixed(2)})`);
                            }
                          });
                        });
                        return negCorrelations.length > 0 
                          ? `Examples: ${negCorrelations.join(', ')}` 
                          : 'No negative correlations found in your portfolio.';
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'recommendations' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '12px', color: textColor }}>Portfolio Recommendations</h2>
              <p style={{ fontSize: '14px', color: dimmedTextColor, marginBottom: '16px' }}>
                Based on the risk analysis of your portfolio, here are personalized recommendations to optimize your strategy.
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{ 
                  padding: '16px', 
                  borderRadius: '8px', 
                  backgroundColor: isDark ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)', 
                  border: '1px solid #4CAF50',
                  gridColumn: '1 / -1'
                }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#4CAF50' }}>Portfolio Health Score: {portfolioData.metrics.healthScore}/100</h3>
                  <div style={{ height: '8px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', borderRadius: '4px', marginBottom: '12px' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${portfolioData.metrics.healthScore}%`, 
                        backgroundColor: (() => {
                          if (portfolioData.metrics.healthScore >= 80) return '#4CAF50';
                          if (portfolioData.metrics.healthScore >= 60) return '#8BC34A';
                          if (portfolioData.metrics.healthScore >= 40) return '#FFC107';
                          if (portfolioData.metrics.healthScore >= 20) return '#FF9800';
                          return '#F44336';
                        })(),
                        borderRadius: '4px' 
                      }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: textColor }}>
                    {(() => {
                      if (portfolioData.metrics.healthScore >= 80) {
                        return 'Excellent! Your portfolio has a great balance of risk and return. Continue monitoring and make minor adjustments as market conditions change.';
                      }
                      if (portfolioData.metrics.healthScore >= 60) {
                        return 'Good portfolio with solid fundamentals. Some improvements could optimize your risk-adjusted returns.';
                      }
                      if (portfolioData.metrics.healthScore >= 40) {
                        return 'Average portfolio health. Consider the recommendations below to better balance risk and potential returns.';
                      }
                      if (portfolioData.metrics.healthScore >= 20) {
                        return 'Your portfolio needs attention. Several metrics indicate higher risk than necessary for your current returns.';
                      }
                      return 'Warning: Your portfolio has critical issues that need immediate attention. Consider following the recommendations below to reduce risk.';
                    })()}
                  </p>
                </div>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: textColor }}>Key Recommendations</h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: '16px' 
                }}>
                  <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2196F3' }}>Diversification Strategy</h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: textColor }}>
                      {(() => {
                        // Find average correlation
                        let totalCorr = 0;
                        let count = 0;
                        portfolioData.assets.forEach((asset1, i) => {
                          portfolioData.assets.forEach((asset2, j) => {
                            if (i < j) {
                              totalCorr += Math.abs(portfolioData.correlationMatrix[i][j]);
                              count++;
                            }
                          });
                        });
                        const avgCorr = count > 0 ? totalCorr / count : 0;
                        
                        if (avgCorr > 0.6) {
                          return 'Your portfolio shows high correlation between assets. Consider adding assets from different ecosystems to reduce overall portfolio risk.';
                        } else if (avgCorr > 0.4) {
                          return 'Moderate correlation between assets. Your diversification is reasonable but could be improved by adding 1-2 assets with negative correlation to your current holdings.';
                        } else {
                          return 'Good diversification with low average correlation between assets. Continue maintaining this balance as the market evolves.';
                        }
                      })()}
                    </p>
                    <div style={{ fontSize: '13px', color: '#2196F3' }}>
                      {(() => {
                        // Find highest correlated pair
                        let maxCorr = -1;
                        let maxCorrPair = null;
                        
                        portfolioData.assets.forEach((asset1, i) => {
                          portfolioData.assets.forEach((asset2, j) => {
                            if (i < j && portfolioData.correlationMatrix[i][j] > maxCorr) {
                              maxCorr = portfolioData.correlationMatrix[i][j];
                              maxCorrPair = `${asset1.symbol} & ${asset2.symbol}`;
                            }
                          });
                        });
                        
                        if (maxCorr > 0.7 && maxCorrPair) {
                          return `Consider reducing exposure to ${maxCorrPair} which have a high correlation of ${maxCorr.toFixed(2)}.`;
                        }
                        return 'No immediate actions required for diversification.';
                      })()}
                    </div>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#FF9800' }}>Risk Management</h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: textColor }}>
                      {(() => {
                        if (portfolioData.metrics.volatility > 40) {
                          return 'Your portfolio volatility is very high at ' + portfolioData.metrics.volatility + '%. Consider reducing positions in highly volatile assets to better manage risk.';
                        } else if (portfolioData.metrics.volatility > 25) {
                          return 'Moderate portfolio volatility of ' + portfolioData.metrics.volatility + '%. This is typical for crypto portfolios, but you might want to add some stablecoins for balance.';
                        } else {
                          return 'Good risk management with portfolio volatility at ' + portfolioData.metrics.volatility + '%. Your current balance appears appropriate for the crypto market.';
                        }
                      })()}
                    </p>
                    <div style={{ fontSize: '13px', color: '#FF9800' }}>
                      {(() => {
                        // Find highest volatility asset
                        let maxVol = -1;
                        let maxVolAsset = null;
                        
                        portfolioData.assets.forEach((asset) => {
                          if (asset.volatility > maxVol) {
                            maxVol = asset.volatility;
                            maxVolAsset = asset.symbol;
                          }
                        });
                        
                        if (maxVol > 50 && maxVolAsset) {
                          return `${maxVolAsset} has extremely high volatility (${maxVol}%). Consider reducing allocation if you're risk-averse.`;
                        }
                        return 'Continue monitoring market volatility and adjust allocations as needed.';
                      })()}
                    </div>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4CAF50' }}>Performance Optimization</h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: textColor }}>
                      {(() => {
                        if (portfolioData.metrics.sharpeRatio < 1) {
                          return 'Low Sharpe ratio of ' + portfolioData.metrics.sharpeRatio.toFixed(2) + ' indicates poor risk-adjusted returns. Consider rebalancing to improve the risk/reward profile.';
                        } else if (portfolioData.metrics.sharpeRatio < 2) {
                          return 'Acceptable Sharpe ratio of ' + portfolioData.metrics.sharpeRatio.toFixed(2) + '. You could enhance performance by increasing allocation to assets with higher risk-adjusted returns.';
                        } else {
                          return 'Excellent Sharpe ratio of ' + portfolioData.metrics.sharpeRatio.toFixed(2) + ' indicates strong risk-adjusted performance. Maintain your current strategy.';
                        }
                      })()}
                    </p>
                    <div style={{ fontSize: '13px', color: '#4CAF50' }}>
                      {(() => {
                        // Find best performing asset by Sharpe ratio
                        let bestSharpe = -100;
                        let bestSharpeAsset = null;
                        
                        portfolioData.assets.forEach((asset) => {
                          if (asset.sharpeRatio > bestSharpe) {
                            bestSharpe = asset.sharpeRatio;
                            bestSharpeAsset = asset.symbol;
                          }
                        });
                        
                        if (bestSharpeAsset) {
                          return `${bestSharpeAsset} has the best risk-adjusted performance with a Sharpe ratio of ${bestSharpe.toFixed(2)}.`;
                        }
                        return 'No standout performers in terms of risk-adjusted returns.';
                      })()}
                    </div>
                  </div>
                  
                  <div style={{ padding: '16px', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#F44336' }}>Risk Reduction Opportunities</h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: textColor }}>
                      {(() => {
                        if (portfolioData.metrics.maxDrawdown > 60) {
                          return 'Your portfolio has experienced severe drawdowns of ' + portfolioData.metrics.maxDrawdown + '%. Consider implementing stop-loss strategies or increasing allocation to stablecoins.';
                        } else if (portfolioData.metrics.maxDrawdown > 40) {
                          return 'Significant drawdowns of ' + portfolioData.metrics.maxDrawdown + '% indicate vulnerability to market corrections. Review asset allocation to reduce potential losses.';
                        } else {
                          return 'Your portfolio has shown resilience with max drawdowns of ' + portfolioData.metrics.maxDrawdown + '%. Continue monitoring for changes in market conditions.';
                        }
                      })()}
                    </p>
                    <div style={{ fontSize: '13px', color: '#F44336' }}>
                      {(() => {
                        // Find asset with highest drawdown
                        let maxDD = -1;
                        let maxDDAsset = null;
                        
                        portfolioData.assets.forEach((asset) => {
                          if (asset.maxDrawdown > maxDD) {
                            maxDD = asset.maxDrawdown;
                            maxDDAsset = asset.symbol;
                          }
                        });
                        
                        if (maxDD > 70 && maxDDAsset) {
                          return `${maxDDAsset} has experienced extreme drawdowns of ${maxDD}%. Consider reducing exposure or setting stricter exit points.`;
                        }
                        return 'Monitor market trends and be prepared to adjust your strategy during significant market corrections.';
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: textColor }}>Suggested Portfolio Adjustments</h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: '16px'
                }}>
                  <div style={{ gridColumn: '1 / -1', backgroundColor: altBackgroundColor, borderRadius: '8px', border: `1px solid ${borderColor}`, padding: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: textColor }}>Recommended Allocation Adjustments</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {portfolioData.assets.map(asset => {
                        // Simple algorithm to suggest allocation changes based on metrics
                        let suggestion = "";
                        let direction = "maintain";
                        let reason = "";
                        
                        if (asset.sharpeRatio < 1 && asset.volatility > 40) {
                          suggestion = "reduce by 5-10%";
                          direction = "reduce";
                          reason = "high volatility with poor risk-adjusted returns";
                        } else if (asset.sharpeRatio > 2 && asset.allocation < 15) {
                          suggestion = "increase by 3-5%";
                          direction = "increase";
                          reason = "strong risk-adjusted performance";
                        } else if (asset.maxDrawdown > 70) {
                          suggestion = "reduce by 3-5%";
                          direction = "reduce";
                          reason = "extreme historical drawdowns";
                        } else {
                          suggestion = "maintain current allocation";
                          reason = "balanced risk-reward profile";
                        }
                        
                        return (
                          <div key={asset.id} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '8px 12px', 
                            backgroundColor: (() => {
                              if (direction === "increase") return isDark ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)';
                              if (direction === "reduce") return isDark ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.1)';
                              return isDark ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.1)';
                            })(), 
                            borderRadius: '4px',
                            border: '1px solid ' + (() => {
                              if (direction === "increase") return '#4CAF50';
                              if (direction === "reduce") return '#F44336';
                              return '#2196F3';
                            })()
                          }}>
                            <div style={{ 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: asset.color,
                              marginRight: '12px'
                            }}></div>
                            <div style={{ flex: '0 0 80px', fontWeight: 'bold', color: textColor }}>{asset.symbol}</div>
                            <div style={{ flex: '0 0 80px', textAlign: 'center', color: textColor }}>{asset.allocation}%</div>
                            <div style={{ 
                              flex: '0 0 120px', 
                              color: (() => {
                                if (direction === "increase") return '#4CAF50';
                                if (direction === "reduce") return '#F44336';
                                return '#2196F3';
                              })(),
                              fontWeight: 'bold'
                            }}>
                              {suggestion}
                            </div>
                            <div style={{ flex: 1, fontSize: '13px', color: dimmedTextColor }}>{reason}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Container>
  );
};

export default CryptoPortfolioMetrics; 