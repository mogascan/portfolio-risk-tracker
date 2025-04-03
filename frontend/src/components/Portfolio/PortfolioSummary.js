// frontend/src/components/Portfolio/PortfolioSummary.js
import React from 'react';
import { Paper, Title, Text, Group, Stack, SimpleGrid, Badge, Tooltip, Image, useMantineTheme, useMantineColorScheme, Box } from '@mantine/core';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useMarket } from '../../contexts/MarketContext';
import { useConfig } from '../../contexts/ConfigContext';
import { formatPercentage, formatDollarWithCommas } from '../../utils/formatters';
import './Portfolio.css';

// Define colors for the pie chart
const COLORS = ['#339AF0', '#51CF66', '#FF6B6B', '#FAB005', '#BE4BDB', '#15AABF', '#FF922B'];

function PortfolioSummary({ showTitle = true }) {
  const { portfolio } = usePortfolio();
  const { topCoins } = useMarket();
  const { maxLossPercentage, takeProfit } = useConfig();
  const { totalValue, totalCost, absoluteProfit, performance, assets } = portfolio;
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  // Get theme-appropriate colors
  const cardBgColor = isDark ? theme.colors.dark[6] : theme.white;
  const textColor = isDark ? theme.white : theme.black;
  const secondaryTextColor = isDark ? theme.colors.dark[1] : theme.colors.gray[6];
  const borderColor = isDark ? theme.colors.dark[4] : theme.colors.gray[2];
  const progressBgColor = isDark ? theme.colors.dark[5] : theme.colors.gray[0];

  const getPerformanceColor = (value) => {
    const num = parseFloat(value);
    return num > 0 ? 'green' : num < 0 ? 'red' : 'dimmed';
  };

  const calculateAssetAllocation = () => {
    if (!assets.length) return [];
    
    return assets.map((asset, index) => ({
      name: asset.symbol,
      value: asset.value,
      price: asset.currentPrice,
      percentage: ((asset.value / totalValue) * 100).toFixed(1),
      color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);
  };

  const assetAllocation = calculateAssetAllocation();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '8px', 
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <Text weight={500}>{data.name}</Text>
          <Text size="sm">${formatValue(data.value)}</Text>
          <Text size="sm">{data.percentage}%</Text>
        </div>
      );
    }
    return null;
  };

  // Format value with proper formatting and null checks
  const formatValue = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Get risk indicator based on market rank
  const getRiskIndicator = (asset) => {
    const coin = topCoins.find(c => 
      c.id === asset.coinId || 
      c.symbol.toLowerCase() === asset.symbol.toLowerCase()
    );
    
    if (!coin) return { color: 'gray', label: 'Unknown', description: 'Market data unavailable' };
    
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

  // Find the riskiest asset in portfolio
  const findRiskiestAsset = () => {
    if (!assets || assets.length === 0 || !topCoins || topCoins.length === 0) {
      return null;
    }

    // Sort assets by risk (highest market rank = highest risk)
    const assetsWithRisk = assets.map(asset => {
      const coin = topCoins.find(c => 
        c.id === asset.coinId || 
        c.symbol.toLowerCase() === asset.symbol.toLowerCase()
      );
      
      const marketRank = coin ? (coin.market_cap_rank || 999999) : 999999; // Assign a very high rank if not found
      return { ...asset, marketRank };
    });
    
    // Sort by market rank (highest number = highest risk)
    const sortedByRisk = [...assetsWithRisk].sort((a, b) => b.marketRank - a.marketRank);
    
    // Return the riskiest asset (highest market rank)
    return sortedByRisk[0];
  };

  // Find the safest asset in portfolio (lowest market rank)
  const findSafestAsset = () => {
    if (!assets || assets.length === 0 || !topCoins || topCoins.length === 0) {
      return null;
    }

    // Sort assets by risk (lowest market rank = lowest risk)
    const assetsWithRisk = assets.map(asset => {
      const coin = topCoins.find(c => 
        c.id === asset.coinId || 
        c.symbol.toLowerCase() === asset.symbol.toLowerCase()
      );
      
      const marketRank = coin ? (coin.market_cap_rank || 999999) : 999999; // Assign a very high rank if not found
      return { ...asset, marketRank };
    });
    
    // Sort by market rank (lowest number = lowest risk)
    const sortedByRisk = [...assetsWithRisk].sort((a, b) => a.marketRank - b.marketRank);
    
    // Return the safest asset (lowest market rank)
    return sortedByRisk[0];
  };

  const RiskAnalysis = () => {
    const volatility = 65; // This would come from your risk calculation logic
    const getRiskLevel = (vol) => {
      if (vol <= 30) return 'Low Risk';
      if (vol <= 70) return 'Moderate Risk';
      return 'High Risk';
    };

    const riskiestAsset = findRiskiestAsset();
    const riskIndicator = riskiestAsset ? getRiskIndicator(riskiestAsset) : null;
    
    const safestAsset = findSafestAsset();
    const safeIndicator = safestAsset ? getRiskIndicator(safestAsset) : null;

    // Find the color from the asset allocation for these assets
    const getRiskAssetColor = (assetSymbol) => {
      const asset = assetAllocation.find(a => a.name === assetSymbol);
      return asset ? asset.color : '#FF9800'; // Default to orange if not found
    };

    const riskiestAssetColor = riskiestAsset ? getRiskAssetColor(riskiestAsset.symbol) : '#FF9800';
    const safestAssetColor = safestAsset ? getRiskAssetColor(safestAsset.symbol) : '#4CAF50';

    return (
      <Paper 
        withBorder={false} 
        p="md" 
        className="portfolio-card" 
        style={{ 
          height: '325px', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: cardBgColor,
          color: textColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '8px'
        }}
      >
        <Title order={3} size="h4" mb="sm">Risk Analysis</Title>
        
        <Stack spacing="xs" style={{ flex: 1, justifyContent: 'space-between' }}>
          <div>
            {/* Risk Level */}
            <Group position="apart" noWrap>
              <Text size="md" fw={500}>{getRiskLevel(volatility)}</Text>
              <Text size="md" fw={700}>{volatility}%</Text>
            </Group>
            
            {/* Risk Meter Bar */}
            <div style={{ width: '100%', height: '9px', backgroundColor: '#f1f3f5', borderRadius: '4px', overflow: 'hidden', marginTop: '4px', marginBottom: '1px' }}>
              <div style={{ width: `${volatility}%`, height: '100%', backgroundColor: '#ff9800', borderRadius: '4px' }} />
            </div>
          </div>
          
          <div>
            {/* Highest Risk Asset */}
            {riskiestAsset && riskIndicator && (
              <Paper p="xs" withBorder style={{ 
                backgroundColor: `${riskIndicator.color}20`,
                marginBottom: 10,
                borderColor: `${riskIndicator.color}40`
              }}>
                <Text fw={500} size="sm" mb={8}>Highest Risk</Text>
                <Group position="apart" style={{ width: '100%' }}>
                  <Group spacing="xs" noWrap>
                    <div style={{ 
                      width: '14px', 
                      height: '14px', 
                      borderRadius: '50%', 
                      backgroundColor: riskiestAssetColor,
                      flexShrink: 0
                    }} />
                    <Text size="md">{riskiestAsset.symbol}</Text>
                  </Group>
                  <Badge 
                    variant="filled" 
                    styles={(theme) => ({
                      root: {
                        backgroundColor: riskIndicator.color,
                        color: 'white'
                      }
                    })}
                    size="sm"
                    ml="auto"
                  >
                    {riskIndicator.label}
                  </Badge>
                </Group>
                <Text size="xs" mt={8} c="dimmed">Monitor this position closely</Text>
              </Paper>
            )}
            
            {/* Lowest Risk Asset */}
            {safestAsset && safeIndicator && (
              <Paper p="xs" withBorder style={{ 
                backgroundColor: `${safeIndicator.color}20`,
                borderColor: `${safeIndicator.color}40`
              }}>
                <Text fw={500} size="sm" mb={8}>Lowest Risk</Text>
                <Group position="apart" style={{ width: '100%' }}>
                  <Group spacing="xs" noWrap>
                    <div style={{ 
                      width: '14px', 
                      height: '14px', 
                      borderRadius: '50%', 
                      backgroundColor: safestAssetColor,
                      flexShrink: 0
                    }} />
                    <Text size="md">{safestAsset.symbol}</Text>
                  </Group>
                  <Badge 
                    variant="filled" 
                    styles={(theme) => ({
                      root: {
                        backgroundColor: safeIndicator.color,
                        color: 'white'
                      }
                    })}
                    size="sm"
                    ml="auto"
                  >
                    {safeIndicator.label}
                  </Badge>
                </Group>
                <Text size="xs" mt={8} c="dimmed">Core holding for stability</Text>
              </Paper>
            )}
          </div>
        </Stack>
      </Paper>
    );
  };

  const calculatePortfolioHealth = () => {
    if (!assets || !topCoins) return null;

    const totalAssets = assets.length;
    let highRankValue = 0;
    let lowRankValue = 0;
    let midRankValue = 0;

    assets.forEach(asset => {
      const coin = topCoins.find(c => 
        c.id === asset.coinId || 
        c.symbol.toLowerCase() === asset.symbol.toLowerCase()
      );
      
      if (coin) {
        const rank = coin.market_cap_rank;
        if (rank > 100) {
          highRankValue += asset.value;
        } else if (rank <= 50) {
          lowRankValue += asset.value;
        } else {
          midRankValue += asset.value;
        }
      }
    });

    const highRankPercentage = (highRankValue / totalValue) * 100;
    const lowRankPercentage = (lowRankValue / totalValue) * 100;

    // Determine portfolio health status
    let healthStatus = {
      label: '',
      color: '',
      icon: '',
      message: '',
      diversificationMessage: ''
    };

    // Diversification health
    if (totalAssets <= 5) {
      healthStatus.diversificationMessage = 'Healthy portfolio size for focused management';
    } else {
      healthStatus.diversificationMessage = 'Consider consolidating positions for better focus';
    }

    // Overall health based on rank distribution
    if (lowRankPercentage > 50) {
      healthStatus.label = 'Healthy';
      healthStatus.color = '#4CAF50';
      healthStatus.message = 'Strong allocation in top-ranked assets';
    } else if (highRankPercentage >= 50) {
      healthStatus.label = 'High Risk';
      healthStatus.color = '#F44336';
      healthStatus.message = 'High exposure to lower-ranked assets';
    } else {
      healthStatus.label = 'Moderate';
      healthStatus.color = '#FFC107';
      healthStatus.message = 'Balanced mix of asset rankings';
    }

    return healthStatus;
  };

  const PortfolioHealthIndicator = () => {
    const health = calculatePortfolioHealth();
    if (!health) return null;

    return (
      <Paper 
        withBorder 
        p="sm"
        style={{
          backgroundColor: `${health.color}10`,
          borderColor: `${health.color}30`,
          marginTop: '-25px'
        }}
      >
        <Stack spacing={4}>
          <Group position="apart" align="center">
            <Group spacing="xs">
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: health.color
              }} />
              <Text size="sm" fw={500} style={{ color: health.color }}>
                Portfolio Health: {health.label}
              </Text>
            </Group>
            <Badge 
              variant="filled" 
              styles={(theme) => ({
                root: {
                  backgroundColor: health.color,
                  color: 'white'
                }
              })}
              size="sm"
            >
              {assets.length} Assets
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">{health.message}</Text>
          <Text size="xs" c="dimmed">{health.diversificationMessage}</Text>
        </Stack>
      </Paper>
    );
  };

  const AssetAllocation = () => {
    return (
      <Paper 
        withBorder={false} 
        p="md" 
        className="portfolio-card" 
        style={{ 
          height: '325px', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: cardBgColor,
          color: textColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '8px'
        }}
      >
        <Title order={3} size="h4" mb="md">Asset Allocation</Title>
        {assetAllocation.length > 0 ? (
          <Stack spacing="md" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
              <div style={{ width: '40%' }}>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={assetAllocation}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={55}
                      innerRadius={40}
                      paddingAngle={1}
                      fill="#8884d8"
                      stroke="none"
                    >
                      {assetAllocation.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: '55%' }}>
                <Stack spacing={10}>
                  {assetAllocation.slice(0, 3).map((asset) => (
                    <Group key={asset.name} spacing="xs" align="center" noWrap>
                      <div style={{ 
                        width: 14, 
                        height: 14, 
                        borderRadius: '50%', 
                        backgroundColor: asset.color,
                        flexShrink: 0
                      }} />
                      <Group spacing={4} noWrap>
                        <Text size="md">{asset.name}</Text>
                        <Text size="sm" style={{ color: secondaryTextColor }}>
                          (${asset.price ? asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'})
                        </Text>
                      </Group>
                      <Text size="md" fw={500} ml="auto">{asset.percentage}%</Text>
                    </Group>
                  ))}
                </Stack>
              </div>
            </div>
            <PortfolioHealthIndicator />
          </Stack>
        ) : (
          <Text c="dimmed">No assets in portfolio</Text>
        )}
      </Paper>
    );
  };

  // Find the best and worst performing tokens in the last 24h
  const findPerformanceExtremes = () => {
    if (!assets || assets.length === 0) return { best: null, worst: null };
    
    // Sort assets by 24h price change
    const sortedAssets = [...assets].sort((a, b) => b.price_change_24h - a.price_change_24h);
    
    // Get the best and worst performers
    const best = sortedAssets[0];
    const worst = sortedAssets[sortedAssets.length - 1];
    
    // Calculate dollar value change for each
    const bestDollarChange = best ? (best.value * best.price_change_24h / 100) : 0;
    const worstDollarChange = worst ? (worst.value * worst.price_change_24h / 100) : 0;
    
    // Find corresponding coin data for images
    const bestCoin = topCoins.find(c => 
      c.id === best?.coinId || 
      c.symbol?.toLowerCase() === best?.symbol.toLowerCase()
    );
    
    const worstCoin = topCoins.find(c => 
      c.id === worst?.coinId || 
      c.symbol?.toLowerCase() === worst?.symbol.toLowerCase()
    );
    
    return { 
      best: {
        ...best,
        image: bestCoin?.image,
        dollarChange: bestDollarChange
      }, 
      worst: {
        ...worst,
        image: worstCoin?.image,
        dollarChange: worstDollarChange
      } 
    };
  };

  const { best, worst } = findPerformanceExtremes();

  // Calculate stop loss value based on entry value and user settings
  const baselineValue = takeProfit?.entryValue || totalValue;
  const stopLossPercentage = (100 - maxLossPercentage) / 100;
  const protectedValue = baselineValue * stopLossPercentage;
  
  // Calculate delta - distance from current value to stop loss
  const deltaValue = totalValue - protectedValue;

  return (
    <Paper 
      withBorder={false} 
      p="md" 
      pt="xs" 
      className="portfolio-summary" 
      style={{ 
        backgroundColor: cardBgColor, 
        color: textColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px'
      }}
    >
      <Stack spacing="sm">
        {showTitle && <Title order={2} style={{ color: textColor }}>Portfolio Summary</Title>}

        <Paper 
          withBorder={false} 
          p="md" 
          className="portfolio-card" 
          style={{ 
            backgroundColor: cardBgColor, 
            color: textColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            minHeight: '168px'
          }}
        >
          <div style={{ position: 'relative' }}>
            <div>
              <Title order={3} size="h4" style={{ color: textColor }}>Total Value</Title>
              <Text style={{ fontSize: '42px', lineHeight: 1.1, color: '#339AF0' }} className="total-value-element">
                {formatDollarWithCommas(totalValue)}
              </Text>
              <Text size="xs" style={{ color: secondaryTextColor }}>Updated just now</Text>
              
              {/* Delta from Stop Loss Status Bar */}
              <div style={{ marginTop: '40px', marginBottom: '5px' }}>
                {/* Number line visualization with entry value as midpoint */}
                {(() => {
                  const profitPercentage = performance.overall;
                  const entryValue = takeProfit.entryValue || totalValue;
                  const currentValue = totalValue;
                  const percentChange = ((currentValue - entryValue) / entryValue) * 100;
                  
                  // Calculate stop loss and take profit targets as percentages from entry
                  const stopLossPercent = -maxLossPercentage; // negative percentage
                  const takeProfitPercent = takeProfit.targetPercentage || maxLossPercentage; // same distance as stop loss by default
                  
                  // Calculate stop loss and take profit values
                  const stopLossValue = entryValue * (1 + (stopLossPercent / 100));
                  const takeProfitValue = entryValue * (1 + (takeProfitPercent / 100));
                  
                  // Calculate position on number line (-100 to +100)
                  // Map percentChange to -100 to +100 scale where:
                  // -maxLossPercentage maps to -100
                  // 0 maps to 0
                  // +takeProfitPercent maps to +100
                  const position = Math.max(-100, Math.min(100, (percentChange / Math.max(maxLossPercentage, takeProfitPercent)) * 100));
                  
                  // For marker positions
                  const midPosition = 50; // Middle of the bar is the 0% point (entry value)
                  
                  // Convert position (-100 to +100) to width percentage (0 to 100)
                  const positionAsWidth = position + 100; // Convert -100...100 to 0...200
                  const normalizedPosition = positionAsWidth / 2; // Convert 0...200 to 0...100
                  
                  // Determine color based on position
                  const getPositionColor = () => {
                    if (position < 0) {
                      // Red with intensity based on how close to stop loss
                      const intensity = Math.min(100, Math.abs(position));
                      return `rgba(255, 65, 65, ${intensity / 100})`;
                    } else {
                      // Green with intensity based on how far in profit
                      const intensity = Math.min(100, position);
                      return `rgba(76, 175, 80, ${intensity / 100})`;
                    }
                  };
                  
                  // Format for tooltip display
                  const formatValue = (value) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  
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
                  
                  return (
                    <>
                      <Group position="apart" mb={5}>
                        <Text size="xs" fw={500} style={{ color: secondaryTextColor }}>Position Relative to Entry</Text>
                        <Text size="xs" fw={600} c={percentChange < 0 ? "red" : "green"}>
                          {!isNaN(percentChange) ? percentChange.toFixed(1) + '%' : '0.0%'}
                        </Text>
                      </Group>
                      
                      {/* Number line visualization */}
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'flex-start',
                        marginBottom: '28px',
                        marginTop: '8px',
                        position: 'relative',
                        width: '100%'
                      }}>
                        <div style={{ 
                          width: '100%', 
                          height: '6px', 
                          background: 'linear-gradient(to right, #ff6b6b 0%, #adb5bd 50%, #51cf66 100%)',
                          borderRadius: '3px', 
                          position: 'relative',
                        }}>
                          {/* Current position indicator */}
                          <Tooltip 
                            label={`Current: $${formatValue(currentValue)} (${percentChange.toFixed(1)}%)`}
                            withArrow
                            position="top"
                            color={isDark ? 'dark.7' : 'dark.9'}
                            styles={tooltipStyles}
                          >
                            <div style={{
                              position: 'absolute',
                              left: `${50 + (percentChange / maxLossPercentage) * 50}%`,
                              top: '-7px',
                              width: '20px',
                              height: '20px',
                              backgroundColor: '#0d6efd',
                              borderRadius: '50%',
                              transform: 'translateX(-50%)',
                              border: `2px solid ${isDark ? theme.colors.dark[7] : 'white'}`,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              zIndex: 3,
                              cursor: 'pointer'
                            }} />
                          </Tooltip>
                        </div>
                      </div>
                      
                      {/* Percentage markers */}
                      <div style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '-25px',
                        marginBottom: '15px',
                        padding: '0 10px'
                      }}>
                        <Tooltip 
                          label={`Protected Value: $${formatValue(entryValue * (1 - maxLossPercentage/100))}`}
                          withArrow
                          position="bottom"
                          color={isDark ? 'dark.7' : 'dark.9'}
                          styles={tooltipStyles}
                        >
                          <Text size="xs" style={{ color: secondaryTextColor, cursor: 'pointer' }}>-{maxLossPercentage}%</Text>
                        </Tooltip>
                        
                        <Tooltip 
                          label={`Entry Value: $${formatValue(entryValue)}`}
                          withArrow
                          position="bottom"
                          color={isDark ? 'dark.7' : 'dark.9'}
                          styles={tooltipStyles}
                        >
                          <Text size="xs" style={{ color: secondaryTextColor, cursor: 'pointer' }}>0%</Text>
                        </Tooltip>
                        
                        <Tooltip 
                          label={`Protect Gains: $${formatValue(entryValue * (1 + maxLossPercentage/100))}`}
                          withArrow
                          position="bottom"
                          color={isDark ? 'dark.7' : 'dark.9'}
                          styles={tooltipStyles}
                        >
                          <Text size="xs" style={{ color: secondaryTextColor, cursor: 'pointer' }}>+{maxLossPercentage}%</Text>
                        </Tooltip>
                      </div>
                      
                      {/* Trailing Stop Loss Alert */}
                      {percentChange > 0 && percentChange >= maxLossPercentage && (
                        <Text size="xs" fw={600} mt={5} c="green" style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: '8px', 
                            height: '8px', 
                            backgroundColor: 'green', 
                            borderRadius: '50%',
                            marginRight: '4px'
                          }}></span>
                          {Math.floor(percentChange / maxLossPercentage)}x gain achieved - Consider trailing stop at ${(entryValue + (entryValue * (percentChange - maxLossPercentage) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            
            {/* Modern profit/loss menu area - fully right justified */}
            <Paper 
              p="sm"
              withBorder={isDark}
              className="profit-loss-menu"
              style={{
                backgroundColor: isDark ? theme.colors.dark[8] : theme.colors.gray[0],
                color: textColor,
                borderRadius: '8px',
                minWidth: '150px',
                border: isDark ? `1px solid ${theme.colors.dark[6]} !important` : 'none !important',
                boxShadow: isDark ? '0 2px 10px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.08)',
                position: 'absolute',
                top: 0,
                right: 0,
                transition: 'background-color 0.3s ease, color 0.3s ease, border 0.3s ease',
                zIndex: 10
              }}
            >
              <Stack spacing={8}>
                {/* Total Profit */}
                <div>
                  <Group position="apart" noWrap>
                    <Text size="xs" fw={500} style={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : theme.colors.gray[6] }}>Total Profit</Text>
                    <Text size="sm" fw={700} style={{ 
                      color: absoluteProfit > 0 ? 
                        (isDark ? theme.colors.green[3] : theme.colors.green[7]) : 
                        (isDark ? theme.colors.red[3] : theme.colors.red[7])
                    }}>
                      ${absoluteProfit ? absoluteProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                    </Text>
                  </Group>
                  <div 
                    style={{ 
                      height: '3px', 
                      width: '100%', 
                      backgroundColor: isDark ? theme.colors.dark[6] : theme.colors.gray[2], 
                      borderRadius: '2px', 
                      marginTop: '2px',
                      transition: 'background-color 0.3s ease'
                    }}
                  >
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${Math.min(Math.abs(performance.overall || 0), 100)}%`, 
                        backgroundColor: absoluteProfit > 0 ? 
                          (isDark ? theme.colors.green[5] : theme.colors.green[6]) : 
                          (isDark ? theme.colors.red[5] : theme.colors.red[6]),
                        borderRadius: '2px'
                      }} 
                    />
                  </div>
                </div>
                
                {/* Stop Loss Level */}
                <div>
                  <Group position="apart" noWrap>
                    <Text size="xs" fw={500} style={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : theme.colors.gray[6] }}>Stop Loss</Text>
                    <Text size="sm" fw={700} style={{ color: isDark ? theme.colors.red[3] : theme.colors.red[7] }}>
                      ${protectedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </Group>
                  <div 
                    style={{ 
                      height: '3px', 
                      width: '100%', 
                      backgroundColor: isDark ? theme.colors.dark[6] : theme.colors.gray[2], 
                      borderRadius: '2px', 
                      marginTop: '2px',
                      transition: 'background-color 0.3s ease'
                    }}
                  >
                    <div 
                      style={{ 
                        height: '100%', 
                        width: '100%', 
                        backgroundColor: isDark ? theme.colors.red[5] : theme.colors.red[6],
                        borderRadius: '2px',
                        opacity: 0.5
                      }} 
                    />
                  </div>
                </div>
                
                {/* Take Profit Level - Only show if set */}
                {takeProfit.targetValue > 0 && (
                  <div>
                    <Group position="apart" noWrap>
                      <Text size="xs" fw={500} style={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : theme.colors.gray[6] }}>Take Profit</Text>
                      <Text size="sm" fw={700} style={{ color: isDark ? theme.colors.green[3] : theme.colors.green[7] }}>
                        ${takeProfit.targetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </Group>
                    <div 
                      style={{ 
                        height: '3px', 
                        width: '100%', 
                        backgroundColor: isDark ? theme.colors.dark[6] : theme.colors.gray[2], 
                        borderRadius: '2px', 
                        marginTop: '2px',
                        transition: 'background-color 0.3s ease'
                      }}
                    >
                      <div 
                        style={{ 
                          height: '100%', 
                          width: '100%', 
                          backgroundColor: isDark ? theme.colors.green[5] : theme.colors.green[6],
                          borderRadius: '2px',
                          opacity: 0.5
                        }} 
                      />
                    </div>
                  </div>
                )}
              </Stack>
            </Paper>
          </div>
        </Paper>

        <Group grow>
          <Paper 
            withBorder={false} 
            p="md" 
            className="portfolio-card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: '145px',
              height: '145px',
              backgroundColor: cardBgColor, 
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              paddingBottom: '10px'
            }}
          >
            <Title order={3} size="h4" mb={8} style={{ color: textColor }}>Performance</Title>
            <Group grow style={{ width: '100%', flexWrap: 'wrap', flex: 1 }}>
              <div className="performance-metric">
                <Text size="xs" className="performance-metric-header" style={{ color: secondaryTextColor }}>24h</Text>
                <Text size="md" className="performance-metric-value" c={getPerformanceColor(performance.daily)}>
                  {formatPercentage(performance.daily)}
                </Text>
                <Text size="xs" c={getPerformanceColor(performance.daily)}>
                  {formatDollarWithCommas(totalValue * performance.daily / 100)}
                </Text>
              </div>
              <div className="performance-metric">
                <Text size="xs" className="performance-metric-header" style={{ color: secondaryTextColor }}>7d</Text>
                <Text size="md" className="performance-metric-value" c={getPerformanceColor(performance.weekly)}>
                  {formatPercentage(performance.weekly)}
                </Text>
                <Text size="xs" c={getPerformanceColor(performance.weekly)}>
                  {formatDollarWithCommas(totalValue * performance.weekly / 100)}
                </Text>
              </div>
              <div className="performance-metric">
                <Text size="xs" className="performance-metric-header" style={{ color: secondaryTextColor }}>30d</Text>
                <Text size="md" className="performance-metric-value" c={getPerformanceColor(performance.monthly)}>
                  {formatPercentage(performance.monthly)}
                </Text>
                <Text size="xs" c={getPerformanceColor(performance.monthly)}>
                  {formatDollarWithCommas(totalValue * performance.monthly / 100)}
                </Text>
              </div>
            </Group>
          </Paper>

          <Paper 
            withBorder={false} 
            p="md" 
            className="portfolio-card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: '145px',
              height: '145px',
              backgroundColor: cardBgColor, 
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px'
            }}
          >
            <Title order={3} size="h4" mb={8} style={{ color: textColor }}>24h Movers</Title>
            <Stack spacing={16} style={{ flex: 1, justifyContent: 'center' }}>
              {best && (
                <Group position="apart" noWrap>
                  <Group spacing={6} noWrap>
                    {best.image && (
                      <Image 
                        src={best.image} 
                        width={20} 
                        height={20} 
                        radius="xl" 
                        alt={best.symbol}
                        style={{ flexShrink: 0 }} 
                      />
                    )}
                    <Text size="sm" fw={500} style={{ color: textColor }}>{best.symbol}</Text>
                  </Group>
                  <Group spacing={2} style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <Text size="sm" fw={700} c="green" style={{ textAlign: 'right' }}>
                      {formatPercentage(best.price_change_24h)}
                    </Text>
                    <Text size="xs" c="green">
                      {formatDollarWithCommas(Math.abs(best.dollarChange))}
                    </Text>
                  </Group>
                </Group>
              )}
              
              {worst && (
                <Group position="apart" noWrap>
                  <Group spacing={6} noWrap>
                    {worst.image && (
                      <Image 
                        src={worst.image} 
                        width={20} 
                        height={20} 
                        radius="xl" 
                        alt={worst.symbol}
                        style={{ flexShrink: 0 }} 
                      />
                    )}
                    <Text size="sm" fw={500} style={{ color: textColor }}>{worst.symbol}</Text>
                  </Group>
                  <Group spacing={2} style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <Text size="sm" fw={700} c="red" style={{ textAlign: 'right' }}>
                      {formatPercentage(worst.price_change_24h)}
                    </Text>
                    <Text size="xs" c="red">
                      {formatDollarWithCommas(Math.abs(worst.dollarChange))}
                    </Text>
                  </Group>
                </Group>
              )}
            </Stack>
          </Paper>
        </Group>

        <SimpleGrid cols={2} spacing="sm">
          <AssetAllocation />
          <RiskAnalysis />
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

export default PortfolioSummary;