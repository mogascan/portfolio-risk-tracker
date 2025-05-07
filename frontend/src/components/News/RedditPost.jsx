import React from 'react';
import { Card, Text, Group, ActionIcon, Stack, Box, Badge, Tooltip, Image } from '@mantine/core';
import { IconArrowUp, IconMessageCircle2, IconExternalLink, IconBookmark, IconBookmarkFilled } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { useBookmarks } from '../../contexts/BookmarkContext';

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

const RedditPost = ({ post }) => {
  const {
    title,
    author,
    subreddit,
    score,
    numComments,
    created,
    permalink,
    selftext,
    thumbnail,
    url,
    sentiment = 'NEUTRAL' // Default sentiment if not provided
  } = post;

  // Ensure permalink is a valid URL
  const getValidPermalink = () => {
    if (!permalink) return '#';
    // If already a full URL, return it
    if (permalink.startsWith('http')) return permalink;
    // If it starts with a slash, add the domain
    if (permalink.startsWith('/')) return `https://www.reddit.com${permalink}`;
    // Otherwise, add domain and slash
    return `https://www.reddit.com/${permalink}`;
  };

  // Check if it's a valid image thumbnail
  const getValidThumbnail = () => {
    if (!thumbnail) return null;
    if (thumbnail === 'self' || thumbnail === 'default' || thumbnail === 'nsfw' || thumbnail === 'spoiler') return null;
    return thumbnail;
  };

  // Get sentiment color and text
  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'gray';
    const normalizedSentiment = sentiment.toUpperCase();
    if (normalizedSentiment === 'POSITIVE' || normalizedSentiment === 'BULLISH') return 'green';
    if (normalizedSentiment === 'NEGATIVE' || normalizedSentiment === 'BEARISH') return 'red';
    return 'blue';
  };

  const getSentimentText = (sentiment) => {
    if (!sentiment) return 'Neutral';
    return sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase();
  };

  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const normalizedId = `social-reddit-${post.id}`;
  const bookmarked = isBookmarked(normalizedId);

  // Format the score for display (e.g., 1.5k instead of 1500)
  const formatScore = (score) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  const handleBookmarkToggle = () => {
    if (bookmarked) {
      removeBookmark(normalizedId);
    } else {
      addBookmark({
        id: normalizedId,
        type: 'social',
        source: 'REDDIT',
        title,
        summary: selftext || '',
        author,
        subreddit,
        timestamp: new Date(created).toISOString(),
        url: getValidPermalink(),
        sentiment,
        social_stats: {
          score,
          comments: numComments
        }
      });
    }
  };

  // Get appropriate style for the timestamp badge
  const getTimeBadgeStyle = () => {
    const timeAgo = formatDistanceToNow(created, { addSuffix: true });
    const isRecentPost = timeAgo.includes('less than a minute') || timeAgo.includes('1 minute');
    
    if (isRecentPost) {
      return {
        color: 'green',
        variant: 'filled'
      };
    } else if (timeAgo.includes('minute')) {
      return {
        color: 'blue',
        variant: 'light'
      };
    } else if (timeAgo.includes('hour')) {
      return {
        color: 'indigo',
        variant: 'light'
      };
    } else if (timeAgo.includes('day')) {
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
  };

  const timeBadgeStyle = getTimeBadgeStyle();
  const timeAgo = formatDistanceToNow(created, { addSuffix: true });
  const isRecentPost = timeAgo.includes('less than a minute') || timeAgo.includes('1 minute');
  const validThumbnail = getValidThumbnail();

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder mb="md" style={{ 
      width: '100%', 
      maxWidth: '100%', 
      boxSizing: 'border-box',
      overflow: 'hidden' 
    }}>
      <Stack spacing="xs">
        <Group position="apart" align="flex-start" noWrap style={{ minWidth: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Group spacing={4} mb={4} style={{ flexWrap: 'wrap' }}>
              <Text size="xs" c="dimmed" fw={500} tt="uppercase">r/{subreddit}</Text>
              <Text size="xs" c="dimmed">•</Text>
              <Text size="xs" c="dimmed" truncate>u/{author}</Text>
              <Text size="xs" c="dimmed">•</Text>
              <Badge 
                color={timeBadgeStyle.color}
                variant={timeBadgeStyle.variant}
                radius="xl" 
                size="sm"
                style={{
                  textTransform: isRecentPost ? 'uppercase' : 'none',
                  fontWeight: isRecentPost ? 'bold' : 'normal',
                  letterSpacing: isRecentPost ? '0.5px' : 'normal'
                }}
              >
                {timeAgo}
              </Badge>
              <Badge 
                color={getSentimentColor(sentiment)} 
                variant="light"
                leftSection={sentimentIcons[sentiment?.toUpperCase() || 'NEUTRAL']}
                ml="auto"
                style={{ marginLeft: 'auto' }}
              >
                {getSentimentText(sentiment)}
              </Badge>
            </Group>
            <Text fw={700} size="md" mb="xs" lineClamp={2} style={{ wordBreak: 'break-word' }}>
              {title}
            </Text>
          </Box>
          {validThumbnail && (
            <Box ml="md" style={{ flexShrink: 0 }}>
              <Image 
                src={validThumbnail} 
                width={70} 
                height={70} 
                radius="md"
                alt={title}
                withPlaceholder
                fit="cover"
                style={{ marginTop: 4 }}
              />
            </Box>
          )}
        </Group>

        {selftext && (
          <Text size="sm" c="dimmed" lineClamp={2} mb="sm" style={{ wordBreak: 'break-word' }}>
            {selftext}
          </Text>
        )}

        <Group position="apart" mt={4} style={{ flexWrap: 'wrap' }}>
          <Group spacing="xs">
            <IconArrowUp size={14} />
            <Text size="xs">{formatScore(score || 0)}</Text>
            <Text size="xs" c="dimmed">•</Text>
            <IconMessageCircle2 size={14} />
            <Text size="xs">{numComments || 0}</Text>
          </Group>
          <Group spacing="xs">
            <Tooltip 
              label={bookmarked ? "Remove bookmark" : "Add bookmark"} 
              color="blue" 
              withArrow
              position="top"
            >
              <ActionIcon
                variant="subtle"
                color={bookmarked ? "blue" : "gray"}
                onClick={handleBookmarkToggle}
                size="sm"
              >
                {bookmarked ? <IconBookmarkFilled size={16} /> : <IconBookmark size={16} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip 
              label="View on Reddit" 
              color="blue" 
              withArrow
              position="top"
            >
              <ActionIcon 
                variant="subtle"
                color="blue"
                component="a" 
                href={getValidPermalink()}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
              >
                <IconExternalLink size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Stack>
    </Card>
  );
};

export default RedditPost; 