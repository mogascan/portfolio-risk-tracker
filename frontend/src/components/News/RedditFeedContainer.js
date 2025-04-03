import React, { useState, useEffect } from 'react';
import { Box, Title, Tabs, ScrollArea, Loader, Center, Text, Alert, Button, Group, Stack, Code, Card, ActionIcon, Badge, Tooltip } from '@mantine/core';
import { IconRefresh, IconAlertCircle, IconBug, IconBookmark, IconBookmarkFilled, IconExternalLink } from '@tabler/icons-react';
import { fetchRedditPosts, searchRedditPosts } from '../../api/newsService';
import { useBookmarks } from '../../contexts/BookmarkContext';
import { useMantineColorScheme, useMantineTheme } from '@mantine/core';

// Default subreddits to display
const CRYPTO_SUBREDDITS = [
  'cryptocurrency',
  'Bitcoin',
  'ethereum',
  'CryptoMarkets',
  'defi',
  'altcoin'
];

// Sentiment colors mapping
const sentimentColors = {
  'POSITIVE': 'green',
  'NEUTRAL': 'blue',
  'NEGATIVE': 'red'
};

function RedditFeedContainer() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cryptocurrency');
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [sort, setSort] = useState('hot');
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Get theme-appropriate border color
  const borderColor = isDark ? theme.colors.dark[6] || '#141517' : theme.colors.gray[3] || '#e9ecef';

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    
    try {
      console.log(`Fetching Reddit posts from r/${activeTab} sorted by ${sort}`);
      
      const response = await fetchRedditPosts(activeTab, sort, 25);
      console.log('Reddit posts response:', response);
      
      if (response && response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log(`Successfully fetched ${response.data.length} posts from r/${activeTab}`);
        // Set the posts
        setPosts(response.data);
        setLastUpdated(new Date());
      } else {
        // Handle empty or invalid response
        console.warn(`No valid posts received from r/${activeTab}, using mock data`);
        // Add mock data here if needed
        const mockRedditPosts = [
          {
            id: `reddit-mock-1-${Date.now()}`,
            title: "Community Discussion: What\'s your crypto investment strategy for 2025?",
            content: "I\'ve been DCAing into BTC and ETH for the past year, curious what others are doing.",
            author: 'crypto_enthusiast',
            score: 142,
            comments: 87,
            url: 'https://reddit.com',
            published_at: new Date().toISOString(),
            sentiment: 'NEUTRAL'
          },
          {
            id: `reddit-mock-2-${Date.now()}`,
            title: "Breaking: New regulatory framework proposed for DeFi platforms",
            content: "The SEC has announced new guidelines specifically addressing decentralized finance protocols.",
            author: 'defi_watcher',
            score: 328,
            comments: 156,
            url: 'https://reddit.com',
            published_at: new Date(Date.now() - 3600000).toISOString(),
            sentiment: 'NEUTRAL'
          }
        ];
        setPosts(mockRedditPosts);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error(`Failed to fetch posts from r/${activeTab}:`, err);
      
      // Set error message
      if (err.message && err.message.includes('Rate limit exceeded')) {
        setError('Reddit API rate limit exceeded. Please try again later.');
      } else if (err.message && err.message.includes('Network')) {
        setError('Network connectivity issue. Please check your internet connection.');
      } else {
        setError(`Failed to load posts from r/${activeTab}.`);
      }
      
      setErrorDetail(err.toString());

      // Add mock data as fallback on error
      const fallbackPosts = [
        {
          id: `reddit-fallback-1-${Date.now()}`,
          title: "Unable to load live Reddit data (Fallback Content)",
          content: "We're having trouble connecting to Reddit. Here's some sample content in the meantime.",
          author: 'system',
          score: 0,
          comments: 0,
          url: 'https://reddit.com',
          published_at: new Date().toISOString(),
          sentiment: 'NEUTRAL'
        }
      ];
      setPosts(fallbackPosts);
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts when tab or sort changes
  useEffect(() => {
    fetchPosts();
  }, [activeTab, sort]);

  const handleRefresh = () => {
    fetchPosts();
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  // Format Reddit post date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = (post) => {
    const normalizedPost = {
      ...post,
      id: String(post.id),
      // Adding fields expected by bookmark system
      url: post.url,
      source: `r/${activeTab}`,
      title: post.title,
      summary: post.content || '',
      timestamp: post.published_at,
      sentiment: post.sentiment || 'NEUTRAL'
    };

    if (isBookmarked(normalizedPost.id)) {
      removeBookmark(normalizedPost.id);
    } else {
      addBookmark(normalizedPost);
    }
  };

  // Get sentiment color
  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'gray';
    return sentimentColors[sentiment] || 'gray';
  };

  // Get sentiment display text
  const getSentimentText = (sentiment) => {
    if (!sentiment) return 'Neutral';
    return sentiment.charAt(0) + sentiment.slice(1).toLowerCase();
  };

  // Render each Reddit post
  const renderPost = (post) => {
    const isPostBookmarked = isBookmarked(String(post.id));
    
    return (
      <Card 
        key={post.id} 
        shadow="sm" 
        padding="md" 
        radius="md" 
        withBorder={false}
        style={{
          border: `1px solid ${borderColor}`,
          borderRadius: '8px',
          marginBottom: '8px',
          backgroundColor: isDark ? theme.colors.dark[6] : 'white'
        }}
        mb="md"
      >
        <Group position="apart" mb="xs">
          <Box>
            <Text size="xs" c="dimmed" fw={500} tt="uppercase">
              r/{activeTab}
            </Text>
            <Badge 
              color="blue"
              variant="light"
              radius="xl" 
              size="sm"
            >
              {formatDate(post.published_at)}
            </Badge>
          </Box>
          <Group spacing="xs">
            {post.sentiment && (
              <Badge 
                color={getSentimentColor(post.sentiment)} 
                variant="light"
              >
                {getSentimentText(post.sentiment)}
              </Badge>
            )}
          </Group>
        </Group>

        <Text fw={700} size="md" mb="xs" lineClamp={2} component="a" href={post.url} target="_blank" rel="noopener noreferrer">
          {post.title}
        </Text>
        
        {post.content && (
          <Text size="sm" c="dimmed" lineClamp={2} mb="sm">
            {post.content}
          </Text>
        )}

        <Group position="apart" mt="md">
          <Group spacing="xs">
            <Text size="xs" weight={500}>↑ {post.score}</Text>
            <Text size="xs" color="dimmed">•</Text>
            <Text size="xs">{post.comments} comments</Text>
            <Text size="xs" color="dimmed">•</Text>
            <Text size="xs" color="dimmed">Posted by u/{post.author}</Text>
          </Group>
          
          <Group>
            {post.url && (
              <Tooltip 
                label="View original post" 
                color="blue" 
                withArrow
                position="top"
              >
                <ActionIcon 
                  variant="subtle" 
                  color="gray"
                  onClick={() => window.open(post.url, '_blank', 'noopener,noreferrer')}
                >
                  <IconExternalLink size="1.2rem" />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip 
              label={isPostBookmarked ? "Remove bookmark" : "Add bookmark"} 
              color="blue" 
              withArrow
              position="top"
            >
              <ActionIcon 
                variant="subtle" 
                color={isPostBookmarked ? "blue" : "gray"}
                onClick={() => handleBookmarkToggle(post)}
              >
                {isPostBookmarked ? (
                  <IconBookmarkFilled size="1.2rem" />
                ) : (
                  <IconBookmark size="1.2rem" />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card>
    );
  };

  // Render content based on loading/error state
  const renderContent = () => {
    if (error) {
      return (
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mt="md" mb="md">
          <Stack spacing="xs">
            <Text>{error}</Text>
            {debugMode && errorDetail && (
              <Code block size="xs">{errorDetail}</Code>
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
        ) : posts.length > 0 ? (
          posts.map(post => renderPost(post))
        ) : (
          <Center h={300}>
            <Text c="dimmed">No posts found in r/{activeTab}</Text>
          </Center>
        )}
      </ScrollArea>
    );
  };

  return (
    <Box>
      <Group position="apart" mb="md">
        <Title order={4}>Reddit</Title>
        
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
          {CRYPTO_SUBREDDITS.map(subreddit => (
            <Tabs.Tab key={subreddit} value={subreddit}>
              r/{subreddit}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {CRYPTO_SUBREDDITS.map(subreddit => (
          <Tabs.Panel key={subreddit} value={subreddit}>
            <Group position="right" mb="md" mt="md">
              <Tabs value={sort} onChange={setSort}>
                <Tabs.List>
                  <Tabs.Tab value="hot">Hot</Tabs.Tab>
                  <Tabs.Tab value="new">New</Tabs.Tab>
                  <Tabs.Tab value="top">Top</Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </Group>
            {renderContent()}
          </Tabs.Panel>
        ))}
      </Tabs>
    </Box>
  );
}

export default RedditFeedContainer; 