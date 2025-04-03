import React, { useState, useEffect } from 'react';
import { Box, Title, Tabs, ScrollArea, Loader, Center, Text, Alert, Button, Group, Stack, Code } from '@mantine/core';
import { IconRefresh, IconAlertCircle, IconBug } from '@tabler/icons-react';
import NewsCard from './NewsCard';
import { fetchMacroNews } from '../../api/newsService';

// Debug configuration
const DEBUG_CONFIG = {
  baseUrl: 'http://localhost:8000/api',
  endpoints: {
    macro: '/macro/news'
  }
};

// RSS feed sources for each category
const RSS_SOURCES = {
  business: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB',
  technology: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB',
  'federal-reserve': 'https://news.google.com/rss/search?q=federal+reserve',
  'financial-markets': 'https://news.google.com/rss/search?q=financial+markets',
  'us-news': 'https://news.google.com/rss/headlines/section/geo/US',
  global: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB'
};

// Fixed time filter - 48 hours
// const HOURS_FILTER = 48;
// Temporarily using a longer period to show more content during development
const HOURS_FILTER = 720; // 30 days

// Mock data for economic news
const mockMacroNews = {
  business: [
    {
      id: 'business-1',
      title: 'Fed Signals Potential Rate Cuts in Coming Months',
      summary: 'Federal Reserve officials indicated they expect to begin lowering interest rates later this year if inflation continues to cool.',
      source: 'Wall Street Journal',
      timestamp: new Date().toISOString(),
      sentiment: 'NEUTRAL'
    },
    {
      id: 'business-2',
      title: 'Global Markets Rally on Strong Economic Data',
      summary: 'Stock markets worldwide surge as economic indicators show resilient growth and moderating inflation pressures.',
      source: 'Financial Times',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      sentiment: 'POSITIVE'
    }
  ],
  technology: [
    {
      id: 'tech-1',
      title: 'AI Chip Demand Drives Semiconductor Boom',
      summary: 'Semiconductor manufacturers report record orders as artificial intelligence applications fuel unprecedented demand.',
      source: 'Bloomberg',
      timestamp: new Date().toISOString(),
      sentiment: 'POSITIVE'
    },
    {
      id: 'tech-2',
      title: 'Tech Giants Face New Regulatory Challenges',
      summary: 'Major technology companies navigate evolving regulatory landscape as governments worldwide propose new oversight measures.',
      source: 'Reuters',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      sentiment: 'NEUTRAL'
    }
  ],
  'federal-reserve': [
    {
      id: 'fed-1',
      title: 'Fed Minutes Reveal Inflation Concerns',
      summary: 'Latest Federal Reserve meeting minutes show officials remain focused on bringing inflation back to target levels.',
      source: 'CNBC',
      timestamp: new Date().toISOString(),
      sentiment: 'NEUTRAL'
    },
    {
      id: 'fed-2',
      title: 'Treasury Yields React to Fed Policy Outlook',
      summary: 'Bond markets adjust to Federal Reserve\'s latest economic projections and policy guidance.',
      source: 'Bloomberg',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      sentiment: 'NEUTRAL'
    }
  ],
  'financial-markets': [
    {
      id: 'markets-1',
      title: 'Market Volatility Rises on Economic Data',
      summary: 'Trading volumes surge as investors digest latest economic indicators and central bank communications.',
      source: 'Reuters',
      timestamp: new Date().toISOString(),
      sentiment: 'NEUTRAL'
    },
    {
      id: 'markets-2',
      title: 'Corporate Earnings Beat Expectations',
      summary: 'Major companies report stronger-than-expected quarterly results, boosting market sentiment.',
      source: 'Wall Street Journal',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      sentiment: 'POSITIVE'
    }
  ],
  'us-news': [
    {
      id: 'us-1',
      title: 'US Economy Shows Resilience',
      summary: 'Latest economic data indicates continued strength in employment and consumer spending.',
      source: 'Bloomberg',
      timestamp: new Date().toISOString(),
      sentiment: 'POSITIVE'
    },
    {
      id: 'us-2',
      title: 'Infrastructure Projects Gain Momentum',
      summary: 'Federal and state governments accelerate infrastructure spending, boosting economic activity.',
      source: 'CNBC',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      sentiment: 'POSITIVE'
    }
  ],
  global: [
    {
      id: 'global-1',
      title: 'Global Trade Flows Recover',
      summary: 'International trade volumes show signs of improvement as supply chain pressures ease.',
      source: 'Financial Times',
      timestamp: new Date().toISOString(),
      sentiment: 'POSITIVE'
    },
    {
      id: 'global-2',
      title: 'Central Banks Coordinate Policy Response',
      summary: 'Major central banks align monetary policy approaches to address global economic challenges.',
      source: 'Reuters',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      sentiment: 'NEUTRAL'
    }
  ]
};

function MacroNewsFeed() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('business');
  const [news, setNews] = useState([]);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [debugMode, setDebugMode] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    
    try {
      console.log('[MacroNewsFeed] Fetching macro news for category:', activeTab);
      
      const response = await fetchMacroNews({ category: activeTab, limit: 10 });
      console.log(`[MacroNewsFeed] Response for ${activeTab}:`, response);
      
      let newsData = [];
      
      // Check if we have valid response data
      if (response && response.success && response.data) {
        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log(`[MacroNewsFeed] Setting ${response.data.length} news items for ${activeTab} tab`);
          newsData = response.data;
        } else if (typeof response.data === 'object' && Object.keys(response.data).length > 0) {
          // Handle response where data is an object with arrays (e.g., from latest endpoint)
          console.log(`[MacroNewsFeed] Response contains object data structure, extracting relevant news`);
          // Use appropriate category data if available
          newsData = Array.isArray(response.data[activeTab]) ? response.data[activeTab] : [];
        }
      }
      
      // If no data is available, fall back to mock data
      if (newsData.length === 0) {
        console.warn(`[MacroNewsFeed] No data received from API for ${activeTab}, using mock data`);
        newsData = mockMacroNews[activeTab] || [];
      }

      // Normalize the news data
      const normalizedNews = newsData.map(item => ({
        id: item.id || `macro-${activeTab}-${Date.now()}-${Math.random()}`,
        title: item.title || 'No Title Available',
        summary: item.summary || item.description || 'No summary available',
        source: item.source || 'Unknown Source',
        timestamp: item.timestamp || item.publishedAt || new Date().toISOString(),
        sentiment: item.sentiment || 'NEUTRAL',
        url: item.url || null
      }));

      console.log(`[MacroNewsFeed] Normalized ${normalizedNews.length} news items:`, normalizedNews);
      setNews(normalizedNews);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('[MacroNewsFeed] Error fetching news:', err);
      console.log('[MacroNewsFeed] Falling back to mock data for', activeTab);
      
      // Use mock data as fallback
      const fallbackNews = mockMacroNews[activeTab] || [];
      setNews(fallbackNews);
      setErrorDetail(err.message);
      setLastUpdated(new Date());
      setLoading(false);
    }
  };

  // Fetch news when tab changes
  useEffect(() => {
    console.log('[MacroNewsFeed] Tab changed to:', activeTab);
    fetchNews();
  }, [activeTab]);

  const handleRefresh = () => {
    fetchNews();
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  const renderNewsContent = () => {
    if (error) {
      return (
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mt="md" mb="md">
          <Stack spacing="xs">
            <Text>{error}</Text>
            {debugMode && errorDetail && (
              <Code block size="xs">{errorDetail}</Code>
            )}
            {debugMode && (
              <Text size="xs">
                API URL: {DEBUG_CONFIG.baseUrl} <br />
                Endpoint: {`${DEBUG_CONFIG.endpoints.macro}/${activeTab}`} <br />
                RSS Source: {RSS_SOURCES[activeTab]} <br />
                Time Filter: {HOURS_FILTER} hours
              </Text>
            )}
          </Stack>
        </Alert>
      );
    }

    return (
      <ScrollArea h={1000} mt="md">
        {loading ? (
          <Center h={300}>
            <Loader size="sm" />
          </Center>
        ) : news.length > 0 ? (
          news.map(item => {
            // Ensure all required fields are present with fallbacks
            const normalizedItem = {
              id: item.id || `macro-${activeTab}-${Date.now()}-${Math.random()}`,
              title: item.title || 'No Title Available',
              summary: item.summary || item.description || 'No summary available',
              source: item.source || 'Unknown Source',
              timestamp: item.timestamp || item.publishedAt || new Date().toISOString(),
              sentiment: item.sentiment || 'NEUTRAL',
              url: item.url || null
            };

            return (
              <NewsCard 
                key={normalizedItem.id} 
                item={normalizedItem}
              />
            );
          })
        ) : (
          <Center h={300}>
            <Text c="dimmed">No news found in the last {HOURS_FILTER} hours</Text>
          </Center>
        )}
      </ScrollArea>
    );
  };

  return (
    <Box>
      <Group position="apart" mb="md">
        <Title order={4}>Economic News</Title>
        
        <Group spacing="xs">
          {lastUpdated && (
            <Text size="xs" color="dimmed">
              Updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
          <Button 
            variant="subtle" 
            size="xs" 
            compact 
            onClick={handleRefresh}
            leftIcon={<IconRefresh size={14} />}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="subtle"
            size="xs"
            compact
            color={debugMode ? "orange" : "gray"}
            onClick={toggleDebugMode}
            leftIcon={<IconBug size={14} />}
          >
            Debug
          </Button>
        </Group>
      </Group>
      
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="business">Business</Tabs.Tab>
          <Tabs.Tab value="technology">Technology</Tabs.Tab>
          <Tabs.Tab value="federal-reserve">Federal Reserve</Tabs.Tab>
          <Tabs.Tab value="financial-markets">Financial Markets</Tabs.Tab>
          <Tabs.Tab value="us-news">US News</Tabs.Tab>
          <Tabs.Tab value="global">Global</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="business">
          {renderNewsContent()}
        </Tabs.Panel>

        <Tabs.Panel value="technology">
          {renderNewsContent()}
        </Tabs.Panel>

        <Tabs.Panel value="federal-reserve">
          {renderNewsContent()}
        </Tabs.Panel>

        <Tabs.Panel value="financial-markets">
          {renderNewsContent()}
        </Tabs.Panel>

        <Tabs.Panel value="us-news">
          {renderNewsContent()}
        </Tabs.Panel>

        <Tabs.Panel value="global">
          {renderNewsContent()}
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}

export default MacroNewsFeed; 