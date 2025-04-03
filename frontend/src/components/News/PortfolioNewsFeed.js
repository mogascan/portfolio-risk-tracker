import React, { useState, useEffect, useCallback } from 'react';
import { Box, Title, Tabs, ScrollArea, Loader, Center, Text, Alert, Button, Group, Stack, useMantineTheme } from '@mantine/core';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { 
  fetchCryptoNews, 
  fetchPortfolioNews, 
  fetchBitcoinNews, 
  fetchMacroNews, 
  fetchRwaNews, 
  fetchMessariNews,
  updatePortfolioHoldings 
} from '../../api/newsService';
import NewsCard from './NewsCard';
import redditApiService from '../../services/redditApiService';

// Constants
const TABS = [
  { value: 'all', label: 'All News' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'macro', label: 'Economic' },
  { value: 'reddit', label: 'Reddit' }
];

// Economic news categories
const MACRO_CATEGORIES = [
  'business', 
  'technology', 
  'federal-reserve', 
  'financial-markets',
  'us-news',
  'global'
];

// Reddit subreddits to fetch from
const REDDIT_SUBREDDITS = [
  'cryptocurrency',
  'bitcoin',
  'ethereum',
  'CryptoMarkets'
];

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

function PortfolioNewsFeed() {
  const { portfolio } = usePortfolio();
  const theme = useMantineTheme();
  
  // State
  const [activeTab, setActiveTab] = useState('all');
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Extract portfolio holdings information
  const portfolioCoins = portfolio?.assets?.map(asset => ({
    id: asset.coinId,
    symbol: asset.symbol,
    name: asset.name
  })) || [];
  
  // Create robust keywords from portfolio asset information
  const generateKeywords = useCallback(() => {
    if (!portfolioCoins.length) return [];
    
    const keywords = [];
    
    portfolioCoins.forEach(coin => {
      // Primary keywords - full asset names (most important)
      if (coin.name) {
        keywords.push(coin.name.toLowerCase());
        
        // Also add name without spaces if it has multiple words
        if (coin.name.includes(' ')) {
          keywords.push(coin.name.toLowerCase().replace(/\s+/g, ''));
        }
      }
      
      // Secondary keywords - asset symbols
      if (coin.symbol) {
        keywords.push(coin.symbol.toLowerCase());
      }
      
      // Tertiary keywords - asset IDs if different from name
      if (coin.id && coin.id.toLowerCase() !== coin.name.toLowerCase()) {
        keywords.push(coin.id.toLowerCase());
      }
      
      // Special case for coins with "chain" in their name
      if (coin.name && coin.name.toLowerCase().includes('chain')) {
        // Add version without "chain" as a keyword
        keywords.push(coin.name.toLowerCase().replace(/\s*chain\s*/i, ''));
      }
    });
    
    // Remove duplicates
    return [...new Set(keywords)];
  }, [portfolioCoins]);
  
  // Dynamic keywords generated from portfolio
  const portfolioKeywords = generateKeywords();
  
  // Log current portfolio keywords for debugging
  console.log('Current portfolio keywords for news filtering:', portfolioKeywords);
  
  // Filter news items to only include those relevant to portfolio
  const filterNewsByPortfolio = useCallback((items) => {
    if (!portfolioKeywords.length) return items;
    
    console.log('Filtering news with keywords:', portfolioKeywords);
    
    return items.filter(item => {
      // Check for null/undefined items
      if (!item) return false;
      
      // Extract all text fields that might contain relevant content
      const title = item.title?.toLowerCase() || '';
      const summary = item.summary?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      const content = (item.content || item.selftext || item.text || '')?.toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
      const categories = Array.isArray(item.categories) ? item.categories.join(' ').toLowerCase() : '';
      
      // For debugging particularly "Sonic" articles
      if (title.includes('sonic') || summary.includes('sonic') || 
          content.includes('sonic') || description.includes('sonic')) {
        console.log('Found article with "sonic":', { title, url: item.url });
      }
      
      // Check if any portfolio keyword is mentioned in any text field
      const hasMatch = portfolioKeywords.some(keyword => 
        title.includes(keyword) || 
        summary.includes(keyword) || 
        description.includes(keyword) ||
        content.includes(keyword) ||
        tags.includes(keyword) ||
        categories.includes(keyword)
      );
      
      return hasMatch;
    });
  }, [portfolioKeywords]);
  
  // Update backend with portfolio keywords (sending names instead of symbols)
  const portfolioNamesForBackend = portfolioCoins.map(coin => coin.name?.toLowerCase()).filter(Boolean);
  
  // Fetch news data based on active tab
  const fetchNews = useCallback(async () => {
    if (!portfolioCoins.length) {
      setError('Add assets to your portfolio to see relevant news');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Update backend with portfolio holdings for news filtering
      await updatePortfolioHoldings(portfolioNamesForBackend);
      
      // Initialize news items array
      let items = [];
      
      // STEP 1: Fetch all crypto-related news sources regardless of tab
      if (activeTab === 'all' || activeTab === 'crypto') {
        console.log('Fetching crypto news for portfolio filtering...');
        
        // 1.1 General crypto news
        const cryptoResponse = await fetchCryptoNews(15);
        if (cryptoResponse.news && Array.isArray(cryptoResponse.news)) {
          const filteredCryptoNews = filterNewsByPortfolio(cryptoResponse.news);
          items = [...items, ...filteredCryptoNews.map(item => ({
            ...item,
            source_type: 'crypto'
          }))];
        }
        
        // 1.2 Portfolio-specific news
        const portfolioResponse = await fetchPortfolioNews(15);
        if (portfolioResponse.news && Array.isArray(portfolioResponse.news)) {
          items = [...items, ...portfolioResponse.news.map(item => ({
            ...item,
            source_type: 'portfolio'
          }))];
        }
        
        // 1.3 Bitcoin news (may contain portfolio coins mentions)
        const bitcoinResponse = await fetchBitcoinNews(15);
        if (bitcoinResponse.news && Array.isArray(bitcoinResponse.news)) {
          const filteredBitcoinNews = filterNewsByPortfolio(bitcoinResponse.news);
          items = [...items, ...filteredBitcoinNews.map(item => ({
            ...item,
            source_type: 'bitcoin'
          }))];
        }
        
        // 1.4 RWA news
        const rwaResponse = await fetchRwaNews(15);
        if (rwaResponse.news && Array.isArray(rwaResponse.news)) {
          const filteredRwaNews = filterNewsByPortfolio(rwaResponse.news);
          items = [...items, ...filteredRwaNews.map(item => ({
            ...item,
            source_type: 'rwa'
          }))];
        }
        
        // 1.5 Messari research
        const messariResponse = await fetchMessariNews(15);
        if (messariResponse.news && Array.isArray(messariResponse.news)) {
          console.log('Raw Messari news items:', messariResponse.news);
          
          // Debug: Check for articles containing "sonic" before filtering
          const sonicArticles = messariResponse.news.filter(item => {
            const title = item.title?.toLowerCase() || '';
            const summary = item.summary?.toLowerCase() || '';
            const content = (item.content || item.selftext || '')?.toLowerCase();
            return title.includes('sonic') || summary.includes('sonic') || content.includes('sonic');
          });
          
          console.log('Messari articles containing "sonic" before filtering:', sonicArticles);
          
          const filteredMessariNews = filterNewsByPortfolio(messariResponse.news);
          
          console.log('Filtered Messari news items:', filteredMessariNews);
          
          items = [...items, ...filteredMessariNews.map(item => ({
            ...item,
            source_type: 'messari'
          }))];
        }
      }
      
      // STEP 2: Fetch economic/macro news sources
      if (activeTab === 'all' || activeTab === 'macro') {
        console.log('Fetching macro/economic news for portfolio filtering...');
        
        // Fetch from all economic categories
        for (const category of MACRO_CATEGORIES) {
          const macroResponse = await fetchMacroNews(category, 10);
          if (macroResponse.news && Array.isArray(macroResponse.news)) {
            const filteredMacroNews = filterNewsByPortfolio(macroResponse.news);
            items = [...items, ...filteredMacroNews.map(item => ({
              ...item,
              source_type: `macro-${category}`
            }))];
          }
        }
      }
      
      // STEP 3: Fetch Reddit posts
      if (activeTab === 'all' || activeTab === 'reddit') {
        console.log('Fetching Reddit posts for portfolio filtering...');
        
        // Fetch from all crypto subreddits and filter by portfolio
        for (const subreddit of REDDIT_SUBREDDITS) {
          try {
            const redditPosts = await redditApiService.getSubredditPosts(subreddit, 15);
            const filteredRedditPosts = filterNewsByPortfolio(redditPosts);
            
            items = [...items, ...filteredRedditPosts.map(post => ({
              ...post,
              source_type: 'reddit',
              subreddit
            }))];
          } catch (redditError) {
            console.error(`Error fetching Reddit posts from r/${subreddit}:`, redditError);
            // Continue with other subreddits even if one fails
          }
        }
      }
      
      // STEP 4: Sort all items by date, most recent first
      const sortedItems = items.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB - dateA;
      });
      
      console.log(`Found ${sortedItems.length} news items matching portfolio keywords`);
      
      // STEP 5: Update state with the combined results
      setNewsItems(sortedItems);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching portfolio news:', error);
      setError('Failed to load portfolio news. Please try again later.');
      setLoading(false);
    }
  }, [activeTab, portfolioCoins, portfolioNamesForBackend, filterNewsByPortfolio]);
  
  // Fetch news on component mount and when tab changes
  useEffect(() => {
    fetchNews();
    
    // Set up automatic refresh interval
    const intervalId = setInterval(fetchNews, REFRESH_INTERVAL);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchNews, activeTab]);
  
  // Handle manual refresh
  const handleRefresh = () => {
    fetchNews();
  };
  
  return (
    <Box>
      <Group position="apart" mb="md">
        <Title order={4}>Portfolio News</Title>
        
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
        </Group>
      </Group>
      
      <Tabs
        value={activeTab}
        onTabChange={setActiveTab}
        mb="md"
      >
        <Tabs.List>
          {TABS.map((tab) => (
            <Tabs.Tab key={tab.value} value={tab.value}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      
      <ScrollArea style={{ height: 'calc(100vh - 200px)' }} offsetScrollbars>
        {loading ? (
          <Center style={{ height: 200 }}>
            <Loader size="md" />
          </Center>
        ) : error ? (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="md">
            {error}
          </Alert>
        ) : newsItems.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} title="No News Found" color="blue" mb="md">
            No relevant news found for your portfolio holdings. Try adding more assets or check back later.
          </Alert>
        ) : (
          <Stack spacing="md">
            {newsItems.map((item, index) => (
              <NewsCard 
                key={`${item.id || item.title}-${index}`} 
                item={item}
                portfolioCoins={portfolioKeywords}
                showPortfolioIndicator
              />
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Box>
  );
}

export default PortfolioNewsFeed; 