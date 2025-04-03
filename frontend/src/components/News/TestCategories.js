import React, { useEffect } from 'react';
import { Box, Title, Text, Button } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';

const TestCategories = () => {
  const [categories, setCategories] = useLocalStorage({
    key: 'x_social_feed_categories',
    defaultValue: [
      { id: 'crypto', name: 'Crypto', isActive: true },
      { id: 'tech', name: 'Tech', isActive: true },
      { id: 'finance', name: 'Finance', isActive: true },
      { id: 'nft', name: 'NFT', isActive: true }
    ]
  });

  useEffect(() => {
    console.log('Current categories:', categories);
  }, [categories]);

  const resetCategories = () => {
    setCategories([
      { id: 'crypto', name: 'Crypto', isActive: true },
      { id: 'tech', name: 'Tech', isActive: true },
      { id: 'finance', name: 'Finance', isActive: true },
      { id: 'nft', name: 'NFT', isActive: true }
    ]);
  };

  return (
    <Box p="md">
      <Title order={3} mb="md">Category Test</Title>
      
      <Text mb="xs">Current Categories in Local Storage:</Text>
      <Box 
        p="sm" 
        mb="md" 
        style={{ 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px',
          maxHeight: '200px',
          overflow: 'auto'
        }}
      >
        <pre>{JSON.stringify(categories, null, 2)}</pre>
      </Box>
      
      <Button onClick={resetCategories} color="blue" mb="md">
        Reset Categories to Default
      </Button>
      
      <Text size="sm" color="dimmed">
        Note: This will reset the categories to the default list.
        If you're experiencing issues with categories not showing up,
        click the button above to restore the defaults.
      </Text>
    </Box>
  );
};

export default TestCategories; 