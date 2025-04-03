// frontend/src/components/AI/InsightsPanel.js
import React, { useState, useEffect } from 'react';
import { Paper, Title, Text, Stack, useMantineColorScheme, useMantineTheme, Loader, Group, Badge, Box, ScrollArea } from '@mantine/core';
import { IconExternalLink, IconAlertCircle } from '@tabler/icons-react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useMarket } from '../../contexts/MarketContext';
import { useConfig } from '../../contexts/ConfigContext';
import { fetchPortfolioNews, fetchMacroNews } from '../../api/newsService';
import RecommendationsPanel from './RecommedationsPanel';

function InsightsPanel({ showRiskCard = true }) {
  const { portfolio } = usePortfolio();
  const { topCoins } = useMarket();
  const { maxLossPercentage, takeProfit } = useConfig();
  
  // Initialize portfolio data with safe defaults
  const { 
    assets = [], 
    totalValue = 0, 
    totalCost = 0, 
    absoluteProfit = 0, 
    performance = { daily: 0, weekly: 0, monthly: 0 } 
  } = portfolio || {};

  // Ensure all numeric values are properly initialized
  const safePortfolioData = {
    totalValue: Number(totalValue) || 0,
    totalCost: Number(totalCost) || 0,
    absoluteProfit: Number(absoluteProfit) || 0,
    performance: {
      daily: Number(performance?.daily) || 0,
      weekly: Number(performance?.weekly) || 0,
      monthly: Number(performance?.monthly) || 0
    }
  };

  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? theme.white : theme.black;
  
  // State for AI recommendations
  const [portfolioNews, setPortfolioNews] = useState([]);
  const [economicNews, setEconomicNews] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Get theme-appropriate border color
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  // Load portfolio news and economic news
  useEffect(() => {
    const loadNews = async () => {
      if (!assets || assets.length === 0) return;
      
      setLoading(true);
      try {
        // Get news related to portfolio holdings
        const portfolioNewsResponse = await fetchPortfolioNews(5);
        if (portfolioNewsResponse && portfolioNewsResponse.news) {
          setPortfolioNews(portfolioNewsResponse.news);
        }
        
        // Get economic news most relevant to crypto traders
        const categories = ['federal-reserve', 'financial-markets'];
        const allEconomicNews = [];
        
        for (const category of categories) {
          const economicNewsResponse = await fetchMacroNews(category, 3);
          if (economicNewsResponse && economicNewsResponse.news) {
            allEconomicNews.push(...economicNewsResponse.news);
          }
        }
        
        setEconomicNews(allEconomicNews);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadNews();
  }, [assets]);

  // Calculate stop loss and delta values with safe number handling
  const baselineValue = Number(takeProfit?.entryValue) || safePortfolioData.totalValue;
  const stopLossPercentage = ((100 - (Number(maxLossPercentage) || 0)) / 100);
  const protectedValue = baselineValue * stopLossPercentage;
  const deltaValue = safePortfolioData.totalValue - protectedValue;
  const deltaPercentage = safePortfolioData.totalValue > 0 
    ? ((deltaValue / safePortfolioData.totalValue) * 100).toFixed(2) 
    : "0.00";

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

  // Find the best and worst performing tokens in the last 24h
  const findPerformanceExtremes = () => {
    if (!assets || assets.length === 0) return { best: null, worst: null };
    
    // Sort assets by 24h price change
    const sortedAssets = [...assets].sort((a, b) => b.price_change_24h - a.price_change_24h);
    
    // Get the best and worst performers
    const best = sortedAssets[0];
    const worst = sortedAssets[sortedAssets.length - 1];
    
    return { best, worst };
  };

  const riskiestAsset = findRiskiestAsset();
  const volatility = 65; // This would come from your risk calculation logic
  const { best, worst } = findPerformanceExtremes();

  const getRiskLevel = (vol) => {
    if (vol <= 30) return 'Low Risk';
    if (vol <= 70) return 'Moderate Risk';
    return 'High Risk';
  };

  // Format performance values
  const formatPerformance = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '+0.00%';
    const num = parseFloat(value);
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  // Helper function to format currency values
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '$0.00';
    }
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Create a safe format function for numbers
  const safeFormat = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00';
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper function to wrap numbers in blue spans
  const wrapNumberInBlue = (text) => {
    return text.replace(/(\$[\d,]+\.?\d*|[\d,]+\.?\d*%)/g, (match) => {
      return `<span style="color: ${isDark ? theme.colors.blue[3] : theme.colors.blue[6]}">${match}</span>`;
    });
  };

  // Generate a summary of portfolio risk factors
  const generateRiskSummary = () => {
    const riskFactors = [];
    
    // Check if portfolio has assets
    if (!assets || assets.length === 0) {
      return "Add assets to your portfolio to see risk analysis.";
    }
    
    // Check for high volatility assets
    const volatileAssets = assets.filter(asset => {
      const coin = topCoins.find(c => 
        c.id === asset.coinId || 
        c.symbol.toLowerCase() === asset.symbol.toLowerCase()
      );
      return coin && Math.abs(coin.price_change_percentage_24h) > 10;
    });
    
    if (volatileAssets.length > 0) {
      riskFactors.push(
        `${volatileAssets.length} assets with high 24h volatility (>10%)`
      );
    }
    
    // Check for assets with low market cap rank (high risk)
    const lowRankAssets = assets.filter(asset => {
      const coin = topCoins.find(c => 
        c.id === asset.coinId || 
        c.symbol.toLowerCase() === asset.symbol.toLowerCase()
      );
      return coin && coin.market_cap_rank > 100;
    });
    
    if (lowRankAssets.length > 0) {
      riskFactors.push(
        `${lowRankAssets.length} assets with market cap ranking >100`
      );
    }
    
    // Check for large positions (>20% of portfolio)
    const largePositions = assets.filter(asset => 
      (asset.value / safePortfolioData.totalValue) > 0.2
    );
    
    if (largePositions.length > 0) {
      riskFactors.push(
        `${largePositions.length} assets represent >20% of portfolio each`
      );
    }
    
    // Check for assets with recent negative price movement
    const negativeAssets = assets.filter(asset => {
      const coin = topCoins.find(c => 
        c.id === asset.coinId || 
        c.symbol.toLowerCase() === asset.symbol.toLowerCase()
      );
      return coin && coin.price_change_percentage_24h < -5;
    });
    
    if (negativeAssets.length > 0) {
      riskFactors.push(
        `${negativeAssets.length} assets with >5% price drop in last 24h`
      );
    }
    
    return riskFactors.length > 0 
      ? `Key risk factors: ${riskFactors.join('; ')}`
      : "No significant risk factors detected in your portfolio.";
  };

  // Generate profit/loss analysis text
  const getProfitLossAnalysis = () => {
    if (!safePortfolioData.totalValue || !safePortfolioData.totalCost) return 'Portfolio insights will be displayed once data is available.';
    
    // Ensure all values are numbers and have defaults
    const safeValue = safePortfolioData.totalValue;
    const safeCost = safePortfolioData.totalCost;
    const safeProfit = safePortfolioData.absoluteProfit;
    const safeDelta = deltaValue;
    const safeDeltaPercentage = Number(deltaPercentage) || 0;
    const safeVolatility = Number(volatility) || 0;
    const safeProtectedValue = Number(protectedValue) || 0;

    const roi = ((safeProfit / safeCost) * 100).toFixed(2);
    const roiText = safeProfit > 0 
      ? `a return on investment of +${roi}%` 
      : `a loss on investment of ${roi}%`;
    
    const distanceToStopLoss = `You're currently $${safeFormat(safeDelta)} (${safeDeltaPercentage.toFixed(2)}%) away from your stop loss trigger point.`;
    
    // Add take profit analysis
    let takeProfitText = '';
    if (takeProfit?.targetValue) {
      const distanceToTarget = Number(takeProfit.targetValue) - safeValue;
      const percentToTarget = ((distanceToTarget / safeValue) * 100).toFixed(2);
      
      if (distanceToTarget > 0) {
        takeProfitText = ` You need $${safeFormat(distanceToTarget)} (${percentToTarget}%) more to reach your take profit target of $${safeFormat(takeProfit.targetValue)}.`;
      } else {
        takeProfitText = ` You've exceeded your take profit target of $${safeFormat(takeProfit.targetValue)} by $${safeFormat(Math.abs(distanceToTarget))}!`;
      }
    }

    // Add risk monitor data
    let riskMonitorText = '';
    if (riskiestAsset) {
      const riskLevel = getRiskLevel(safeVolatility);
      
      // Calculate risk status based on profit/loss and stop loss proximity
      let riskStatus;
      const profitPercentage = ((safeValue - baselineValue) / baselineValue) * 100;
      const distanceToStopLossPercent = (safeDelta / safeValue) * 100;
      
      if (distanceToStopLossPercent < 2) {
        riskStatus = 'SEVERE CAPITAL RISK';
      } else if (profitPercentage < -2) {
        riskStatus = 'LOSS ZONE - WARNING';
      } else if (profitPercentage >= -2 && profitPercentage <= 2) {
        riskStatus = 'NEUTRAL ZONE';
      } else {
        riskStatus = 'PROFIT ZONE';
      }
      
      riskMonitorText = ` Your portfolio has a ${riskLevel} profile (${safeVolatility.toFixed(2)}%) with ${riskiestAsset.symbol} as the highest risk asset. Current risk status: ${riskStatus}.`;
      riskMonitorText += ` You have $${safeFormat(safeProtectedValue)} in protected capital, with $${safeFormat(safeDelta)} at risk (${safeDeltaPercentage.toFixed(2)}% max drawdown).`;
    }
    
    if (safeProfit > 0) {
      return `Your portfolio is in profit by $${safeFormat(safeProfit)}, with ${roiText}. ${distanceToStopLoss}${takeProfitText}${riskMonitorText}`;
    } else {
      return `Your portfolio is down by $${safeFormat(Math.abs(safeProfit))}, with ${roiText}. ${distanceToStopLoss}${takeProfitText}${riskMonitorText}`;
    }
  };

  // Get asset symbols for news relevance
  const getAssetSymbols = () => {
    if (!assets || assets.length === 0) return [];
    return assets.map(asset => asset.symbol.toUpperCase());
  };

  // Format date for news items
  const formatNewsDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Remove duplicate news items by title
  const getUniqueNews = (newsItems) => {
    const uniqueTitles = new Set();
    return newsItems.filter(item => {
      if (uniqueTitles.has(item.title)) {
        return false;
      }
      uniqueTitles.add(item.title);
      return true;
    });
  };

  // Prepare unique news sets
  const uniquePortfolioNews = getUniqueNews(portfolioNews);
  const uniqueEconomicNews = getUniqueNews(economicNews);

  return (
    <Paper 
      shadow="none"
      withBorder
      p="md"
      style={{
        backgroundColor: isDark ? theme.colors.dark[6] : theme.white,
        border: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[3]} !important`,
        borderRadius: theme.radius.md,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: `0 0 0 1px ${isDark ? theme.colors.dark[4] : theme.colors.gray[3]}`
      }}
    >
      <ScrollArea 
        style={{ flex: 1 }} 
        type="never"
        scrollbarSize={6}
      >
        <Stack spacing="md">
          {/* Performance Overview Card */}
          <Paper 
            shadow="none" 
            p="md" 
            withBorder={false}
            style={{
              backgroundColor: 'transparent'
            }}
          >
            <Title order={4} size="sm" mb={4}>Performance Overview</Title>
            <Text c="dimmed" size="xs" mb={4}>
              {safePortfolioData.totalValue > 0 ? (
                <span dangerouslySetInnerHTML={{ 
                  __html: wrapNumberInBlue(
                    `Your portfolio is valued at ${formatCurrency(safePortfolioData.totalValue)} with ${formatPerformance(safePortfolioData.performance.daily)} change (24h).${
                      best ? ` ${best.symbol} is your top performer at ${formatPerformance(best.price_change_24h)}.` : ''
                    }`
                  )
                }} />
              ) : (
                "Portfolio insights will be displayed here once data is available."
              )}
            </Text>
            {safePortfolioData.totalValue > 0 && (
              <Text c="dimmed" size="xs">
                <span dangerouslySetInnerHTML={{ 
                  __html: wrapNumberInBlue(getProfitLossAnalysis())
                }} />
              </Text>
            )}
          </Paper>

          {/* Risk Assessment Card */}
          {showRiskCard && (
            <Paper 
              shadow="none" 
              p="md" 
              withBorder={false}
              style={{
                backgroundColor: 'transparent'
              }}
            >
              <Title order={4} size="sm">Risk Assessment</Title>
              <Text c="dimmed" size="xs" mt={5}>
                {riskiestAsset ? (
                  <span dangerouslySetInnerHTML={{ 
                    __html: wrapNumberInBlue(`Your portfolio has a ${getRiskLevel(volatility)} profile (${volatility.toFixed(2)}%). ${riskiestAsset.symbol} is your highest risk asset with other factors described below.`)
                  }} />
                ) : (
                  "Risk metrics and analysis will be shown here."
                )}
              </Text>
              
              {safePortfolioData.totalValue > 0 && (
                <Text c="dimmed" size="xs" mt={10}>
                  <span dangerouslySetInnerHTML={{ 
                    __html: wrapNumberInBlue(generateRiskSummary())
                  }} />
                </Text>
              )}
            </Paper>
          )}

          {/* Recommendations Card */}
          <Paper 
            shadow="none" 
            p="md" 
            withBorder={false}
            style={{
              backgroundColor: 'transparent'
            }}
          >
            <RecommendationsPanel />
          </Paper>
        </Stack>
      </ScrollArea>
    </Paper>
  );
}

export default InsightsPanel;