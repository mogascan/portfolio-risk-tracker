import React, { useState, useEffect, useCallback } from 'react';
import { Box, Title, Tabs, ScrollArea, Loader, Center, Text, Alert, Button, Group, Stack, Code } from '@mantine/core';
import { IconRefresh, IconAlertCircle, IconBug } from '@tabler/icons-react';
import NewsCard from './NewsCard';
import { fetchCryptoNews, fetchPortfolioNews, fetchBitcoinNews, fetchWatchlistNews, fetchRwaNews, fetchMessariNews, updateWatchlistTokens } from '../../api/newsService';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useWatchlist } from '../../contexts/WatchlistContext';

// Debug configuration
const DEBUG_CONFIG = {
  baseUrl: 'http://localhost:8000/api',
  endpoints: {
    crypto: '/crypto/news',
    portfolio: '/crypto/holdings',
    bitcoin: '/crypto/bitcoin',
    watchlist: '/crypto/watchlist',
    rwa: '/crypto/rwa',
    messari: '/crypto/messari'
  }
};

// Fallback mock data in case API fails
const mockCryptoNews = [
  {
    id: 'crypto-1',
    title: 'Proof-of-Work Crypto Mining Doesn\'t Trigger Securities Laws, SEC Says',
    summary: 'The SEC clarified that cryptocurrency mining activities using proof-of-work do not fall under securities regulations.',
    source: 'COINDESK',
    timestamp: '3/20/2025, 4:36:40 PM',
    sentiment: 'NEUTRAL'
  },
  {
    id: 'crypto-2',
    title: 'Bitcoin Miners Feel Squeeze as Hashprice Erases Post-Election Gains',
    summary: 'Bitcoin miners are experiencing pressure as mining profitability decreases, erasing gains seen after recent elections.',
    source: 'COINDESK',
    timestamp: '3/20/2025, 2:06:20 PM',
    sentiment: 'POSITIVE'
  },
  {
    id: 'crypto-3',
    title: 'Ethereum Price Analysis: ETH Faces Strong Resistance at $4,000',
    summary: 'Ethereum is consolidating below a key level as bulls struggle to break above $4,000 resistance.',
    source: 'CryptoNews',
    timestamp: '3/20/2025, 1:30:00 PM',
    sentiment: 'NEUTRAL'
  }
];

// Fallback mock data for Bitcoin news
const mockBitcoinNews = [
  {
    id: 'bitcoin-1',
    title: 'Bitcoin Hashrate Hits All-Time High Despite Price Consolidation',
    summary: 'Bitcoin network security continues to strengthen as mining hashrate reaches new record levels.',
    source: 'BITCOIN MAGAZINE',
    timestamp: '3/20/2025, 3:15:20 PM',
    sentiment: 'POSITIVE'
  },
  {
    id: 'bitcoin-2',
    title: 'Major Investment Firm Increases Bitcoin Holdings by 15%',
    summary: 'A leading institutional investor has expanded its Bitcoin position amid favorable market conditions.',
    source: 'COINDESK',
    timestamp: '3/20/2025, 1:45:10 PM',
    sentiment: 'POSITIVE'
  }
];

// Fallback mock data for Watchlist news
const mockWatchlistNews = [
  {
    id: 'watchlist-1',
    title: 'Ethereum Layer 2 Solutions See Record Growth in Q1 2025',
    summary: 'Ethereum scaling solutions are experiencing unprecedented adoption as gas fees on the main chain remain high.',
    source: 'DECRYPT',
    timestamp: '3/21/2025, 9:15:00 AM',
    sentiment: 'POSITIVE'
  },
  {
    id: 'watchlist-2',
    title: 'Polkadot Unveils Upgraded Governance Model',
    summary: 'Polkadot has announced a significant update to its on-chain governance system, aiming to improve decentralization.',
    source: 'POLKADOT BLOG',
    timestamp: '3/20/2025, 5:30:00 PM',
    sentiment: 'NEUTRAL'
  },
  {
    id: 'watchlist-3',
    title: 'Chainlink Expands Integration with Major Banking Networks',
    summary: 'Chainlink oracle services are now being adopted by several traditional financial institutions for data verification.',
    source: 'COINDESK',
    timestamp: '3/19/2025, 2:20:00 PM',
    sentiment: 'POSITIVE'
  }
];

// Fallback mock data for RWA news
const mockRwaNews = [
  {
    id: 'rwa-1',
    title: 'RWA Market Expands as Institutional Interest Grows',
    summary: 'Real World Assets tokenization reaches new milestones as financial institutions embrace blockchain technology.',
    source: 'BLOCKCHAIN NEWS',
    timestamp: '3/21/2025, 10:15:20 AM',
    sentiment: 'POSITIVE'
  },
  {
    id: 'rwa-2',
    title: 'Plume Protocol Announces Partnership with Major Real Estate Fund',
    summary: 'The tokenization platform Plume is bringing billions in real estate assets on-chain through a new strategic partnership.',
    source: 'CRYPTO DAILY',
    timestamp: '3/20/2025, 2:25:10 PM',
    sentiment: 'POSITIVE'
  },
  {
    id: 'rwa-3',
    title: 'Regulators Clarify Framework for Real-World Assets Tokenization',
    summary: 'New guidelines aim to provide clarity for RWAfi projects seeking to comply with securities regulations.',
    source: 'COINDESK',
    timestamp: '3/19/2025, 4:10:00 PM',
    sentiment: 'NEUTRAL'
  }
];

// Fallback mock data for Messari news
const mockMessariNews = [
  {
    id: 'messari-1',
    title: 'State of DeFi: Q3 2025 Report',
    summary: 'Comprehensive analysis of the DeFi landscape and key metrics for Q3 2025.',
    source: 'MESSARI',
    timestamp: '3/21/2025, 11:30:00 AM',
    sentiment: 'NEUTRAL'
  },
  {
    id: 'messari-2',
    title: 'Institutional Capital Flows in Crypto Markets',
    summary: 'Research report examining institutional investment patterns and capital allocation in cryptocurrency markets.',
    source: 'MESSARI',
    timestamp: '3/19/2025, 9:45:00 AM',
    sentiment: 'POSITIVE'
  },
  {
    id: 'messari-3',
    title: 'Layer 2 Scaling Solutions: Technology and Market Overview',
    summary: 'Deep dive into various Layer 2 technologies, adoption metrics, and market opportunities.',
    source: 'MESSARI',
    timestamp: '3/18/2025, 2:15:00 PM',
    sentiment: 'NEUTRAL'
  }
];

function CryptoNewsFeed() {
  const { getPortfolioCoins, portfolio } = usePortfolio();
  const { getWatchlistCoins, watchlistUpdated, watchlist } = useWatchlist();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('market');
  const [news, setNews] = useState([]);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [portfolioCoins, setPortfolioCoins] = useState([]);
  const [watchlistCoins, setWatchlistCoins] = useState([]);

  // Update the backend whenever the watchlist changes
  useEffect(() => {
    if (getWatchlistCoins) {
      const coins = getWatchlistCoins();
      setWatchlistCoins(coins.map(coin => coin.toUpperCase()));
      
      if (coins.length > 0) {
        console.log('Updating watchlist tokens on backend:', coins);
        updateWatchlistTokens(coins)
          .then(response => {
            console.log('Watchlist update response:', response);
          })
          .catch(err => {
            console.error('Failed to update watchlist on backend:', err);
          });
      }
    }
  }, [watchlistUpdated, getWatchlistCoins]);

  // Fetch all relevant news data
  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    setErrorDetail(null);

    try {
      let userPortfolioCoins = [];
      let userWatchlistCoins = [];

      if (getPortfolioCoins) {
        const portfolioSymbols = getPortfolioCoins();
        const portfolioNames = portfolio?.assets?.map(asset => asset.name) || [];
        userPortfolioCoins = [...portfolioSymbols, ...portfolioNames];
        userPortfolioCoins = [...new Set(userPortfolioCoins)];
      }

      if (getWatchlistCoins) {
        userWatchlistCoins = getWatchlistCoins();
      }

      setPortfolioCoins(userPortfolioCoins.map(coin => coin.toUpperCase()));
      setWatchlistCoins(userWatchlistCoins.map(coin => coin.toUpperCase()));

      console.log('[CryptoNewsFeed] Portfolio coins:', userPortfolioCoins);
      console.log('[CryptoNewsFeed] Watchlist coins:', userWatchlistCoins);
      console.log('[CryptoNewsFeed] Fetching news for tab:', activeTab);

      let newsData = [];
      let response;

      if (activeTab === 'holdings') {
        if (userPortfolioCoins.length === 0) {
          setError('No coins in your portfolio. Add coins to see related news.');
          setNews([]);
          setLoading(false);
          return;
        }

        response = await fetchPortfolioNews(10);
        console.log('[CryptoNewsFeed] Portfolio news response:', response);
        newsData = response.success && response.data ? response.data : [];

      } else if (activeTab === 'bitcoin') {
        response = await fetchBitcoinNews(10);
        console.log('[CryptoNewsFeed] Bitcoin news response:', response);
        newsData = response.success && response.data ? response.data : [];

      } else if (activeTab === 'watchlist') {
        if (userWatchlistCoins.length === 0) {
          setError('Your watchlist is empty. Add coins to your watchlist to see related news.');
          setNews([]);
          setLoading(false);
          return;
        }

        response = await fetchWatchlistNews(10);
        console.log('[CryptoNewsFeed] Watchlist news response:', response);
        newsData = response.success && response.data ? response.data : [];

      } else if (activeTab === 'rwa') {
        response = await fetchRwaNews(10);
        console.log('[CryptoNewsFeed] RWA news response:', response);
        newsData = response.success && response.data ? response.data : [];

      } else if (activeTab === 'messari') {
        response = await fetchMessariNews(10);
        console.log('[CryptoNewsFeed] Messari news response:', response);
        newsData = response.success && response.data ? response.data : [];

      } else {
        // Market news (default tab)
        response = await fetchCryptoNews({ limit: 10 });
        console.log('[CryptoNewsFeed] Market news response:', response);
        newsData = response.success && response.data ? response.data : [];
      }

      // Only use mock data if we have no real data
      if (!newsData || newsData.length === 0) {
        console.log('[CryptoNewsFeed] No data from API, using mock data for:', activeTab);
        if (activeTab === 'market') {
          newsData = mockCryptoNews;
        } else if (activeTab === 'bitcoin') {
          newsData = mockBitcoinNews;
        } else if (activeTab === 'watchlist') {
          newsData = mockWatchlistNews;
        } else if (activeTab === 'rwa') {
          newsData = mockRwaNews;
        } else if (activeTab === 'messari') {
          newsData = mockMessariNews;
        }
      }

      // Normalize the news data
      const normalizedNews = newsData.map(item => ({
        id: item.id || `${activeTab}-${Date.now()}-${Math.random()}`,
        title: item.title || 'No Title Available',
        summary: item.summary || item.description || 'No summary available',
        source: item.source || 'Unknown Source',
        timestamp: item.timestamp || item.publishedAt || new Date().toISOString(),
        sentiment: item.sentiment || 'NEUTRAL',
        url: item.url || null,
        currencies: item.currencies || item.relatedCoins || []
      }));

      console.log(`[CryptoNewsFeed] Setting ${normalizedNews.length} normalized news items for ${activeTab} tab:`, normalizedNews);
      setNews(normalizedNews);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('[CryptoNewsFeed] Error fetching news:', err);
      
      // Use mock data as fallback in case of error
      console.log('[CryptoNewsFeed] Using mock data as fallback for:', activeTab);
      let fallbackNews = [];
      if (activeTab === 'market') {
        fallbackNews = mockCryptoNews;
      } else if (activeTab === 'bitcoin') {
        fallbackNews = mockBitcoinNews;
      } else if (activeTab === 'watchlist') {
        fallbackNews = mockWatchlistNews;
      } else if (activeTab === 'rwa') {
        fallbackNews = mockRwaNews;
      } else if (activeTab === 'messari') {
        fallbackNews = mockMessariNews;
      }
      
      setNews(fallbackNews);
      setErrorDetail(err.message);
      setLastUpdated(new Date());
      setLoading(false);
    }
  };

  // Fetch news when tab changes
  useEffect(() => {
    console.log('[CryptoNewsFeed] Tab changed to:', activeTab);
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
                Endpoints: {
                  activeTab === 'holdings' ? DEBUG_CONFIG.endpoints.portfolio : 
                  activeTab === 'bitcoin' ? DEBUG_CONFIG.endpoints.bitcoin :
                  activeTab === 'watchlist' ? DEBUG_CONFIG.endpoints.watchlist :
                  activeTab === 'rwa' ? DEBUG_CONFIG.endpoints.rwa :
                  activeTab === 'messari' ? DEBUG_CONFIG.endpoints.messari :
                  DEBUG_CONFIG.endpoints.crypto
                }
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
              id: item.id || `${activeTab}-${Date.now()}-${Math.random()}`,
              title: item.title || 'No Title Available',
              summary: item.summary || item.description || 'No summary available',
              source: item.source || 'Unknown Source',
              timestamp: item.timestamp || item.publishedAt || new Date().toISOString(),
              sentiment: item.sentiment || 'NEUTRAL',
              url: item.url || null,
              currencies: item.currencies || item.relatedCoins || []
            };

            return (
              <NewsCard 
                key={normalizedItem.id} 
                item={normalizedItem} 
                portfolioCoins={portfolioCoins}
                watchlistCoins={watchlistCoins}
                showPortfolioIndicator={true}
              />
            );
          })
        ) : (
          <Center h={300}>
            <Text c="dimmed">No news found</Text>
          </Center>
        )}
      </ScrollArea>
    );
  };

  return (
    <Box>
      <Group position="apart" mb="md">
        <Title order={4}>Crypto News</Title>
        
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
          <Tabs.Tab value="market">Market News</Tabs.Tab>
          <Tabs.Tab value="bitcoin">Bitcoin</Tabs.Tab>
          <Tabs.Tab value="rwa">RWA</Tabs.Tab>
          <Tabs.Tab value="messari">Messari</Tabs.Tab>
          <Tabs.Tab value="watchlist">Watchlist</Tabs.Tab>
          <Tabs.Tab value="holdings">Portfolio Holdings</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="market">
          {renderNewsContent()}
        </Tabs.Panel>

        <Tabs.Panel value="bitcoin">
          {renderNewsContent()}
        </Tabs.Panel>

        <Tabs.Panel value="rwa">
          {renderNewsContent()}
        </Tabs.Panel>

        <Tabs.Panel value="messari">
          {renderNewsContent()}
        </Tabs.Panel>

        <Tabs.Panel value="watchlist">
          {renderNewsContent()}
        </Tabs.Panel>

        <Tabs.Panel value="holdings">
          {renderNewsContent()}
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}

export default CryptoNewsFeed; 