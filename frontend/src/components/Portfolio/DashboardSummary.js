import React, { useState, useEffect } from 'react';
import { Paper, Title, Text, Group, Stack, Badge, Image, useMantineTheme, useMantineColorScheme, Box, Avatar, Tooltip, Grid, ScrollArea } from '@mantine/core';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useMarket } from '../../contexts/MarketContext';
import { useConfig } from '../../contexts/ConfigContext';
import { formatPercentage, formatDollarWithCommas, formatDollarResponsive, formatPercentageResponsive, getScreenSize } from '../../utils/formatters';
import './Portfolio.css';
import { IconAlertCircle, IconClock } from '@tabler/icons-react';

// Define colors for the pie chart
const COLORS = ['#339AF0', '#51CF66', '#FF6B6B', '#FAB005', '#BE4BDB', '#15AABF', '#FF922B'];

function DashboardSummary() {
  const { portfolio } = usePortfolio();
  const { topCoins, lastUpdate } = useMarket();
  const { maxLossPercentage, takeProfit } = useConfig();
  const { totalValue, performance, assets } = portfolio;
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [screenSize, setScreenSize] = useState(getScreenSize());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update screen size when window resizes
  useEffect(() => {
    const handleResize = () => {
      const newSize = getScreenSize();
      if (newSize !== screenSize) {
        console.log('Screen size changed:', newSize);
        setScreenSize(newSize);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [screenSize]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Format the update time
  const formatUpdateTime = () => {
    if (!lastUpdate) {
      return 'Updating...';
    }
    
    const lastUpdateTime = new Date(lastUpdate);
    const timeDiff = Math.floor((currentTime - lastUpdateTime) / 1000 / 60); // minutes
    
    if (timeDiff < 1) {
      return 'Updated just now';
    } else if (timeDiff === 1) {
      return 'Updated 1 minute ago';
    } else if (timeDiff < 60) {
      return `Updated ${timeDiff} minutes ago`;
    } else {
      const hours = Math.floor(timeDiff / 60);
      if (hours === 1) {
        return 'Updated 1 hour ago';
      } else if (hours < 24) {
        return `Updated ${hours} hours ago`;
      } else {
        return `Updated at ${lastUpdateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    }
  };

  // Get theme-appropriate colors
  const cardBgColor = isDark ? theme.colors.dark[6] : theme.white;
  const textColor = isDark ? theme.white : theme.black;
  const secondaryTextColor = isDark ? theme.colors.dark[1] : theme.colors.gray[6];
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const progressBgColor = isDark ? theme.colors.dark[4] : theme.colors.gray[2];
  const nestedCardBgColor = isDark ? theme.colors.dark[5] : theme.colors.gray[0];

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

  const assetAllocation = calculateAssetAllocation();
  const { best, worst } = findPerformanceExtremes();

  // Get risk indicator based on market rank
  const getRiskIndicator = (asset) => {
    const coin = topCoins.find(c => 
      c.id === asset.coinId || 
      c.symbol.toLowerCase() === asset.symbol.toLowerCase()
    );
    
    if (!coin) return { color: theme.colors.gray[6], label: 'Unknown', description: 'Market data unavailable' };
    
    const rank = coin.market_cap_rank;
    
    if (rank <= 10) {
      return { color: theme.colors.green[6], label: 'Premium', description: 'Top 10 cryptocurrency by market cap' };
    } else if (rank <= 20) {
      return { color: theme.colors.blue[6], label: 'Safe', description: 'Top 11-20 cryptocurrency by market cap' };
    } else if (rank <= 50) {
      return { color: theme.colors.yellow[6], label: 'Moderate', description: 'Top 21-50 cryptocurrency by market cap' };
    } else if (rank <= 100) {
      return { color: theme.colors.orange[6], label: 'Caution', description: 'Ranked 51-100 by market cap - moderate risk' };
    } else {
      return { color: theme.colors.red[6], label: 'High Risk', description: 'Ranked >100 by market cap - extreme risk' };
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
      
      const marketRank = coin ? coin.market_cap_rank : 999999; // Assign a very high rank if not found
      return { ...asset, marketRank };
    });
    
    // Sort by market rank (highest number = highest risk)
    const sortedByRisk = [...assetsWithRisk].sort((a, b) => b.marketRank - a.marketRank);
    
    // Return the riskiest asset (highest market rank)
    return sortedByRisk[0];
  };

  // Format currency for display
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '$0.00';
    }
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPriceChange = (change) => {
    if (change === undefined || change === null) return "↗ 0.0%";
    const formattedChange = change.toFixed(1);
    return change >= 0 ? `↗ ${formattedChange}%` : `↘ ${formattedChange}%`;
  }

  const getFullCryptoName = (symbol) => {
    switch(symbol.toUpperCase()) {
      case 'BTC': return 'Bitcoin';
      case 'ETH': return 'Ethereum';
      case 'ADA': return 'Cardano';
      case 'SOL': return 'Solana';
      case 'DOT': return 'Polkadot';
      case 'XRP': return 'Ripple';
      case 'DOGE': return 'Dogecoin';
      case 'AVAX': return 'Avalanche';
      case 'MATIC': return 'Polygon';
      case 'LINK': return 'Chainlink';
      case 'UNI': return 'Uniswap';
      case 'ATOM': return 'Cosmos';
      case 'AAVE': return 'Aave';
      case 'LTC': return 'Litecoin';
      case 'BCH': return 'Bitcoin Cash';
      case 'XLM': return 'Stellar';
      case 'ALGO': return 'Algorand';
      case 'FIL': return 'Filecoin';
      case 'XTZ': return 'Tezos';
      case 'VET': return 'VeChain';
      default: return symbol;
    }
  };

  const AssetAllocation = () => {
    return (
      <Paper 
        shadow="none" 
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
        <Group position="apart" mb={16}>
          <Title order={3} size="h4" style={{ color: textColor }}>Allocation</Title>
          <Badge color="blue" radius="sm">
            {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
          </Badge>
        </Group>
        {assetAllocation.length > 0 ? (
          <Box style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-scroll">
            {assetAllocation.length === 1 ? (
              // Single asset takes up entire card
              <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '90%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%' }}>
                  {/* Large circular progress indicator */}
                  <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'allocated', value: parseFloat(assetAllocation[0].percentage) },
                            { name: 'remaining', value: 100 - parseFloat(assetAllocation[0].percentage) }
                          ]}
                          cx="50%"
                          cy="50%"
                          startAngle={90}
                          endAngle={-270}
                          innerRadius="72%"
                          outerRadius="100%"
                          paddingAngle={0}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill={assetAllocation[0].color} />
                          <Cell fill={isDark ? "#2A2A2A" : "#EEEEEE"} />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      fontSize: '20px',
                      fontWeight: 600,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      color: textColor
                    }}>
                      {assetAllocation[0].percentage}%
                    </div>
                  </div>
                  
                  {/* Asset information */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="lg" style={{ color: textColor, marginBottom: '5px' }}>
                      {getFullCryptoName(assetAllocation[0].name)}
                    </Text>
                    <Text size="md" style={{ color: secondaryTextColor, marginBottom: '8px' }}>
                      {assetAllocation[0].name}
                    </Text>
                    <Group spacing={8} noWrap>
                      <Text size="lg" style={{ color: textColor }}>
                        ${assetAllocation[0].price !== undefined && assetAllocation[0].price !== null ? assetAllocation[0].price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </Text>
                      <Text 
                        size="md" 
                        c={
                          (() => {
                            const portfolioAsset = assets.find(a => a.symbol.toLowerCase() === assetAllocation[0].name.toLowerCase());
                            const priceChange = portfolioAsset?.price_change_24h || 0;
                            return priceChange >= 0 ? "green" : "red";
                          })()
                        }
                      >
                        {(() => {
                          const portfolioAsset = assets.find(a => a.symbol.toLowerCase() === assetAllocation[0].name.toLowerCase());
                          const priceChange = portfolioAsset?.price_change_24h || 0;
                          return formatPriceChange(priceChange);
                        })()}
                      </Text>
                    </Group>
                  </div>
                </div>
              </Box>
            ) : assetAllocation.length === 2 ? (
              // Two assets stack centered and large
              <Stack align="center" spacing={20} style={{ width: '90%', justifyContent: 'center' }}>
                {assetAllocation.slice(0, 2).map((asset, index) => {
                  const portfolioAsset = assets.find(a => a.symbol.toLowerCase() === asset.name.toLowerCase());
                  const priceChange = portfolioAsset?.price_change_24h || 0;
                  
                  // Get full name for the asset
                  const fullName = getFullCryptoName(asset.name);
                  
                  return (
                    <div key={asset.name} style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '90%' }}>
                      {/* Larger circular progress indicator */}
                      <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'allocated', value: parseFloat(asset.percentage) },
                                { name: 'remaining', value: 100 - parseFloat(asset.percentage) }
                              ]}
                              cx="50%"
                              cy="50%"
                              startAngle={90}
                              endAngle={-270}
                              innerRadius="72%"
                              outerRadius="100%"
                              paddingAngle={0}
                              dataKey="value"
                              stroke="none"
                            >
                              <Cell fill={asset.color} />
                              <Cell fill={isDark ? "#2A2A2A" : "#EEEEEE"} />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)',
                          fontSize: '16px',
                          fontWeight: 600,
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          color: textColor
                        }}>
                          {asset.percentage}%
                        </div>
                      </div>
                      
                      {/* Asset information */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text size="md" style={{ color: textColor, marginBottom: '2px' }}>
                          {fullName}
                        </Text>
                        <Text size="sm" style={{ color: secondaryTextColor, marginBottom: '4px' }}>
                          {asset.name}
                        </Text>
                        <Group spacing={6} noWrap>
                          <Text size="md" style={{ color: textColor }}>
                            ${asset.price !== undefined && asset.price !== null ? asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                          </Text>
                          <Text 
                            size="sm" 
                            c={priceChange >= 0 ? "green" : "red"}
                          >
                            {formatPriceChange(priceChange)}
                          </Text>
                        </Group>
                      </div>
                    </div>
                  );
                })}
              </Stack>
            ) : (
              // 3+ assets in rows of 2
              <ScrollArea style={{ width: '100%', height: '100%' }}>
                <Grid gutter="md" style={{ width: '90%', margin: '0 auto' }}>
                  {assetAllocation.map((asset, index) => {
                    // Get price change data from the portfolio assets
                    const portfolioAsset = assets.find(a => a.symbol.toLowerCase() === asset.name.toLowerCase());
                    const priceChange = portfolioAsset?.price_change_24h || 0;
                    
                    // Get full name for the asset
                    const fullName = getFullCryptoName(asset.name);
                    
                    return (
                      <Grid.Col key={asset.name} span={6} style={{ marginBottom: '15px' }}>
                        <Box>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {/* Circular progress indicator - keeping fixed size */}
                            <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: 'allocated', value: parseFloat(asset.percentage) },
                                      { name: 'remaining', value: 100 - parseFloat(asset.percentage) }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    startAngle={90}
                                    endAngle={-270}
                                    innerRadius="72%"
                                    outerRadius="100%"
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    <Cell fill={asset.color} />
                                    <Cell fill={isDark ? "#2A2A2A" : "#EEEEEE"} />
                                  </Pie>
                                </PieChart>
                              </ResponsiveContainer>
                              <div style={{ 
                                position: 'absolute', 
                                top: '50%', 
                                left: '50%', 
                                transform: 'translate(-50%, -50%)',
                                fontSize: '13px',
                                fontWeight: 600,
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                color: textColor
                              }}>
                                {asset.percentage}%
                              </div>
                            </div>
                            
                            {/* Asset information - allow this to shrink */}
                            <div style={{ flex: 1, minWidth: 0, maxWidth: 'calc(100% - 75px)' }}>
                              <Text size="sm" style={{ color: textColor, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {fullName}
                              </Text>
                              <Text size="xs" style={{ color: secondaryTextColor, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {asset.name}
                              </Text>
                              <Group spacing={6} noWrap>
                                <Text size="sm" style={{ color: textColor }}>
                                  ${asset.price !== undefined && asset.price !== null ? asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                </Text>
                                <Text 
                                  size="xs" 
                                  c={priceChange >= 0 ? "green" : "red"}
                                >
                                  {formatPriceChange(priceChange)}
                                </Text>
                              </Group>
                            </div>
                          </div>
                        </Box>
                      </Grid.Col>
                    );
                  })}
                </Grid>
              </ScrollArea>
            )}
          </Box>
        ) : (
          <Text c={secondaryTextColor}>No assets in portfolio</Text>
        )}
      </Paper>
    );
  };

  const CapitalProtectionCard = () => {
    // Calculate stop loss value based on entry value and user settings
    const baselineValue = takeProfit?.entryValue || totalValue;
    const stopLossPercentage = (100 - maxLossPercentage) / 100;
    const stopLossValue = baselineValue * stopLossPercentage;
    
    // Calculate delta between current value and stop loss
    const deltaValue = totalValue - stopLossValue;
    const deltaPercentage = ((deltaValue / totalValue) * 100).toFixed(2);
    
    // Calculate current P/L from entry
    const profitLoss = totalValue - baselineValue;
    const plPercentage = ((profitLoss / baselineValue) * 100).toFixed(2);
    
    // Determine status color for indicators
    const statusColor = deltaValue > baselineValue * 0.1 ? "#4caf50" : deltaValue > 0 ? "#ff9800" : "#f44336";
    
    return (
      <Paper 
        shadow="none"
        withBorder={false} 
        p="md" 
        className="portfolio-card"
        style={{ 
          height: '325px', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: cardBgColor,
          color: textColor,
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${borderColor}`,
          borderRadius: '8px'
        }}
      >
        <Group position="apart" mb={24}>
          <Title order={3} size="h4" style={{ color: textColor }}>Capital</Title>
          <Badge 
            size="sm" 
            color={deltaValue > baselineValue * 0.1 ? "green" : deltaValue > 0 ? "yellow" : "red"}
          >
            {deltaValue > baselineValue * 0.1 ? "SAFE" : deltaValue > 0 ? "CAUTION" : "DANGER"}
          </Badge>
        </Group>
        
        <Stack spacing="md" style={{ flex: 1, overflowY: 'auto' }} className="hover-scroll">
          {/* Capital to Protect */}
          <Paper p="xs" withBorder={false} style={{ 
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
            borderRadius: '8px'
          }}>
            <Group spacing={6} align="center">
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: statusColor
              }} />
              <Text fw={500} size="xs" mb={4} style={{ color: secondaryTextColor }}>Capital to Protect</Text>
            </Group>
            <Group position="apart">
              <Text size="md" fw={600} style={{ color: textColor }}>{formatCurrency(stopLossValue)}</Text>
              <Text size="sm" c="dimmed">{stopLossPercentage * 100}% of Entry</Text>
            </Group>
          </Paper>
          
          {/* Capital at Risk */}
          <Paper p="xs" withBorder={false} style={{ 
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
            borderRadius: '8px'
          }}>
            <Group spacing={6} align="center">
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: statusColor
              }} />
              <Text fw={500} size="xs" mb={4} style={{ color: secondaryTextColor }}>Capital at Risk</Text>
            </Group>
            <Group position="apart">
              <Text size="md" fw={600} style={{ color: textColor }}>{formatCurrency(deltaValue)}</Text>
              <Text size="sm" c="dimmed">{deltaPercentage}% Buffer</Text>
            </Group>
          </Paper>
          
          {/* Profit/Loss since Entry */}
          <Paper p="xs" withBorder={false} style={{ 
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
            borderRadius: '8px'
          }}>
            <Group spacing={6} align="center">
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: statusColor
              }} />
              <Text fw={500} size="xs" mb={4} style={{ color: secondaryTextColor }}>P/L from Entry</Text>
            </Group>
            <Group position="apart">
              <Text 
                size="md" 
                fw={600} 
                c={profitLoss >= 0 ? "green" : "red"}
              >
                {formatCurrency(profitLoss)}
              </Text>
              <Text 
                size="sm" 
                c={profitLoss >= 0 ? "green" : "red"}
              >
                {profitLoss >= 0 ? "+" : ""}{plPercentage}%
              </Text>
            </Group>
          </Paper>
        </Stack>
      </Paper>
    );
  };

  return (
    <Stack spacing="md">
      <Paper 
        shadow="none"
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
              {formatDollarResponsive(totalValue, screenSize)}
            </Text>
            <Text size="xs" style={{ color: secondaryTextColor }}>{formatUpdateTime()}</Text>
            
            {/* Delta from Stop Loss Status Bar */}
            <div style={{ marginTop: '40px', marginBottom: '5px' }}>
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
                const formatValue = (value) => formatDollarResponsive(value, screenSize === 'small' ? 'medium' : screenSize);
                
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
                      <Text 
                        size="xs" 
                        fw={600} 
                        c={percentChange < 0 ? "red" : "green"}
                      >
                        {!isNaN(percentChange) ? formatPercentageResponsive(percentChange, screenSize) : '0%'}
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
                          label={`Current: ${formatValue(currentValue)} (${formatPercentageResponsive(percentChange, screenSize)})`}
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
                        label={`Protected Value: ${formatValue(entryValue * (1 - maxLossPercentage/100))}`}
                        withArrow
                        position="bottom"
                        color={isDark ? 'dark.7' : 'dark.9'}
                        styles={tooltipStyles}
                      >
                        <Text size="xs" style={{ color: secondaryTextColor, cursor: 'pointer' }}>-{maxLossPercentage}%</Text>
                      </Tooltip>
                      
                      <Tooltip 
                        label={`Entry Value: ${formatValue(entryValue)}`}
                        withArrow
                        position="bottom"
                        color={isDark ? 'dark.7' : 'dark.9'}
                        styles={tooltipStyles}
                      >
                        <Text size="xs" style={{ color: secondaryTextColor, cursor: 'pointer' }}>0%</Text>
                      </Tooltip>
                      
                      <Tooltip 
                        label={`Protect Gains: ${formatValue(entryValue * (1 + maxLossPercentage/100))}`}
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
                        {Math.floor(percentChange / maxLossPercentage)}x gain achieved - Consider trailing stop at {formatValue(entryValue + (entryValue * (percentChange - maxLossPercentage) / 100))}
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
            shadow="none"
            withBorder={false}
            className="profit-loss-menu"
            style={{
              backgroundColor: isDark ? theme.colors.dark[8] : theme.colors.gray[0],
              color: textColor,
              borderRadius: '8px',
              minWidth: '150px',
              border: `1px solid ${borderColor}`,
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
                    color: performance.overall > 0 ? 
                      (isDark ? theme.colors.green[3] : theme.colors.green[7]) : 
                      (isDark ? theme.colors.red[3] : theme.colors.red[7])
                  }}>
                    {formatDollarResponsive(totalValue * performance.overall / 100, screenSize)}
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
                      width: `${Math.min(Math.abs(performance.overall), 100)}%`, 
                      backgroundColor: performance.overall > 0 ? 
                        (isDark ? theme.colors.green[5] : theme.colors.green[6]) : 
                        (isDark ? theme.colors.red[5] : theme.colors.red[6]),
                      borderRadius: '2px'
                    }} 
                  />
                </div>
              </div>
              
              {/* Stop Loss Level */}
              {(() => {
                // Calculate the necessary values for stop loss
                const entryBaselineValue = takeProfit?.entryValue || totalValue;
                const entryStopLossPercentage = (100 - maxLossPercentage) / 100;
                
                return (
                  <div>
                    <Group position="apart" noWrap>
                      <Text size="xs" fw={500} style={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : theme.colors.gray[6] }}>Stop Loss</Text>
                      <Text size="sm" fw={700} style={{ color: isDark ? theme.colors.red[3] : theme.colors.red[7] }}>
                        {formatDollarResponsive(entryBaselineValue * entryStopLossPercentage, screenSize)}
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
                );
              })()}
              
              {/* Take Profit Level - Only show if set */}
              {takeProfit.targetValue > 0 && (
                <div>
                  <Group position="apart" noWrap>
                    <Text size="xs" fw={500} style={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : theme.colors.gray[6] }}>Take Profit</Text>
                    <Text size="sm" fw={700} style={{ color: isDark ? theme.colors.green[3] : theme.colors.green[7] }}>
                      {formatDollarResponsive(takeProfit.targetValue, screenSize)}
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
      
      {/* Seasonality and Today Cards */}
      <Grid gutter="xs">
        <Grid.Col span={6}>
          {/* Seasonality Card */}
          <Paper 
            shadow="none"
            withBorder={false} 
            p="md" 
            className="seasonality-card bullish"
            style={{ 
              backgroundColor: cardBgColor, 
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              height: '200px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Group position="apart" mb="md">
              <Title order={4} style={{ color: textColor }}>Seasonality</Title>
              <Badge color="green" size="sm">
                <Group spacing={5}>
                  <IconAlertCircle size={14} />
                  <Text size="xs">BULLISH</Text>
                </Group>
              </Badge>
            </Group>
            
            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Text 
                size={screenSize === 'xs' ? "xs" : "sm"} 
                style={{ 
                  color: textColor,
                  lineClamp: 2,
                  overflow: 'hidden',
                  marginBottom: '12px'
                }}
              >
                Historical data indicates April tends to be a strong month for Bitcoin, with an average gain of 15.2% over the past 5 years.
              </Text>
              
              <Stack spacing={8}>
                <Text size="xs" color="dimmed" className="seasonality-stat" style={{ lineClamp: 1, overflow: 'hidden' }}>Monthly S&P Correlation: -0.2</Text>
                <Text size="xs" color="dimmed" className="seasonality-stat" style={{ lineClamp: 1, overflow: 'hidden' }}>Weekly Performance: +5.8%</Text>
                <Text size="xs" color="dimmed" className="seasonality-stat" style={{ lineClamp: 1, overflow: 'hidden' }}>Yearly Avg. Q2: +11.7%</Text>
              </Stack>
            </Box>
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={6}>
          {/* Today's Calendar Events Card */}
          <Paper 
            p="md" 
            shadow="none" 
            withBorder={false}
            className="seasonality-card"
            style={{ 
              backgroundColor: cardBgColor, 
              color: textColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              height: '200px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Group position="apart" mb="md">
              <Title order={4} style={{ color: textColor }}>Today</Title>
              <Badge color="green" size="sm">
                <Group spacing={5}>
                  <IconClock size={14} />
                  <Text size="xs">MARKET EVENTS</Text>
                </Group>
              </Badge>
            </Group>
            
            <ScrollArea style={{ flex: 1 }} type="never">
              <Stack spacing={4}>
                <Box className="calendar-event">
                  <Group position="apart" noWrap>
                    <Text 
                      size={screenSize === 'xs' ? "xs" : "sm"} 
                      fw={500} 
                      style={{ 
                        color: textColor,
                        lineClamp: 1,
                        overflow: 'hidden',
                        flex: 1
                      }}
                    >
                      FOMC Meeting Minutes
                    </Text>
                    <Badge color="yellow" size="sm">14:00 EST</Badge>
                  </Group>
                </Box>
                
                <Box className="calendar-event">
                  <Group position="apart" noWrap>
                    <Text 
                      size={screenSize === 'xs' ? "xs" : "sm"} 
                      fw={500} 
                      style={{ 
                        color: textColor,
                        lineClamp: 1,
                        overflow: 'hidden',
                        flex: 1
                      }}
                    >
                      US GDP Data Release
                    </Text>
                    <Badge color="green" size="sm">09:30 EST</Badge>
                  </Group>
                </Box>
                
                <Box className="calendar-event">
                  <Group position="apart" noWrap>
                    <Text 
                      size={screenSize === 'xs' ? "xs" : "sm"} 
                      fw={500} 
                      style={{ 
                        color: textColor,
                        lineClamp: 1,
                        overflow: 'hidden',
                        flex: 1
                      }}
                    >
                      ECB Interest Rate Decision
                    </Text>
                    <Badge color="red" size="sm">11:45 EST</Badge>
                  </Group>
                </Box>
              </Stack>
            </ScrollArea>
          </Paper>
        </Grid.Col>
      </Grid>
      
      <Group grow>
        <Paper 
          shadow="none"
          withBorder={false} 
          p="md" 
          className="portfolio-card" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '160px',
            height: '160px',
            backgroundColor: cardBgColor, 
            color: textColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px'
          }}
        >
          <Title 
            order={3} 
            size={screenSize === 'xs' ? "h5" : "h4"} 
            mb={8} 
            style={{ color: textColor }}
          >
            Performance
          </Title>
          <Group grow style={{ width: '100%', flexWrap: 'wrap', flex: 1, gap: screenSize === 'xs' ? 4 : 8 }}>
            <Box className="performance-metric" style={{ display: 'flex', flexDirection: 'column', gap: screenSize === 'xs' ? 2 : 4, minWidth: 0 }}>
              <Text 
                size="xs"
                className="performance-metric-header" 
                style={{ 
                  color: secondaryTextColor, 
                  lineClamp: 1, 
                  overflow: 'hidden'
                }}
              >
                24h
              </Text>
              <Text 
                size={screenSize === 'xs' ? 'xs' : 'sm'} 
                className="performance-metric-value" 
                c={getPerformanceColor(performance.daily)}
                fw={600}
                style={{ 
                  lineClamp: 1, 
                  overflow: 'hidden'
                }}
              >
                {formatPercentageResponsive(performance.daily, screenSize)}
              </Text>
              <Text 
                size="xs"
                className="performance-amount" 
                c={getPerformanceColor(performance.daily)}
                style={{ 
                  lineClamp: 1, 
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {formatDollarResponsive(totalValue * performance.daily / 100, screenSize)}
              </Text>
            </Box>
            <Box className="performance-metric" style={{ display: 'flex', flexDirection: 'column', gap: screenSize === 'xs' ? 2 : 4, minWidth: 0 }}>
              <Text 
                size="xs"
                className="performance-metric-header" 
                style={{ 
                  color: secondaryTextColor, 
                  lineClamp: 1, 
                  overflow: 'hidden'
                }}
              >
                7d
              </Text>
              <Text 
                size={screenSize === 'xs' ? 'xs' : 'sm'} 
                className="performance-metric-value" 
                c={getPerformanceColor(performance.weekly)}
                fw={600}
                style={{ 
                  lineClamp: 1, 
                  overflow: 'hidden'
                }}
              >
                {formatPercentageResponsive(performance.weekly, screenSize)}
              </Text>
              <Text 
                size="xs"
                className="performance-amount" 
                c={getPerformanceColor(performance.weekly)}
                style={{ 
                  lineClamp: 1, 
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {formatDollarResponsive(totalValue * performance.weekly / 100, screenSize)}
              </Text>
            </Box>
            <Box className="performance-metric" style={{ display: 'flex', flexDirection: 'column', gap: screenSize === 'xs' ? 2 : 4, minWidth: 0 }}>
              <Text 
                size="xs"
                className="performance-metric-header" 
                style={{ 
                  color: secondaryTextColor, 
                  lineClamp: 1, 
                  overflow: 'hidden'
                }}
              >
                30d
              </Text>
              <Text 
                size={screenSize === 'xs' ? 'xs' : 'sm'} 
                className="performance-metric-value" 
                c={getPerformanceColor(performance.monthly)}
                fw={600}
                style={{ 
                  lineClamp: 1, 
                  overflow: 'hidden'
                }}
              >
                {formatPercentageResponsive(performance.monthly, screenSize)}
              </Text>
              <Text 
                size="xs"
                className="performance-amount" 
                c={getPerformanceColor(performance.monthly)}
                style={{ 
                  lineClamp: 1, 
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {formatDollarResponsive(totalValue * performance.monthly / 100, screenSize)}
              </Text>
            </Box>
          </Group>
        </Paper>

        <Paper 
          shadow="none"
          withBorder={false} 
          p="md" 
          className="portfolio-card" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '160px',
            height: '160px',
            backgroundColor: cardBgColor, 
            color: textColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px'
          }}
        >
          <Title order={3} size="h4" mb={8} style={{ color: textColor }}>24h Movers</Title>
          <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
                    <Text 
                      className="mover-symbol" 
                      size={screenSize === 'xs' ? "xs" : "sm"} 
                      fw={500} 
                      style={{ 
                        color: textColor,
                        lineClamp: 1,
                        overflow: 'hidden'
                      }}
                    >
                      {best.symbol}
                    </Text>
                  </Group>
                  <Group spacing={2} style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <Text 
                      className="mover-percentage" 
                      size={screenSize === 'xs' ? "xs" : "sm"} 
                      fw={700} 
                      c="green" 
                      style={{ 
                        textAlign: 'right',
                        lineClamp: 1,
                        overflow: 'hidden'
                      }}
                    >
                      {formatPercentageResponsive(best.price_change_24h, screenSize)}
                    </Text>
                    <Text 
                      className="mover-amount" 
                      size="xs" 
                      c="green"
                      style={{ 
                        lineClamp: 1,
                        overflow: 'hidden'
                      }}
                    >
                      {formatDollarResponsive(Math.abs(best.dollarChange), screenSize)}
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
                    <Text 
                      className="mover-symbol" 
                      size={screenSize === 'xs' ? "xs" : "sm"} 
                      fw={500} 
                      style={{ 
                        color: textColor,
                        lineClamp: 1,
                        overflow: 'hidden'
                      }}
                    >
                      {worst.symbol}
                    </Text>
                  </Group>
                  <Group spacing={2} style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <Text 
                      className="mover-percentage" 
                      size={screenSize === 'xs' ? "xs" : "sm"} 
                      fw={700} 
                      c="red" 
                      style={{ 
                        textAlign: 'right',
                        lineClamp: 1,
                        overflow: 'hidden'
                      }}
                    >
                      {formatPercentageResponsive(worst.price_change_24h, screenSize)}
                    </Text>
                    <Text 
                      className="mover-amount" 
                      size="xs" 
                      c="red"
                      style={{ 
                        lineClamp: 1,
                        overflow: 'hidden'
                      }}
                    >
                      {formatDollarResponsive(Math.abs(worst.dollarChange), screenSize)}
                    </Text>
                  </Group>
                </Group>
              )}
            </Stack>
          </Box>
        </Paper>
      </Group>
      
      <Group grow spacing="xs">
        <AssetAllocation />
        <CapitalProtectionCard />
      </Group>
    </Stack>
  );
}

export default DashboardSummary; 