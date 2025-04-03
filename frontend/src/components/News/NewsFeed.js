import React from 'react';
import { Grid, Box, Title, Divider, Paper, useMantineTheme, Group } from '@mantine/core';
import CryptoNewsFeed from './CryptoNewsFeed';
import MacroNewsFeed from './MacroNewsFeed';
import RedditFeedContainer from './RedditFeedContainer';

function NewsFeed() {
  const theme = useMantineTheme();
  
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
              minHeight: '500px',
              backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white
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
              minHeight: '500px',
              backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white
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
              minHeight: '500px',
              backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white
            }}
          >
            <RedditFeedContainer />
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

export default NewsFeed; 