import React from 'react';
import { Box, Group, Avatar, Text, ActionIcon, Image, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { IconHeart, IconMessageCircle, IconRepeat } from '@tabler/icons-react';

/**
 * XTweet component for displaying a tweet
 * @param {Object} props
 * @param {Object} props.tweet - Tweet data
 * @param {Object} props.account - Account data
 * @param {Object} props.theme - Mantine theme
 */
const XTweet = ({ tweet, account, theme }) => {
  // Get the current color scheme
  const { colorScheme } = useMantineColorScheme();
  const mantineTheme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Format the date nicely
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      // If invalid date, return original string
      if (isNaN(date.getTime())) return dateString;
      
      // Check if it's today
      const today = new Date();
      const isToday = date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // Check if it's yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.getDate() === yesterday.getDate() &&
                          date.getMonth() === yesterday.getMonth() &&
                          date.getFullYear() === yesterday.getFullYear();
                          
      if (isYesterday) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // Otherwise, show full date
      return date.toLocaleDateString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };
  
  const accountInfo = account || {
    name: 'Unknown',
    handle: '@unknown',
    verified: false
  };
  
  // Get theme-appropriate colors for the tweet to match NewsCard styling
  const backgroundColor = isDark ? '#1E1E1E' : 'white';
  const borderColor = isDark ? '#2C2C2C' : mantineTheme.colors.gray[3] || '#e9ecef';
  
  return (
    <Box 
      mb={15} 
      p={12} 
      style={{ 
        border: `1px solid ${borderColor} !important`,
        borderRadius: '8px',
        marginBottom: '8px',
        backgroundColor: backgroundColor
      }}
    >
      <Group mb={8}>
        <Avatar 
          src={tweet.profileImg} 
          radius="xl" 
          size="md"
          alt={accountInfo.name}
        />
        <Box style={{ flex: 1 }}>
          <Group position="apart">
            <Text weight={500} size="sm" c={isDark ? '#EAEAEA' : 'black'}>
              {accountInfo.name} 
              {accountInfo.verified && (
                <Text component="span" ml={4} style={{ color: '#1DA1F2' }}>✓</Text>
              )}
            </Text>
            <Text size="xs" color="dimmed">
              {formatDate(tweet.date)}
            </Text>
          </Group>
          <Text size="xs" color="dimmed">{accountInfo.handle}</Text>
        </Box>
      </Group>
      
      <Text size="sm" mb={10} style={{ whiteSpace: 'pre-wrap' }} c={isDark ? '#AAAAAA' : 'black'}>
        {tweet.text}
      </Text>
      
      {tweet.media && tweet.media.length > 0 && (
        <Box mb={10}>
          {tweet.media.map((media, index) => (
            <Image 
              key={index}
              src={media.url}
              alt="Tweet media"
              radius="md"
              style={{ 
                maxHeight: 300,
                maxWidth: '100%'
              }}
            />
          ))}
        </Box>
      )}
      
      <Group spacing={25} mt={8}>
        <Group spacing={6}>
          <ActionIcon 
            size="sm" 
            variant="subtle" 
            radius="xl"
            color="red"
          >
            <IconHeart size={16} />
          </ActionIcon>
          <Text size="xs" color="dimmed">{tweet.likes || 0}</Text>
        </Group>
        
        <Group spacing={6}>
          <ActionIcon 
            size="sm" 
            variant="subtle" 
            radius="xl"
            color="blue"
          >
            <IconMessageCircle size={16} />
          </ActionIcon>
          <Text size="xs" color="dimmed">{tweet.comments || 0}</Text>
        </Group>
        
        <Group spacing={6}>
          <ActionIcon 
            size="sm" 
            variant="subtle" 
            radius="xl"
            color="green"
          >
            <IconRepeat size={16} />
          </ActionIcon>
          <Text size="xs" color="dimmed">{tweet.retweets || 0}</Text>
        </Group>
      </Group>
    </Box>
  );
};

export default XTweet; 