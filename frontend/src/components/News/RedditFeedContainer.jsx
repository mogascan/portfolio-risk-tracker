import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Group, Button, Select, TextInput, Stack, LoadingOverlay, Title, ScrollArea } from '@mantine/core';
import { IconRefresh, IconSearch } from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { formatDistanceToNow } from 'date-fns';
import RedditPost from './RedditPost';
import redditApiService from '../../services/redditApiService';

// Default subreddits related to crypto
const DEFAULT_SUBREDDITS = [
  'cryptocurrency',
  'bitcoin',
  'ethereum',
  'CryptoMarkets',
];

const SORT_OPTIONS = [
  { value: 'hot', label: 'Hot' },
  { value: 'new', label: 'New' },
  { value: 'top', label: 'Top' },
  { value: 'rising', label: 'Rising' },
];

const RedditFeedContainer = () => {
  // State
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedSubreddit, setSelectedSubreddit] = useLocalStorage({
    key: 'selected-subreddit',
    defaultValue: 'cryptocurrency',
  });
  const [sortBy, setSortBy] = useLocalStorage({
    key: 'reddit-sort',
    defaultValue: 'hot',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch posts from the selected subreddit
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let fetchedPosts;
      if (searchQuery) {
        console.log(`Searching Reddit for "${searchQuery}" in r/${selectedSubreddit}`);
        try {
          fetchedPosts = await redditApiService.searchPosts(
            searchQuery,
            [selectedSubreddit],
            25
          );
        } catch (searchError) {
          console.error('Search failed, trying fallback:', searchError);
          // Try fallback method if search fails
          fetchedPosts = await redditApiService.fallbackGetPosts(selectedSubreddit, 25);
          if (fetchedPosts.length === 0) {
            throw searchError; // If fallback didn't return anything, throw the original error
          }
        }
      } else {
        console.log(`Fetching posts from r/${selectedSubreddit} sorted by ${sortBy}`);
        try {
          fetchedPosts = await redditApiService.getSubredditPosts(
            selectedSubreddit,
            25,
            sortBy
          );
        } catch (fetchError) {
          console.error('Regular fetch failed, trying fallback:', fetchError);
          // Try fallback method if regular fetch fails
          fetchedPosts = await redditApiService.fallbackGetPosts(selectedSubreddit, 25);
          if (fetchedPosts.length === 0) {
            throw fetchError; // If fallback didn't return anything, throw the original error
          }
        }
      }
      console.log(`Successfully fetched ${fetchedPosts.length} posts from Reddit`);
      setPosts(fetchedPosts);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      const errorMessage = error.message || 'Unknown error';
      const statusCode = error.response?.status || 'No status';
      setError(`Failed to fetch posts (${statusCode}): ${errorMessage}. Please try again later.`);
      notifications.show({
        title: 'Reddit Feed Error',
        message: `Failed to fetch posts: ${errorMessage}. Please try again later.`,
        color: 'red',
      });
      
      // Set empty posts array to prevent UI from breaking
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubreddit, sortBy, searchQuery]);

  // Fetch posts when component mounts or when subreddit/sort changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Auto-refresh posts every 15 minutes instead of 5 to avoid API throttling
  useEffect(() => {
    const intervalId = setInterval(fetchPosts, 15 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [fetchPosts]);

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isLoading} overlayBlur={2} />
      
      <Stack spacing="md">
        <Group position="apart" align="center">
          <Title order={4}>Reddit</Title>
          <Group spacing="xs">
            <Text size="sm" color="dimmed">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </Text>
            <Button
              variant="subtle" 
              size="xs" 
              compact 
              onClick={fetchPosts}
              leftIcon={<IconRefresh size={14} />}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Group>
        </Group>
        
        <Group position="apart" align="flex-end">
          <Group align="flex-end" spacing="xs">
            <Select
              label="Subreddit"
              placeholder="Select subreddit"
              value={selectedSubreddit}
              onChange={setSelectedSubreddit}
              data={DEFAULT_SUBREDDITS.map(sub => ({
                value: sub,
                label: `r/${sub}`,
              }))}
              style={{ width: 200 }}
            />
            <Select
              label="Sort by"
              value={sortBy}
              onChange={setSortBy}
              data={SORT_OPTIONS}
              style={{ width: 120 }}
            />
          </Group>
        </Group>

        <TextInput
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          icon={<IconSearch size={16} />}
          rightSection={
            searchQuery && (
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setSearchQuery('')}
                compact
              >
                Clear
              </Button>
            )
          }
        />

        <ScrollArea h={423} offsetScrollbars>
          {error ? (
            <Box p="md" style={{ textAlign: 'center' }}>
              <Text color="red" align="center" mb="xs">
                {error}
              </Text>
              <Text size="sm" color="dimmed" mb="md">
                Reddit's API might be experiencing issues or has rate limited our app.
              </Text>
              <Button 
                variant="outline" 
                color="blue" 
                size="sm" 
                onClick={fetchPosts} 
                disabled={isLoading}
                leftIcon={<IconRefresh size={14} />}
              >
                Retry
              </Button>
            </Box>
          ) : posts.length === 0 ? (
            <Text color="dimmed" align="center">
              No posts found.
            </Text>
          ) : (
            posts.map((post) => <RedditPost key={post.id} post={post} />)
          )}
        </ScrollArea>
      </Stack>
    </Box>
  );
};

export default RedditFeedContainer; 