import React from 'react';
import { Box, Title, Text, Grid, Center, Tabs } from '@mantine/core';
import { useBookmarks } from '../contexts/BookmarkContext';
import NewsCard from '../components/News/NewsCard';

function Bookmarks() {
  const { bookmarks } = useBookmarks();
  
  // Helper function to safely check if ID starts with a prefix
  const idStartsWith = (id, prefix) => {
    // Convert id to string if it's not already
    const strId = String(id);
    return strId.startsWith(prefix);
  };
  
  // Group bookmarks by type
  const cryptoBookmarks = bookmarks.filter(item => 
    idStartsWith(item.id, 'crypto-') || idStartsWith(item.id, 'portfolio-')
  );
  
  const macroBookmarks = bookmarks.filter(item => 
    idStartsWith(item.id, 'us-') || idStartsWith(item.id, 'global-') || idStartsWith(item.id, 'tech-')
  );
  
  const socialBookmarks = bookmarks.filter(item => 
    idStartsWith(item.id, 'social-')
  );

  return (
    <Box p="md">
      <Title order={2} mb="xl">Bookmarked Research</Title>
      
      {bookmarks.length === 0 ? (
        <Center h={300}>
          <Text c="dimmed">No bookmarks yet. Save items from the News & Research section.</Text>
        </Center>
      ) : (
        <Tabs defaultValue="all">
          <Tabs.List mb="md">
            <Tabs.Tab value="all">All Bookmarks ({bookmarks.length})</Tabs.Tab>
            <Tabs.Tab value="crypto">Crypto News ({cryptoBookmarks.length})</Tabs.Tab>
            <Tabs.Tab value="macro">Macro News ({macroBookmarks.length})</Tabs.Tab>
            <Tabs.Tab value="social">Social Posts ({socialBookmarks.length})</Tabs.Tab>
          </Tabs.List>
          
          <Tabs.Panel value="all">
            <Grid>
              {bookmarks.map(item => (
                <Grid.Col span={4} key={item.id}>
                  <NewsCard item={item} />
                </Grid.Col>
              ))}
            </Grid>
          </Tabs.Panel>
          
          <Tabs.Panel value="crypto">
            <Grid>
              {cryptoBookmarks.map(item => (
                <Grid.Col span={4} key={item.id}>
                  <NewsCard item={item} />
                </Grid.Col>
              ))}
            </Grid>
          </Tabs.Panel>
          
          <Tabs.Panel value="macro">
            <Grid>
              {macroBookmarks.map(item => (
                <Grid.Col span={4} key={item.id}>
                  <NewsCard item={item} />
                </Grid.Col>
              ))}
            </Grid>
          </Tabs.Panel>
          
          <Tabs.Panel value="social">
            <Grid>
              {socialBookmarks.map(item => (
                <Grid.Col span={4} key={item.id}>
                  <NewsCard item={item} />
                </Grid.Col>
              ))}
            </Grid>
          </Tabs.Panel>
        </Tabs>
      )}
    </Box>
  );
}

export default Bookmarks; 