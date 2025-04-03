// frontend/src/components/Portfolio/AssetList.js
import React, { useState } from 'react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useAI } from '../../contexts/AIContext';
import { useMarket } from '../../contexts/MarketContext';
import { fetchAssetAnalysis } from '../../api/ai';
import { Table, Paper, Text, ActionIcon, Group, Tooltip, Badge, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { IconTrash, IconInfoCircle, IconArrowUp, IconArrowDown } from '@tabler/icons-react';
import { differenceInDays, differenceInMonths, differenceInYears, format } from 'date-fns';
import './Portfolio.css';

const AssetList = () => {
  const { portfolio, removeAsset } = usePortfolio();
  const { topCoins } = useMarket();
  const { assets } = portfolio;
  const { maxLossPercentage } = useConfig();
  const { getInsight, setLoading } = useAI();
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetAnalysis, setAssetAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Define a consistent tooltip style
  const tooltipStyles = {
    tooltip: {
      fontSize: '12px',
      padding: '8px 12px',
      backgroundColor: isDark ? theme.colors.dark[7] : theme.colors.dark[9],
      color: 'white',
      border: isDark ? `1px solid ${theme.colors.dark[5]}` : 'none'
    }
  };
  
  if (!portfolio.assets || portfolio.assets.length === 0) {
    return <div className="empty-state">No assets found in your portfolio.</div>;
  }
  
  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Sort assets
  const sortedAssets = [...portfolio.assets].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (typeof aValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });
  
  // Get AI analysis for an asset
  const getAssetAnalysis = async (asset) => {
    setSelectedAsset(asset);
    setAnalysisLoading(true);
    
    try {
      const result = await fetchAssetAnalysis(asset.asset_id);
      setAssetAnalysis(result.analysis);
    } catch (err) {
      console.error('Error getting asset analysis:', err);
      // Set a mock analysis in development
      setAssetAnalysis({
        summary: `${asset.symbol} makes up a significant portion of your portfolio. Consider your risk exposure.`,
        strengths: ['Strong market position', 'Good liquidity', 'Recent positive momentum'],
        weaknesses: ['Volatility higher than average', 'Regulatory uncertainty'],
        recommendations: ['Consider taking partial profits if position exceeds 20% of portfolio', 'Set stop-loss to protect gains']
      });
    } finally {
      setAnalysisLoading(false);
    }
  };
  
  const formatValue = (value) => {
    // Check for undefined, null, or NaN values
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };
  
  // Handle delete asset
  const handleDelete = (assetId) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      removeAsset(assetId);
    }
  };

  // Get risk indicator based on market rank
  const getRiskIndicator = (asset) => {
    const coin = topCoins.find(c => 
      c.id === asset.coinId || 
      c.symbol.toLowerCase() === asset.symbol.toLowerCase()
    );
    
    if (!coin) return { color: 'gray', label: 'Unknown' };
    
    // Use market_cap_rank instead of rank
    const rank = coin.market_cap_rank || 999; // Default to high risk if no rank
    
    if (rank <= 10) {
      return { color: '#4CAF50', label: 'Premium', description: 'Top 10 cryptocurrency by market cap' };
    } else if (rank <= 20) {
      return { color: '#2196F3', label: 'Safe', description: 'Top 11-20 cryptocurrency by market cap' };
    } else if (rank <= 50) {
      return { color: '#FFC107', label: 'Moderate', description: 'Top 21-50 cryptocurrency by market cap' };
    } else if (rank <= 100) {
      return { color: '#FF9800', label: 'Caution', description: 'Ranked 51-100 by market cap - moderate risk' };
    } else {
      return { color: '#F44336', label: 'High Risk', description: 'Ranked >100 by market cap - extreme risk' };
    }
  };
  
  // Calculate asset age
  const calculateAssetAge = (purchaseDate) => {
    const today = new Date();
    const purchase = new Date(purchaseDate);
    
    const years = differenceInYears(today, purchase);
    if (years > 0) {
      return years === 1 ? '1 year' : `${years} years`;
    }
    
    const months = differenceInMonths(today, purchase);
    if (months > 0) {
      return months === 1 ? '1 month' : `${months} months`;
    }
    
    const days = differenceInDays(today, purchase);
    return days === 1 ? '1 day' : `${days} days`;
  };
  
  return (
    <Paper 
      shadow="none" 
      p="md" 
      mt="md" 
      withBorder={false}
      style={{
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        borderRadius: '8px',
        backgroundColor: isDark ? theme.colors.dark[6] : 'white'
      }}
    >
      <Table horizontalSpacing="lg" verticalSpacing="sm">
        <thead>
          <tr>
            <th style={{ cursor: 'pointer', textAlign: 'left', minWidth: '100px' }} onClick={() => handleSort('symbol')}>Asset</th>
            <th style={{ textAlign: 'center', width: '80px' }}>Risk</th>
            <th style={{ cursor: 'pointer', textAlign: 'right', minWidth: '100px' }} onClick={() => handleSort('allocation')}>Allocation</th>
            <th style={{ cursor: 'pointer', textAlign: 'right', minWidth: '100px' }} onClick={() => handleSort('amount')}>Amount</th>
            <th style={{ cursor: 'pointer', textAlign: 'right', minWidth: '120px' }} onClick={() => handleSort('currentPrice')}>Price</th>
            <th style={{ cursor: 'pointer', textAlign: 'right', minWidth: '120px' }} onClick={() => handleSort('value')}>Value</th>
            <th style={{ cursor: 'pointer', textAlign: 'right', minWidth: '100px' }} onClick={() => handleSort('price_change_24h')}>24h Change</th>
            <th style={{ cursor: 'pointer', textAlign: 'center', minWidth: '100px' }} onClick={() => handleSort('purchaseDate')}>Age</th>
            <th style={{ textAlign: 'center', minWidth: '100px' }}>Actions</th>
            <th style={{ textAlign: 'center', width: '60px' }}></th>
          </tr>
        </thead>
        <tbody>
          {sortedAssets.map((asset) => {
            const allocation = (asset.value / portfolio.totalValue * 100).toFixed(1);
            const riskIndicator = getRiskIndicator(asset);
            const assetAge = calculateAssetAge(asset.purchaseDate);
            return (
              <tr key={asset.id}>
                <td style={{ textAlign: 'left' }}>
                  <Group spacing="xs" noWrap>
                    {(() => {
                      const coin = topCoins.find(c => 
                        c.id === asset.coinId || 
                        c.symbol.toLowerCase() === asset.symbol.toLowerCase()
                      );
                      
                      return coin?.image ? (
                        <img 
                          src={coin.image} 
                          alt={asset.symbol} 
                          style={{ 
                            width: 24, 
                            height: 24, 
                            borderRadius: '50%',
                            flexShrink: 0
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          backgroundColor: '#e9ecef',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '10px',
                          color: '#495057'
                        }}>
                          {asset.symbol.substring(0, 2).toUpperCase()}
                        </div>
                      );
                    })()}
                    <Text weight={500}>{asset.symbol}</Text>
                  </Group>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <Tooltip 
                    label={`${riskIndicator.label} - ${riskIndicator.description}`} 
                    withArrow
                    position="top"
                    color={isDark ? 'dark.7' : 'dark.9'}
                    styles={tooltipStyles}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          backgroundColor: riskIndicator.color,
                          border: '1px solid rgba(0,0,0,0.1)',
                          display: 'inline-block'
                        }} 
                      />
                    </div>
                  </Tooltip>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {allocation}%
                </td>
                <td style={{ textAlign: 'right' }}>{asset.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 8
                })}</td>
                <td style={{ textAlign: 'right' }}>{formatValue(asset.currentPrice)}</td>
                <td style={{ textAlign: 'right' }}>{formatValue(asset.value)}</td>
                <td style={{ textAlign: 'right' }} className={`asset-change ${asset.price_change_24h > 0 ? 'positive' : asset.price_change_24h < 0 ? 'negative' : ''}`}>
                  {asset.price_change_24h ? `${asset.price_change_24h > 0 ? '+' : ''}${asset.price_change_24h.toFixed(2)}%` : 'N/A'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <Tooltip 
                    label={`Purchased on ${format(new Date(asset.purchaseDate), 'MMM d, yyyy')}`} 
                    withArrow
                    position="top"
                    color={isDark ? 'dark.7' : 'dark.9'}
                    styles={tooltipStyles}
                  >
                    <Text size="sm">{assetAge}</Text>
                  </Tooltip>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    onClick={() => getAssetAnalysis(asset)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      border: '1px solid #dee2e6',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Analyze
                  </button>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <ActionIcon 
                    color="red" 
                    variant="subtle"
                    onClick={() => handleDelete(asset.id)}
                    title="Delete asset"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      
      {selectedAsset && (
        <div className="asset-analysis">
          <h4>Analysis for {selectedAsset.symbol}</h4>
          
          {analysisLoading ? (
            <div className="loading">Loading analysis...</div>
          ) : assetAnalysis ? (
            <div className="analysis-content">
              <p className="analysis-summary">{assetAnalysis.summary}</p>
              
              <div className="analysis-section">
                <h5>Strengths</h5>
                <ul>
                  {assetAnalysis.strengths.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="analysis-section">
                <h5>Weaknesses</h5>
                <ul>
                  {assetAnalysis.weaknesses.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="analysis-section">
                <h5>Recommendations</h5>
                <ul>
                  {assetAnalysis.recommendations.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p>No analysis available.</p>
          )}
          
          <button className="close-button" onClick={() => setSelectedAsset(null)}>Close</button>
        </div>
      )}
    </Paper>
  );
};

export default AssetList;