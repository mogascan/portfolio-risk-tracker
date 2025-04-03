import React, { useEffect, useState } from 'react';
import { Box, Paper, Title, Text, Button, Stack, Group, Divider, Code, Alert, List } from '@mantine/core';
import CategoriesDebug from './CategoriesDebug';
import XApiService from './xApiService';

/**
 * This page is designed to help fix issues with categories in the X Social Feed
 */
const FixCategoriesPage = () => {
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestError, setApiTestError] = useState(null);
  const [envVarsStatus, setEnvVarsStatus] = useState({});
  
  // Check environment variables on component mount
  useEffect(() => {
    const variables = {
      BEARER_TOKEN: process.env.REACT_APP_X_BEARER_TOKEN ? '✓ SET' : '✗ NOT SET',
      API_KEY: process.env.REACT_APP_X_API_KEY ? '✓ SET' : '✗ NOT SET',
      API_SECRET: process.env.REACT_APP_X_API_SECRET ? '✓ SET' : '✗ NOT SET',
      ACCESS_TOKEN: process.env.REACT_APP_X_ACCESS_TOKEN ? '✓ SET' : '✗ NOT SET',
      ACCESS_SECRET: process.env.REACT_APP_X_ACCESS_SECRET ? '✓ SET' : '✗ NOT SET'
    };
    setEnvVarsStatus(variables);
  }, []);
  
  // Function to force clear and reset categories
  const forceResetCategories = () => {
    try {
      // Define default categories
      const defaultCategories = [
        { id: 'crypto', name: 'Crypto', isActive: true },
        { id: 'tech', name: 'Tech', isActive: true },
        { id: 'finance', name: 'Finance', isActive: true },
        { id: 'nft', name: 'NFT', isActive: true }
      ];
      
      // Set default categories directly
      localStorage.setItem('x_social_feed_categories', JSON.stringify(defaultCategories));
      
      // Alert success
      alert('Categories have been reset to default values. Please refresh the page or go back to the social feed.');
    } catch (error) {
      console.error('Error resetting categories:', error);
      alert('Error resetting categories: ' + error.message);
    }
  };
  
  // Function to test API connectivity
  const testApiConnection = async () => {
    try {
      setApiTestResult(null);
      setApiTestError(null);
      
      // Log the actual environment variables (partially masked for security)
      console.log('Testing with environment variables:', {
        BEARER_TOKEN: process.env.REACT_APP_X_BEARER_TOKEN ? 
          `${process.env.REACT_APP_X_BEARER_TOKEN.substring(0, 5)}...${process.env.REACT_APP_X_BEARER_TOKEN.slice(-4)}` : 'not set',
        API_KEY: process.env.REACT_APP_X_API_KEY ? 
          `${process.env.REACT_APP_X_API_KEY.substring(0, 5)}...${process.env.REACT_APP_X_API_KEY.slice(-4)}` : 'not set',
        // Mask other credentials similarly
      });
      
      const apiClient = new XApiService({
        bearerToken: process.env.REACT_APP_X_BEARER_TOKEN,
        apiKey: process.env.REACT_APP_X_API_KEY,
        apiSecret: process.env.REACT_APP_X_API_SECRET,
        accessToken: process.env.REACT_APP_X_ACCESS_TOKEN,
        accessSecret: process.env.REACT_APP_X_ACCESS_SECRET,
      });
      
      // Try to fetch a test user
      console.log('Attempting to fetch user info for @twitter');
      const result = await apiClient.getUserInfo('twitter');
      console.log('API test successful:', result);
      setApiTestResult(result);
    } catch (error) {
      console.error('API connection failed:', error);
      setApiTestError({
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config ? {
          baseURL: error.config.baseURL,
          url: error.config.url,
          method: error.config.method,
          headers: {
            contentType: error.config.headers['Content-Type'],
            hasAuthorization: !!error.config.headers['Authorization']
          }
        } : null
      });
    }
  };
  
  // Function to display environment variables
  const showEnvironmentVariables = () => {
    const variables = {
      BEARER_TOKEN: process.env.REACT_APP_X_BEARER_TOKEN ? '✓ SET' : '✗ NOT SET',
      API_KEY: process.env.REACT_APP_X_API_KEY ? '✓ SET' : '✗ NOT SET',
      API_SECRET: process.env.REACT_APP_X_API_SECRET ? '✓ SET' : '✗ NOT SET',
      ACCESS_TOKEN: process.env.REACT_APP_X_ACCESS_TOKEN ? '✓ SET' : '✗ NOT SET',
      ACCESS_SECRET: process.env.REACT_APP_X_ACCESS_SECRET ? '✓ SET' : '✗ NOT SET'
    };
    
    const formatted = Object.entries(variables)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
      
    alert('Environment Variables Status:\n\n' + formatted);
  };

  return (
    <Box p="xl">
      <Title order={1} mb="lg">Fix Social Feed Categories</Title>
      
      <Paper shadow="md" p="md" withBorder mb="xl">
        <Stack spacing="md">
          <Title order={3}>Quick Fix</Title>
          <Text>
            If you're experiencing issues with missing categories in the Social Feed, 
            click the button below to reset your categories to the default values.
          </Text>
          <Button 
            color="green" 
            size="lg" 
            onClick={forceResetCategories}
          >
            Reset Categories to Default
          </Button>
        </Stack>
      </Paper>
      
      <Paper shadow="md" p="md" withBorder mb="xl">
        <Stack spacing="md">
          <Title order={3}>API Connectivity Test</Title>
          <Text>
            Test if your API credentials are working properly. This will attempt to
            connect to the X/Twitter API and fetch information for the @twitter account.
          </Text>
          
          <Group>
            <Button 
              color="blue" 
              onClick={testApiConnection}
            >
              Test API Connection
            </Button>
            
            <Button 
              variant="outline"
              onClick={showEnvironmentVariables}
            >
              Check Environment Variables
            </Button>
          </Group>
          
          {/* Display Environment Variables Status */}
          <Box>
            <Text weight={500} mb="xs">Environment Variables Status:</Text>
            {Object.entries(envVarsStatus).map(([key, value]) => (
              <Text key={key} color={value.includes('✓') ? 'green' : 'red'} size="sm">
                {key}: {value}
              </Text>
            ))}
          </Box>
          
          {/* Display API Test Results */}
          {apiTestResult && (
            <Alert color="green" title="API Connection Successful">
              <Text mb="xs">Successfully connected to Twitter API!</Text>
              <Text size="sm">Username: {apiTestResult.username}</Text>
              <Text size="sm">Name: {apiTestResult.name}</Text>
              <Text size="sm">Followers: {apiTestResult.followersCount}</Text>
            </Alert>
          )}
          
          {/* Display API Test Errors */}
          {apiTestError && (
            <Alert color="red" title="API Connection Failed" withCloseButton={false}>
              <Stack>
                <Text>Error: {apiTestError.message}</Text>
                {apiTestError.status && (
                  <Text size="sm">Status: {apiTestError.status} ({apiTestError.statusText})</Text>
                )}
                {apiTestError.config && (
                  <Box>
                    <Text size="sm">Request Details:</Text>
                    <Code block size="xs">
                      {`${apiTestError.config.method?.toUpperCase() || 'GET'} ${apiTestError.config.baseURL}${apiTestError.config.url}
Content-Type: ${apiTestError.config.headers.contentType}
Authorization: ${apiTestError.config.headers.hasAuthorization ? 'Present' : 'Missing'}`}
                    </Code>
                  </Box>
                )}
                <Box>
                  <Text size="sm">Common Issues:</Text>
                  <List size="sm">
                    <List.Item>Invalid API credentials in .env file</List.Item>
                    <List.Item>Twitter API rate limits exceeded</List.Item>
                    <List.Item>Need to restart the development server after changing .env</List.Item>
                    <List.Item>CORS issues (if testing in a browser)</List.Item>
                  </List>
                </Box>
              </Stack>
            </Alert>
          )}
          
          <Alert color="yellow" title="Note on API Credentials">
            Make sure your environment variables are properly set in the .env file:
            <Code block mt="xs">
              REACT_APP_X_BEARER_TOKEN=your_bearer_token
              REACT_APP_X_API_KEY=your_api_key
              REACT_APP_X_API_SECRET=your_api_secret
              REACT_APP_X_ACCESS_TOKEN=your_access_token
              REACT_APP_X_ACCESS_SECRET=your_access_secret
            </Code>
          </Alert>
        </Stack>
      </Paper>
      
      <Divider my="xl" label="ADVANCED DEBUG OPTIONS" labelPosition="center" />
      
      <Title order={3} mb="md">Categories Debug Tool</Title>
      <CategoriesDebug />
      
      <Box mt="xl">
        <Title order={3} mb="md">File Name Mismatch Resolution</Title>
        <Paper shadow="sm" p="md" withBorder>
          <Stack spacing="md">
            <Group position="apart">
              <Text weight={500}>File Name and Component Name Mismatch</Text>
              <Button 
                variant="subtle" 
                compact
                component="a"
                href="/"
              >
                Go to Home
              </Button>
            </Group>
            <Text>
              We've fixed the component name in SocialFeed.js to match the file name,
              and also updated the import in XFeedContainer.jsx to reference the correct component.
              These changes should resolve any naming discrepancies that might have caused issues.
            </Text>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default FixCategoriesPage; 