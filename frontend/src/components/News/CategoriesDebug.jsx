import React from 'react';
import { Box, Button, Text, Title, Code, Paper, Stack } from '@mantine/core';

/**
 * Debug page for X feed categories
 * This page helps diagnose issues with missing categories
 */
const CategoriesDebug = () => {
  // Get categories from localStorage
  const getCategories = () => {
    try {
      const categories = localStorage.getItem('x_social_feed_categories');
      return categories ? JSON.parse(categories) : null;
    } catch (error) {
      console.error('Error parsing categories:', error);
      return null;
    }
  };

  // Reset categories to default
  const resetCategories = () => {
    const defaultCategories = [
      { id: 'crypto', name: 'Crypto', isActive: true },
      { id: 'tech', name: 'Tech', isActive: true },
      { id: 'finance', name: 'Finance', isActive: true },
      { id: 'nft', name: 'NFT', isActive: true }
    ];
    
    localStorage.setItem('x_social_feed_categories', JSON.stringify(defaultCategories));
    alert('Categories have been reset to default values. Please refresh the page.');
  };

  // Clear localStorage entirely
  const clearLocalStorage = () => {
    if (window.confirm('This will clear ALL localStorage data. Continue?')) {
      localStorage.clear();
      alert('All localStorage data has been cleared. Please refresh the page.');
    }
  };

  const categories = getCategories();

  return (
    <Paper p="xl" shadow="md" radius="md" withBorder>
      <Title order={3} mb="md">X Feed Categories Debug</Title>
      
      <Stack spacing="lg">
        <Box>
          <Text weight={500} mb="xs">Current categories in localStorage:</Text>
          <Code block style={{ maxHeight: '200px', overflow: 'auto' }}>
            {categories ? JSON.stringify(categories, null, 2) : 'No categories found'}
          </Code>
        </Box>
        
        <Box>
          <Text weight={500} mb="xs">Fix Options:</Text>
          
          <Stack spacing="sm">
            <Button 
              color="blue" 
              onClick={resetCategories}
              disabled={!categories}
            >
              Reset Categories to Default
            </Button>
            
            <Button 
              color="red" 
              variant="outline" 
              onClick={clearLocalStorage}
            >
              Clear All LocalStorage Data
            </Button>
          </Stack>
        </Box>
        
        <Text size="sm" color="dimmed">
          If you're experiencing issues with categories not showing up, try the "Reset Categories" button.
          This will restore the default categories without affecting other data. If problems persist,
          the "Clear All LocalStorage" button will reset everything, but you'll lose all saved accounts and settings.
        </Text>
      </Stack>
    </Paper>
  );
};

export default CategoriesDebug; 