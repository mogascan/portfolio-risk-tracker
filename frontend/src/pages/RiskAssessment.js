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
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Container, Title, useMantineTheme } from '@mantine/core';
import { useConfig } from '../contexts/ConfigContext';

// Mock data for the demo UI
const portfolioRisk = {
  score: 64,
  category: "HIGH",
  factors: {
    volatility: { score: 72, weight: 0.25 },
    concentration: { score: 85, weight: 0.20 },
    liquidity: { score: 45, weight: 0.15 },
    market_sentiment: { score: 60, weight: 0.10 },
    technical_signals: { score: 55, weight: 0.10 },
    regulatory_exposure: { score: 40, weight: 0.10 },
    on_chain_health: { score: 65, weight: 0.10 }
  }
};

const assetRisks = [
  { 
    id: 'bitcoin', 
    symbol: 'BTC', 
    name: 'Bitcoin', 
    allocationPercentage: 45, 
    riskScore: 42, 
    riskCategory: 'MEDIUM',
    volatility: 38,
    liquidity: 15,
    marketCap: 1600000000000,
    allocationImpact: 18.9,
    color: '#F7931A'
  },
  { 
    id: 'ethereum', 
    symbol: 'ETH', 
    name: 'Ethereum', 
    allocationPercentage: 30, 
    riskScore: 55, 
    riskCategory: 'HIGH',
    volatility: 52,
    liquidity: 20,
    marketCap: 320000000000,
    allocationImpact: 16.5,
    color: '#627EEA'
  },
  { 
    id: 'solana', 
    symbol: 'SOL', 
    name: 'Solana', 
    allocationPercentage: 15, 
    riskScore: 78, 
    riskCategory: 'EXTREMELY HIGH',
    volatility: 85,
    liquidity: 35,
    marketCap: 86000000000,
    allocationImpact: 11.7,
    color: '#00FFA3'
  },
  { 
    id: 'usdc', 
    symbol: 'USDC', 
    name: 'USD Coin', 
    allocationPercentage: 10, 
    riskScore: 12, 
    riskCategory: 'LOW',
    volatility: 5,
    liquidity: 10,
    marketCap: 32000000000,
    allocationImpact: 1.2,
    color: '#2775CA'
  }
];

// Risk factor names
const factorNames = {
  volatility: 'Volatility',
  concentration: 'Concentration',
  liquidity: 'Liquidity',
  market_sentiment: 'Market Sentiment',
  technical_signals: 'Technical Signals',
  regulatory_exposure: 'Regulatory Exposure',
  on_chain_health: 'On-chain Health'
};

// Convert portfolio risk factors to chart data
const riskFactorData = Object.entries(portfolioRisk.factors).map(([key, value]) => ({
  name: factorNames[key],
  score: value.score,
  weight: value.weight * 100,
  weighted: value.score * value.weight
}));

// Prepare allocation data for pie chart
const allocationData = assetRisks.map(asset => ({
  name: asset.symbol,
  value: asset.allocationPercentage,
  color: asset.color
}));

// Prepare risk impact data
const riskImpactData = assetRisks.map(asset => ({
  name: asset.symbol,
  value: asset.allocationImpact,
  color: asset.color
}));

// Top risk contributors
const topRiskContributors = [...assetRisks]
  .sort((a, b) => (b.allocationPercentage * b.riskScore) - (a.allocationPercentage * a.riskScore))
  .slice(0, 3);

// Get risk color based on score
const getRiskColor = (score) => {
  if (score <= 25) return '#4CAF50'; // Green
  if (score <= 50) return '#FFC107'; // Yellow
  if (score <= 75) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

// Get risk category label
const getRiskCategory = (score) => {
  if (score <= 25) return { label: 'LOW', color: '#4CAF50' };
  if (score <= 50) return { label: 'MEDIUM', color: '#FFC107' };
  if (score <= 75) return { label: 'HIGH', color: '#FF9800' };
  return { label: 'EXTREMELY HIGH', color: '#F44336' };
};

const RiskAssessmentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const theme = useMantineTheme();
  const { theme: configTheme } = useConfig();
  const isDark = configTheme === 'dark';

  // Theming variables
  const backgroundColor = isDark ? theme.colors.dark[7] : 'white';
  const textColor = isDark ? theme.colors.dark[0] : 'black';
  const borderColor = isDark ? theme.colors.dark[5] : '#e0e0e0';
  const cardBackgroundColor = isDark ? theme.colors.dark[6] : 'white';
  const dimmedTextColor = isDark ? theme.colors.dark[2] : '#757575';
  const progressBarBgColor = isDark ? theme.colors.dark[5] : '#e0e0e0';
  const tableHeaderBgColor = isDark ? theme.colors.dark[5] : '#f5f5f5';
  const tableBorderColor = isDark ? theme.colors.dark[4] : '#e0e0e0';
  const tableRowEvenBgColor = isDark ? theme.colors.dark[6] : 'white';
  const tableRowOddBgColor = isDark ? theme.colors.dark[7] : '#f9f9f9';
  const activeTabColor = isDark ? theme.colors.blue[4] : '#1976d2';
  
  // Custom progress bar component
  const ProgressBar = ({ value, max = 100, color }) => (
    <div style={{ width: '100%', backgroundColor: progressBarBgColor, borderRadius: '4px', height: '8px', margin: '4px 0' }}>
      <div 
        style={{ 
          width: `${Math.min(100, (value / max) * 100)}%`, 
          backgroundColor: color || getRiskColor(value), 
          height: '100%', 
          borderRadius: '4px',
          transition: 'width 0.5s ease-in-out'
        }} 
      />
    </div>
  );
  
  // Custom risk score indicator
  const RiskScoreRing = ({ score, size = 150, thickness = 10 }) => {
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - score / 100);
    
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle 
            cx={size/2} 
            cy={size/2} 
            r={radius} 
            fill="transparent" 
            stroke={progressBarBgColor} 
            strokeWidth={thickness} 
          />
          
          {/* Progress circle */}
          <circle 
            cx={size/2} 
            cy={size/2} 
            r={radius} 
            fill="transparent" 
            stroke={getRiskColor(score)} 
            strokeWidth={thickness} 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          color: textColor
        }}>
          {score}/100
        </div>
      </div>
    );
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
  
  // Custom Badge component
  const Badge = ({ label, color, size = 'medium' }) => {
    const fontSize = size === 'small' ? '0.75rem' : size === 'large' ? '1rem' : '0.875rem';
    const padding = size === 'small' ? '2px 6px' : size === 'large' ? '6px 12px' : '4px 8px';
    
    return (
      <span style={{ 
        backgroundColor: color,
        color: ['#4CAF50', '#FFC107'].includes(color) ? '#000' : '#fff',
        padding,
        borderRadius: '4px',
        fontSize,
        fontWeight: 'bold',
        display: 'inline-block'
      }}>
        {label}
      </span>
    );
  };
  
  // Card component
  const Card = ({ children, title, action }) => (
    <div style={{ 
      border: `1px solid ${borderColor}`, 
      borderRadius: '8px', 
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: cardBackgroundColor,
      color: textColor,
      boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
    }}>
      {(title || action) && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px',
          borderBottom: `1px solid ${isDark ? theme.colors.dark[4] : '#f0f0f0'}`,
          paddingBottom: '8px'
        }}>
          {title && <h3 style={{ margin: 0, color: textColor }}>{title}</h3>}
          {action && action}
        </div>
      )}
      {children}
    </div>
  );
  
  return (
    <Container size="xl" style={{ color: textColor }}>
      <Title order={1} my="md" style={{ color: textColor }}>Portfolio Risk Assessment</Title>
      
      <Tabs 
        tabs={[
          { value: 'overview', label: 'Risk Overview' },
          { value: 'assets', label: 'Asset Risks' }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {/* Portfolio Risk Score */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <Card title="Overall Portfolio Risk">
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span>Risk Category:</span>
                  <Badge 
                    label={getRiskCategory(portfolioRisk.score).label} 
                    color={getRiskCategory(portfolioRisk.score).color}
                    size="large"
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                  <RiskScoreRing score={portfolioRisk.score} />
                </div>
                
                <p style={{ color: dimmedTextColor, fontSize: '0.875rem' }}>
                  Your portfolio has a {getRiskCategory(portfolioRisk.score).label.toLowerCase()} risk profile. 
                  {portfolioRisk.score > 50 ? 
                    ' Consider diversifying to reduce overall risk exposure.' : 
                    ' Your risk level is within acceptable parameters.'}
                </p>
              </Card>
            </div>
            
            {/* Risk Factor Breakdown */}
            <div style={{ flex: '2', minWidth: '300px' }}>
              <Card title="Risk Factor Breakdown">
                {Object.entries(portfolioRisk.factors).map(([factor, data]) => (
                  <div key={factor} style={{ marginBottom: '10px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span>{factorNames[factor]}</span>
                      <div>
                        <Badge 
                          label={`${data.score}/100`} 
                          color={getRiskColor(data.score)}
                          size="small"
                        />
                        <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: dimmedTextColor }}>
                          Weight: {(data.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar value={data.score} />
                  </div>
                ))}
                
                <hr style={{ margin: '16px 0', border: 'none', borderTop: `1px solid ${borderColor}` }} />
                
                <p style={{ fontSize: '0.875rem' }}>
                  <strong>What impacts your risk score the most:</strong> {' '}
                  {Object.entries(portfolioRisk.factors)
                    .sort((a, b) => (b[1].score * b[1].weight) - (a[1].score * a[1].weight))[0][0] === 'concentration' ? 
                    'Your portfolio is heavily concentrated in a few assets. Consider diversifying to reduce risk.' :
                    'High volatility in your largest holdings is the main risk factor. Consider assets with more stable price action.'}
                </p>
              </Card>
            </div>
          </div>
          
          {/* Portfolio Composition */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <Card title="Portfolio Allocation">
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend formatter={(value, entry) => (
                        <span style={{ color: textColor }}>{value}</span>
                      )} />
                      <Tooltip 
                        formatter={(value) => `${value}%`}
                        contentStyle={{
                          backgroundColor: cardBackgroundColor,
                          border: `1px solid ${borderColor}`,
                          color: textColor
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
            
            <div style={{ flex: '1', minWidth: '300px' }}>
              <Card title="Risk Impact Distribution">
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskImpactData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {riskImpactData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend formatter={(value, entry) => (
                        <span style={{ color: textColor }}>{value}</span>
                      )} />
                      <Tooltip 
                        formatter={(value) => `${value.toFixed(1)}%`}
                        contentStyle={{
                          backgroundColor: cardBackgroundColor,
                          border: `1px solid ${borderColor}`,
                          color: textColor
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
          
          {/* Risk Factor Chart */}
          <Card title="Risk Factors Visualization">
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={riskFactorData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? theme.colors.dark[4] : '#e0e0e0'} />
                  <XAxis 
                    dataKey="name" 
                    stroke={textColor}
                    tick={{ fill: textColor }}
                  />
                  <YAxis 
                    stroke={textColor}
                    tick={{ fill: textColor }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: cardBackgroundColor,
                      border: `1px solid ${borderColor}`,
                      color: textColor
                    }}
                  />
                  <Legend 
                    formatter={(value, entry) => (
                      <span style={{ color: textColor }}>{value}</span>
                    )}
                  />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" name="Risk Score" />
                  <Line type="monotone" dataKey="weight" stroke="#82ca9d" name="Weight %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          {/* Risk Recommendations */}
          <Card title="Risk Mitigation Recommendations">
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ 
                flex: '1', 
                minWidth: '250px', 
                border: `1px solid ${borderColor}`, 
                borderRadius: '4px', 
                padding: '16px',
                backgroundColor: isDark ? theme.colors.dark[7] : 'white'
              }}>
                <h4 style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: '#FF9800' 
                }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '8px', 
                    height: '8px', 
                    backgroundColor: '#FF9800', 
                    borderRadius: '50%', 
                    marginRight: '8px' 
                  }}></span>
                  Reduce SOL Allocation
                </h4>
                <p style={{ fontSize: '0.875rem', color: textColor }}>
                  Solana's extremely high risk score is contributing disproportionately to your portfolio risk.
                </p>
              </div>
              
              <div style={{ 
                flex: '1', 
                minWidth: '250px', 
                border: `1px solid ${borderColor}`, 
                borderRadius: '4px', 
                padding: '16px',
                backgroundColor: isDark ? theme.colors.dark[7] : 'white'
              }}>
                <h4 style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: '#2196F3' 
                }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '8px', 
                    height: '8px', 
                    backgroundColor: '#2196F3', 
                    borderRadius: '50%', 
                    marginRight: '8px' 
                  }}></span>
                  Diversify Holdings
                </h4>
                <p style={{ fontSize: '0.875rem', color: textColor }}>
                  Your top 2 assets account for 75% of your portfolio. Consider adding 2-3 more assets.
                </p>
              </div>
              
              <div style={{ 
                flex: '1', 
                minWidth: '250px', 
                border: `1px solid ${borderColor}`, 
                borderRadius: '4px', 
                padding: '16px',
                backgroundColor: isDark ? theme.colors.dark[7] : 'white'
              }}>
                <h4 style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: '#4CAF50' 
                }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '8px', 
                    height: '8px', 
                    backgroundColor: '#4CAF50', 
                    borderRadius: '50%', 
                    marginRight: '8px' 
                  }}></span>
                  Increase Stablecoin Allocation
                </h4>
                <p style={{ fontSize: '0.875rem', color: textColor }}>
                  Increasing your stablecoin position from 10% to 15-20% would significantly reduce overall risk.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
      
      {activeTab === 'assets' && (
        <>
          <Card title="Asset Risk Analysis">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.875rem',
                color: textColor
              }}>
                <thead>
                  <tr style={{ backgroundColor: tableHeaderBgColor }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${tableBorderColor}` }}>Asset</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${tableBorderColor}` }}>Allocation</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${tableBorderColor}` }}>Risk Score</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${tableBorderColor}` }}>Risk Category</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${tableBorderColor}` }}>Volatility</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${tableBorderColor}` }}>Market Cap</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: `2px solid ${tableBorderColor}` }}>Risk Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {assetRisks.map((asset, index) => (
                    <tr key={asset.id} style={{ backgroundColor: index % 2 === 0 ? tableRowEvenBgColor : tableRowOddBgColor }}>
                      <td style={{ padding: '12px 8px', borderBottom: `1px solid ${tableBorderColor}` }}>
                        <div>
                          <strong>{asset.symbol}</strong>
                          <div style={{ fontSize: '0.75rem', color: dimmedTextColor }}>{asset.name}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', borderBottom: `1px solid ${tableBorderColor}` }}>
                        {asset.allocationPercentage}%
                      </td>
                      <td style={{ padding: '12px 8px', borderBottom: `1px solid ${tableBorderColor}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '50%', 
                            background: `conic-gradient(${getRiskColor(asset.riskScore)} ${asset.riskScore}%, ${progressBarBgColor} 0)` 
                          }}></div>
                          {asset.riskScore}/100
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', borderBottom: `1px solid ${tableBorderColor}` }}>
                        <Badge 
                          label={getRiskCategory(asset.riskScore).label} 
                          color={getRiskCategory(asset.riskScore).color}
                          size="small"
                        />
                      </td>
                      <td style={{ padding: '12px 8px', borderBottom: `1px solid ${tableBorderColor}`, width: '100px' }}>
                        <ProgressBar value={asset.volatility} />
                      </td>
                      <td style={{ padding: '12px 8px', borderBottom: `1px solid ${tableBorderColor}` }}>
                        ${(asset.marketCap / 1e9).toFixed(1)}B
                      </td>
                      <td style={{ padding: '12px 8px', borderBottom: `1px solid ${tableBorderColor}` }}>
                        <strong>{asset.allocationImpact.toFixed(1)}%</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          
          <h2 style={{ color: textColor }}>Asset Deep Dive: Bitcoin</h2>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <Card>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 16px 0', color: textColor }}>BTC Risk Assessment</h3>
                  <Badge 
                    label={getRiskCategory(42).label} 
                    color={getRiskCategory(42).color}
                    size="large"
                  />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                  <RiskScoreRing score={42} />
                </div>
                
                <div style={{ margin: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
                    <span>Portfolio Allocation:</span>
                    <strong>45%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
                    <span>Risk Impact:</span>
                    <strong>18.9%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
                    <span>Market Cap:</span>
                    <strong>$1,600.0B</strong>
                  </div>
                </div>
              </Card>
            </div>
            
            <div style={{ flex: '1', minWidth: '300px' }}>
              <Card title="Risk Analysis">
                <p style={{ marginBottom: '16px', color: textColor }}>
                  Bitcoin has a medium risk profile due to its established market position and high liquidity. 
                  However, its volatility remains significant compared to traditional assets. 
                  Its regulatory status is increasingly clear in most jurisdictions.
                </p>
                
                <div style={{ margin: '20px 0' }}>
                  <h4 style={{ color: textColor }}>Key Risk Factors</h4>
                  
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span>Volatility</span>
                      <span>38/100</span>
                    </div>
                    <ProgressBar value={38} />
                  </div>
                  
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span>Concentration</span>
                      <span>65/100</span>
                    </div>
                    <ProgressBar value={65} />
                  </div>
                  
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span>Regulatory Exposure</span>
                      <span>35/100</span>
                    </div>
                    <ProgressBar value={35} />
                  </div>
                </div>
                
                <h4 style={{ color: textColor }}>Recommended Actions</h4>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: isDark ? theme.colors.dark[8] : '#f5f5f5', 
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  color: textColor
                }}>
                  Your Bitcoin position is well-balanced. Consider maintaining your current allocation
                  and potentially staking or lending a portion for yield to enhance returns while 
                  maintaining your exposure to the asset.
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </Container>
  );
};

export default RiskAssessmentDashboard; 