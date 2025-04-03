import React from 'react';
import { Box, Container, Title, Space } from '@mantine/core';
import NewsFeed from '../components/News/NewsFeed';

function News() {
  return (
    <Container size="xl" px="xs">
      <Title order={1} mb="md">News</Title>
      <Space h="md" />
      <Box>
        <NewsFeed />
      </Box>
    </Container>
  );
}

export default News; 