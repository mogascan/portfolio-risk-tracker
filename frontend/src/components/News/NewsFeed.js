import React from 'react';
import { Grid, Box, Title, Divider, Paper, useMantineTheme, useMantineColorScheme, Group } from '@mantine/core';
import CryptoNewsFeed from './CryptoNewsFeed';
import MacroNewsFeed from './MacroNewsFeed';
import RedditFeedContainer from './RedditFeedContainer';

function NewsFeed() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <Box>
      <Group position="apart" mb="md">
        <Title order={3}>News & Research Feeds</Title>
      </Group>
      
      <Divider mb="xl" />
      
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Paper 
            p="md" 
            radius="md" 
            shadow="sm"
            style={{ 
              height: '100%',
              minHeight: '1100px',
              backgroundColor: isDark ? theme.colors.dark[6] : theme.white,
              overflow: 'hidden'
            }}
          >
            <CryptoNewsFeed />
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Paper 
            p="md" 
            radius="md" 
            shadow="sm"
            style={{ 
              height: '100%',
              minHeight: '1100px',
              backgroundColor: isDark ? theme.colors.dark[6] : theme.white,
              overflow: 'hidden'
            }}
          >
            <MacroNewsFeed />
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <Paper 
            p="md" 
            radius="md" 
            shadow="sm"
            style={{ 
              height: '100%',
              minHeight: '1100px', 
              backgroundColor: isDark ? theme.colors.dark[6] : theme.white,
              overflow: 'hidden'
            }}
          >
            <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Title order={4} mb="md">Social Media</Title>
              <Box style={{ flex: 1, overflow: 'hidden' }}>
                <RedditFeedContainer />
              </Box>
            </Box>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

export default NewsFeed; 