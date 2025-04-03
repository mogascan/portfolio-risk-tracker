import React, { useState, useEffect } from 'react';
import { Box, Title, Tabs, ScrollArea, Loader, Center, Text, Alert, Button, Group, Stack, Switch } from '@mantine/core';
import { IconRefresh, IconAlertCircle, IconFilter } from '@tabler/icons-react';
import NewsCard from './NewsCard';
import RedditPost from './RedditPost';
import { fetchCryptoNews, fetchPortfolioNews, fetchMacroNews, refreshAllFeeds, updatePortfolioHoldings } from '../../api/newsService';
import redditApiService from '../../services/redditApiService';
import { usePortfolio } from '../../contexts/PortfolioContext';

function PortfolioNewsFeed() {
  const { portfolio } = usePortfolio();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [combinedNews, setCombinedNews] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [useAdvancedFiltering, setUseAdvancedFiltering] = useState(true);
  
  // Prepare keywords from portfolio assets
  const getAssetKeywords = () => {
    if (!portfolio.assets || portfolio.assets.length === 0) {
      return [];
    }
    
    // Create keywords array from asset names and symbols
    const keywords = portfolio.assets.flatMap(asset => {
      const keywords = [];
      
      // Add symbol as keyword (both uppercase and lowercase)
      if (asset.symbol) {
        keywords.push(asset.symbol.toLowerCase());
        keywords.push(asset.symbol.toUpperCase());
      }
      
      // Add name as keyword
      if (asset.name) {
        keywords.push(asset.name.toLowerCase());
        // Also add without spaces for better matching
        if (asset.name.includes(' ')) {
          keywords.push(asset.name.toLowerCase().replace(/\s+/g, ''));
        }
      }
      
      // Add coinId as keyword
      if (asset.coinId) {
        keywords.push(asset.coinId.toLowerCase());
      }
      
      return keywords;
    });
    
    // Add general crypto terms
    keywords.push('crypto', 'cryptocurrency', 'blockchain', 'token', 'defi');
    
    // Remove duplicates
    return [...new Set(keywords)];
  };
  
  // Filter news by keywords
  const filterNewsByKeywords = (newsItems, keywords) => {
    if (!useAdvancedFiltering) return newsItems;
    if (!keywords || keywords.length === 0) return newsItems;
    
    return newsItems.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const summary = item.summary?.toLowerCase() || '';
      const content = item.selftext?.toLowerCase() || ''; // For Reddit posts
      
      // Check if any keyword matches in title, summary or content
      return keywords.some(keyword => 
        title.includes(keyword) || summary.includes(keyword) || content.includes(keyword)
      );
    });
  };
  
  // Fetch and combine news from all sources
  const fetchAllNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Update portfolio holdings on the backend
      const assetSymbols = portfolio.assets.map(asset => asset.symbol.toUpperCase());
      await updatePortfolioHoldings(assetSymbols);
      
      // Fetch news from multiple sources
      const [cryptoNews, portfolioNews, macroNews, redditPosts] = await Promise.all([
        fetchCryptoNews(20),
        fetchPortfolioNews(20),
        fetchMacroNews('finance', 20),
        fetchRedditPosts()
      ]);
      
      // Handle potential errors
      if (cryptoNews.error || portfolioNews.error || macroNews.error) {
        const errorMessage = cryptoNews.error || portfolioNews.error || macroNews.error;
        setError(errorMessage);
      }
      
      // Combine all news sources with source tags
      let allNews = [
        ...(Array.isArray(cryptoNews) ? cryptoNews.map(item => ({ ...item, source_type: 'crypto' })) : []),
        ...(Array.isArray(portfolioNews) ? portfolioNews.map(item => ({ ...item, source_type: 'portfolio' })) : []),
        ...(Array.isArray(macroNews.news) ? macroNews.news.map(item => ({ ...item, source_type: 'macro' })) : []),
        ...(Array.isArray(redditPosts) ? redditPosts.map(item => ({ ...item, source_type: 'reddit' })) : [])
      ];
      
      // Filter news by portfolio asset keywords
      const keywords = getAssetKeywords();
      const filteredNews = filterNewsByKeywords(allNews, keywords);
      
      // Sort by date (newest first)
      const sortedNews = filteredNews.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.created || 0);
        const dateB = new Date(b.timestamp || b.created || 0);
        return dateB - dateA;
      });
      
      // Update state
      setCombinedNews(sortedNews);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('Failed to fetch news. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to fetch Reddit posts
  const fetchRedditPosts = async () => {
    try {
      // Fetch from multiple crypto subreddits
      const subreddits = ['cryptocurrency', 'bitcoin', 'ethereum', 'CryptoMarkets'];
      const promises = subreddits.map(subreddit => 
        redditApiService.getSubredditPosts(subreddit, 10, 'hot')
      );
      
      const results = await Promise.all(promises);
      
      // Flatten results
      return results.flat();
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      return [];
    }
  };
  
  // Refresh handler
  const handleRefresh = () => {
    fetchAllNews();
  };
  
  // Initial fetch and refresh interval
  useEffect(() => {
    fetchAllNews();
    
    // Refresh every 5 minutes
    const intervalId = setInterval(fetchAllNews, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [portfolio.assets]);
  
  // Render a news item based on its source
  const renderNewsItem = (item, index) => {
    if (item.source_type === 'reddit') {
      return <RedditPost key={`reddit-${item.id}-${index}`} post={item} />;
    } else {
      return <NewsCard key={`news-${item.id}-${index}`} article={item} />;
    }
  };
  
  return (
    <Box pos="relative">
      <Group position="apart" mb="md">
        <Title order={4}>Portfolio News Feed</Title>
        <Group spacing="xs">
          <Text size="sm" color="dimmed">
            {lastUpdated && `Updated ${new Date(lastUpdated).toLocaleTimeString()}`}
          </Text>
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
      
      <Group mb="md" position="apart">
        <Text size="sm" color="dimmed">
          {combinedNews.length} news items related to your assets
        </Text>
        <Switch
          label="Advanced keyword filtering"
          checked={useAdvancedFiltering}
          onChange={(event) => setUseAdvancedFiltering(event.currentTarget.checked)}
          size="xs"
          onLabel={<IconFilter size={12} />}
          offLabel={<IconFilter size={12} />}
        />
      </Group>
      
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="md">
          {error}
        </Alert>
      )}
      
      <ScrollArea h={500} offsetScrollbars>
        {loading ? (
          <Center style={{ height: 200 }}>
            <Loader />
          </Center>
        ) : combinedNews.length === 0 ? (
          <Center style={{ height: 200 }}>
            <Stack align="center" spacing="xs">
              <Text color="dimmed">No relevant news found for your portfolio assets</Text>
              <Button variant="light" onClick={handleRefresh} leftIcon={<IconRefresh size={14} />}>
                Refresh News
              </Button>
            </Stack>
          </Center>
        ) : (
          <Stack spacing="md">
            {combinedNews.map((item, index) => renderNewsItem(item, index))}
          </Stack>
        )}
      </ScrollArea>
    </Box>
  );
}

export default PortfolioNewsFeed; 