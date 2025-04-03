// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Grid, Box, Paper, Title, useMantineColorScheme, useMantineTheme, Stack } from '@mantine/core';
import DashboardSummary from '../components/Portfolio/DashboardSummary';
import DashboardPerformanceChart from '../components/Portfolio/DashboardPerformanceChart';
import ChatInterface from '../components/AI/ChatInterface';
import InsightsPanel from '../components/AI/InsightsPanel';
import NewsFeed from '../components/News/NewsFeed';
import { usePortfolio } from '../contexts/PortfolioContext';
import { fetchCryptoNews, fetchMacroNews } from '../api/newsService';
import RiskNewsPanel from '../components/risk/RiskNewsPanel';

function Dashboard() {
  const { portfolio } = usePortfolio();
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // State for risk-related news
  const [riskNews, setRiskNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  
  // Get theme-appropriate colors
  const cardBgColor = isDark ? theme.colors.dark[6] : 'white';
  const textColor = isDark ? theme.white : theme.black;
  
  // Load risk-related news
  useEffect(() => {
    const fetchRiskRelatedNews = async () => {
      setLoadingNews(true);
      try {
        // Get Bitcoin news
        const bitcoinResponse = await fetchCryptoNews({ query: "bitcoin", limit: 15 });
        let bitcoinNews = [];
        if (bitcoinResponse && bitcoinResponse.data) {
          bitcoinNews = bitcoinResponse.data
            .filter(item => isRiskRelated(item.title, item.summary))
            .map(item => ({ ...item, sentiment: getSentiment(item.title, item.summary) }));
        }
        
        // Get news for other cryptocurrencies (excluding Bitcoin)
        const otherCryptoResponse = await fetchCryptoNews({ query: "crypto", limit: 15 });
        let otherCryptoNews = [];
        if (otherCryptoResponse && otherCryptoResponse.data) {
          otherCryptoNews = otherCryptoResponse.data
            .filter(item => 
              isRiskRelated(item.title, item.summary) && 
              !item.title.toLowerCase().includes("bitcoin") &&
              !item.summary.toLowerCase().includes("bitcoin")
            )
            .map(item => ({ ...item, sentiment: getSentiment(item.title, item.summary) }));
        }
        
        // Get economic news from all categories
        const allCategories = [
          'business', 
          'technology', 
          'federal-reserve', 
          'financial-markets', 
          'us-news', 
          'global'
        ];
        
        // Array to hold one negative news item from each category
        const categoryNews = [];
        
        // Fetch and process news from each category
        for (const category of allCategories) {
          const categoryResponse = await fetchMacroNews({ category, limit: 10 });
          if (categoryResponse && categoryResponse.data && categoryResponse.data.length > 0) {
            // Filter for risk-related news with negative sentiment
            const riskNews = categoryResponse.data
              .filter(item => isRiskRelated(item.title, item.summary))
              .map(item => ({ 
                ...item, 
                sentiment: getSentiment(item.title, item.summary),
                category: category 
              }))
              .filter(item => item.sentiment === 'negative');
            
            // Add the most relevant negative news item from this category
            if (riskNews.length > 0) {
              // Sort by relevance score and take the first item
              const mostRelevant = riskNews.sort((a, b) => 
                getRiskRelevanceScore(b.title, b.summary) - getRiskRelevanceScore(a.title, a.summary)
              )[0];
              
              categoryNews.push(mostRelevant);
            }
          }
        }
        
        // Get top Bitcoin news and top other crypto news
        const topNews = [];
        if (bitcoinNews.length > 0) {
          topNews.push(bitcoinNews[0]);
        }
        if (otherCryptoNews.length > 0) {
          topNews.push(otherCryptoNews[0]);
        }
        
        // Add the category news items
        categoryNews.forEach(item => {
          if (!topNews.some(existing => existing.url === item.url)) {
            topNews.push(item);
          }
        });
        
        // Make sure we only have max 5 items
        setRiskNews(topNews.slice(0, 5));
      } catch (error) {
        console.error("Error fetching risk news:", error);
        setRiskNews([]);
      } finally {
        setLoadingNews(false);
      }
    };
    
    fetchRiskRelatedNews();
  }, [portfolio.assets]);

  // Debug log portfolio data
  useEffect(() => {
    console.log("Portfolio data:", {
      hasData: portfolio && portfolio.totalValue > 0 && portfolio.entryValue > 0,
      totalValue: portfolio?.totalValue,
      entryValue: portfolio?.entryValue,
      assets: portfolio?.assets?.length
    });
  }, [portfolio]);
  
  // Format date for news items
  const formatNewsDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Function to determine if news item is risk-related
  const isRiskRelated = (title, summary) => {
    if (!title && !summary) return false;
    
    const riskKeywords = [
      'risk', 'crash', 'drop', 'fall', 'decline', 'bearish', 'warning', 'danger',
      'recession', 'inflation', 'volatility', 'regulations', 'ban', 'hack', 'security',
      'vulnerability', 'exploit', 'scam', 'fraud', 'investigation', 'lawsuit'
    ];
    
    const titleLower = title ? title.toLowerCase() : '';
    const summaryLower = summary ? summary.toLowerCase() : '';
    
    return riskKeywords.some(keyword => 
      titleLower.includes(keyword) || summaryLower.includes(keyword)
    );
  };
  
  // Function to determine news sentiment
  const getSentiment = (title, summary) => {
    if (!title && !summary) return 'neutral';
    
    const positivePhrases = [
      'gain', 'rise', 'bullish', 'growth', 'profit', 'positive',
      'surge', 'rally', 'recover', 'strength', 'success'
    ];
    
    const negativePhrases = [
      'loss', 'drop', 'crash', 'fall', 'risk', 'bearish', 'decline',
      'danger', 'warning', 'negative', 'threat', 'ban', 'hack'
    ];
    
    const titleLower = title ? title.toLowerCase() : '';
    const summaryLower = summary ? summary.toLowerCase() : '';
    const fullText = titleLower + ' ' + summaryLower;
    
    // Count occurrences of positive and negative phrases
    let positiveScore = 0;
    let negativeScore = 0;
    
    positivePhrases.forEach(phrase => {
      if (fullText.includes(phrase)) positiveScore++;
    });
    
    negativePhrases.forEach(phrase => {
      if (fullText.includes(phrase)) negativeScore++;
    });
    
    // Determine sentiment based on the scores
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  };
  
  // Function to calculate risk relevance score
  const getRiskRelevanceScore = (title, summary) => {
    if (!title && !summary) return 0;
    
    const highSeverityKeywords = [
      'crash', 'collapse', 'emergency', 'crisis', 'disaster',
      'hack', 'security breach', 'exploit', 'vulnerability'
    ];
    
    const mediumSeverityKeywords = [
      'warning', 'alert', 'risk', 'falling', 'bearish',
      'uncertainty', 'volatility', 'pressure'
    ];
    
    const lowSeverityKeywords = [
      'cautious', 'decline', 'concern', 'worry', 'attention'
    ];
    
    const titleLower = title ? title.toLowerCase() : '';
    const summaryLower = summary ? summary.toLowerCase() : '';
    const fullText = titleLower + ' ' + summaryLower;
    
    // Calculate score based on keyword severity
    let score = 0;
    
    highSeverityKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) score += 3;
    });
    
    mediumSeverityKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) score += 2;
    });
    
    lowSeverityKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) score += 1;
    });
    
    return score;
  };
  
  // Main component render
  return (
    <Box p="md">
      {/* First row with Total Value, AI Assistant, Performance Chart, and Insights */}
      <Grid gutter="md" mb="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <DashboardSummary />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 5 }} order={{ base: 3, md: 2 }}>
          {/* AI Assistant */}
          <Stack spacing="md" h={735}>
            <Paper 
              p="md" 
              shadow="none" 
              withBorder={false} 
              sx={{ 
                backgroundColor: cardBgColor, 
                height: 590,
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '8px'
              }}
            >
              <Title order={4} mb="md" style={{ color: textColor }}>Portfolio Assistant</Title>
              <ChatInterface height={550} />
            </Paper>
            
            {/* RiskNewsPanel below the Chat Interface */}
            <Paper
              p={0}
              shadow="none"
              withBorder={false}
              sx={{
                height: 125,
                flex: '0 0 125px'
              }}
            >
              <RiskNewsPanel 
                riskNews={riskNews}
                loadingNews={loadingNews}
                formatNewsDate={formatNewsDate}
              />
            </Paper>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 3 }} order={{ base: 2, md: 3 }} style={{ height: '982px' }}>
          {/* Performance Chart and Insights Panel */}
          <Stack spacing="xs" style={{ height: '100%' }}>
            <Box style={{ height: '250px', flexShrink: 0 }}>
              <DashboardPerformanceChart />
            </Box>
            
            <Box 
              style={{ 
                flex: '1 1 auto', 
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px',
                  background: 'transparent'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(150, 150, 150, 0.5)',
                  borderRadius: '3px'
                }
              }}
            >
              <InsightsPanel showRiskCard={true} />
            </Box>
          </Stack>
        </Grid.Col>
      </Grid>
      
      {/* Additional news feed at the bottom */}
      <Box mt="md">
        <NewsFeed />
      </Box>
    </Box>
  );
}

export default Dashboard;