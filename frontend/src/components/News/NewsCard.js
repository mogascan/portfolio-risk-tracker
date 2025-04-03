import React from 'react';
import { Card, Text, Group, ActionIcon, Badge, Box, Tooltip, Stack, Anchor, Indicator, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { IconBookmark, IconBookmarkFilled, IconExternalLink, IconCoinBitcoin, IconWallet, IconEye } from '@tabler/icons-react';
import { useBookmarks } from '../../contexts/BookmarkContext';
import { formatTimeAgo } from '../../utils/dateUtils';
import { extractRelevantCoins, getTokenName } from '../../utils/textUtils';

const sentimentColors = {
  POSITIVE: 'green',
  NEUTRAL: 'blue',
  NEGATIVE: 'red'
};

const sentimentIcons = {
  POSITIVE: '📈',
  NEUTRAL: '📊',
  NEGATIVE: '📉',
};

function NewsCard({ item, portfolioCoins = [], watchlistCoins = [], showPortfolioIndicator = false }) {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Get theme-appropriate border color
  const borderColor = isDark ? theme.colors.dark[6] || '#141517' : theme.colors.gray[3] || '#e9ecef';
  
  // Ensure item.id is a string for consistent handling
  const normalizedItem = React.useMemo(() => {
    if (!item) return item;
    return {
      ...item,
      id: String(item.id)
    };
  }, [item]);
  
  // Track bookmark state
  const [isBookmarkedState, setIsBookmarkedState] = React.useState(() => isBookmarked(normalizedItem.id));

  // Update local state when bookmark status changes
  React.useEffect(() => {
    setIsBookmarkedState(isBookmarked(normalizedItem.id));
  }, [normalizedItem.id, isBookmarked]);

  const handleBookmark = React.useCallback(() => {
    if (isBookmarkedState) {
      removeBookmark(normalizedItem.id);
    } else {
      addBookmark(normalizedItem);
    }
    setIsBookmarkedState(!isBookmarkedState);
  }, [normalizedItem, isBookmarkedState, addBookmark, removeBookmark]);

  // Check if this news is about any of the user's portfolio coins
  const isInPortfolio = React.useMemo(() => {
    if (!showPortfolioIndicator || !normalizedItem.currencies || !portfolioCoins.length) return false;
    
    return normalizedItem.currencies.some(currency => 
      portfolioCoins.includes(currency)
    );
  }, [normalizedItem.currencies, portfolioCoins, showPortfolioIndicator]);

  // Format the timestamp with special handling for "just now"
  const formattedTime = React.useMemo(() => {
    if (!item.timestamp) return '';

    // First try to use the formatTimeAgo function from dateUtils if it's imported
    try {
      return formatTimeAgo(item.timestamp);
    } catch (e) {
      // Fallback to simple formatting if the utility function isn't available
      console.warn('formatTimeAgo not available, using fallback', e);
      
      // If it's already in the format "Xh ago" or "Xm ago", just return it
      if (item.timestamp.endsWith('h ago') || item.timestamp.endsWith('m ago')) {
        return item.timestamp;
      }
      
      try {
        const date = new Date(item.timestamp);
        if (isNaN(date.getTime())) {
          return item.timestamp; // If parsing fails, return the original string
        }
        return date.toLocaleString(); // Simple formatting
      } catch (err) {
        return item.timestamp;
      }
    }
  }, [item.timestamp]);
  
  // Check if the article is very recent ("just now")
  const isRecentArticle = formattedTime === 'Just now';
  
  // Extract coin mentions from title and summary for highlighting
  const mentionedCoins = React.useMemo(() => {
    try {
      if (typeof extractRelevantCoins === 'function') {
        return extractRelevantCoins(`${item.title} ${item.summary}`);
      }
      return [];
    } catch (e) {
      console.warn('extractRelevantCoins not available', e);
      return [];
    }
  }, [item.title, item.summary]);
  
  // Check if any mentioned coins are in the user's portfolio
  const portfolioMatch = React.useMemo(() => {
    if (!mentionedCoins.length || !portfolioCoins.length) return false;
    return mentionedCoins.some(coin => portfolioCoins.includes(coin));
  }, [mentionedCoins, portfolioCoins]);
  
  // Check which watchlist coins are mentioned and get the first match
  const watchlistMatches = React.useMemo(() => {
    if (!mentionedCoins.length || !watchlistCoins.length) return [];
    return mentionedCoins.filter(coin => watchlistCoins.includes(coin));
  }, [mentionedCoins, watchlistCoins]);
  
  const hasWatchlistMatch = watchlistMatches.length > 0;
  
  // Get token names for display instead of symbols
  const watchlistMatchNames = React.useMemo(() => {
    return watchlistMatches.map(symbol => {
      // Try to use the getTokenName function if available
      try {
        if (typeof getTokenName === 'function') {
          return getTokenName(symbol);
        }
      } catch (e) {
        console.warn('getTokenName not available, using symbol', e);
      }
      return symbol;
    });
  }, [watchlistMatches]);
  
  // Determine sentiment color
  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'gray';
    const normalizedSentiment = sentiment.toUpperCase();
    if (normalizedSentiment === 'POSITIVE' || normalizedSentiment === 'BULLISH') return 'green';
    if (normalizedSentiment === 'NEGATIVE' || normalizedSentiment === 'BEARISH') return 'red';
    return 'gray';
  };
  
  // Format sentiment text
  const getSentimentText = (sentiment) => {
    if (!sentiment) return 'Neutral';
    return sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase();
  };

  // Function to open the URL in a new tab
  const openArticle = () => {
    if (normalizedItem.url) {
      window.open(normalizedItem.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Get appropriate style for the timestamp badge
  const getTimeBadgeStyle = React.useMemo(() => {
    if (isRecentArticle) {
      return {
        color: 'green',
        variant: 'filled'
      };
    } else if (formattedTime.includes('m ago')) {
      return {
        color: 'blue',
        variant: 'light'
      };
    } else if (formattedTime.includes('h ago')) {
      return {
        color: 'indigo',
        variant: 'light'
      };
    } else if (formattedTime.includes('d ago')) {
      return {
        color: 'violet',
        variant: 'light'
      };
    } else {
      return {
        color: 'gray',
        variant: 'outline'
      };
    }
  }, [isRecentArticle, formattedTime]);

  if (!normalizedItem) return null;

  return (
    <Card 
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
    >
      <Group position="apart" mb="xs">
        <Box>
          {normalizedItem.source && (
            <Text size="xs" c="dimmed" fw={500} tt="uppercase">
              {normalizedItem.source}
            </Text>
          )}
          {normalizedItem.timestamp && (
            <Badge 
              color={getTimeBadgeStyle.color}
              variant={getTimeBadgeStyle.variant}
              radius="xl" 
              size="sm"
              style={{
                textTransform: isRecentArticle ? 'uppercase' : 'none',
                fontWeight: isRecentArticle ? 'bold' : 'normal',
                letterSpacing: isRecentArticle ? '0.5px' : 'normal'
              }}
            >
              {formattedTime}
            </Badge>
          )}
        </Box>
        <Group spacing="xs">
          {isInPortfolio && (
            <Tooltip 
              label="In Your Portfolio" 
              color="teal" 
              withArrow
              position="top"
            >
              <Badge color="teal" variant="filled" leftSection={<IconCoinBitcoin size={12} />}>
                You Hold
              </Badge>
            </Tooltip>
          )}
          {showPortfolioIndicator && portfolioMatch && (
            <Tooltip 
              label="Mentioned coin is in your portfolio" 
              color="teal" 
              withArrow
              position="top"
            >
              <Badge color="teal" variant="light" leftSection={<IconWallet size={12} />}>
                Mentioned
              </Badge>
            </Tooltip>
          )}
          {showPortfolioIndicator && hasWatchlistMatch && (
            <Tooltip 
              label={`${watchlistMatches[0]} is in your watchlist`}
              color="indigo" 
              withArrow
              position="top"
            >
              <Badge color="indigo" variant="light" leftSection={<IconEye size={12} />}>
                {watchlistMatchNames[0] || watchlistMatches[0]}
              </Badge>
            </Tooltip>
          )}
          {showPortfolioIndicator && watchlistMatches.length > 1 && (
            <Tooltip 
              label={`Also mentioned: ${watchlistMatches.slice(1).join(', ')}`}
              color="indigo" 
              withArrow
              position="top"
            >
              <Badge color="indigo" variant="outline">
                +{watchlistMatches.length - 1}
              </Badge>
            </Tooltip>
          )}
          <Badge 
            color={getSentimentColor(normalizedItem.sentiment) || 'gray'} 
            variant="light"
            leftSection={normalizedItem.sentiment ? sentimentIcons[normalizedItem.sentiment] : null}
          >
            {getSentimentText(normalizedItem.sentiment) || 'UNKNOWN'}
          </Badge>
        </Group>
      </Group>

      <Text fw={700} size="md" mb="xs" lineClamp={2}>
        {normalizedItem.title}
      </Text>

      <Text size="sm" c="dimmed" lineClamp={2} mb="sm">
        {normalizedItem.summary || 'No summary available'}
      </Text>

      <Group position="right" mt="md">
        {normalizedItem.url && (
          <Tooltip 
            label="View original article" 
            color="blue" 
            withArrow
            position="top"
          >
            <ActionIcon 
              variant="subtle" 
              color="gray"
              onClick={openArticle}
            >
              <IconExternalLink size="1.2rem" />
            </ActionIcon>
          </Tooltip>
        )}
        <Tooltip 
          label={isBookmarkedState ? "Remove bookmark" : "Add bookmark"} 
          color="blue" 
          withArrow
          position="top"
        >
          <ActionIcon 
            variant="subtle" 
            color={isBookmarkedState ? "blue" : "gray"}
            onClick={handleBookmark}
          >
            {isBookmarkedState ? <IconBookmarkFilled size="1.2rem" /> : <IconBookmark size="1.2rem" />}
          </ActionIcon>
        </Tooltip>
      </Group>
    </Card>
  );
}

export default NewsCard; 