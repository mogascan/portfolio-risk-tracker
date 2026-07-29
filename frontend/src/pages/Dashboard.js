// frontend/src/pages/Dashboard.js
import React, { useEffect } from 'react';
import { Grid, Box, Paper, Title, useMantineColorScheme, useMantineTheme, Stack } from '@mantine/core';
import DashboardSummary from '../components/Portfolio/DashboardSummary';
import DashboardPerformanceChart from '../components/Portfolio/DashboardPerformanceChart';
import ChatInterface from '../components/AI/ChatInterface';
import InsightsPanel from '../components/AI/InsightsPanel';
import NewsFeed from '../components/News/NewsFeed';
import { usePortfolio } from '../contexts/PortfolioContext';
function Dashboard() {
  const { portfolio } = usePortfolio();
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Get theme-appropriate colors
  const cardBgColor = isDark ? theme.colors.dark[6] : 'white';
  const textColor = isDark ? theme.white : theme.black;
  
  // Debug log portfolio data
  useEffect(() => {
    console.log("Portfolio data:", {
      hasData: portfolio && portfolio.totalValue > 0 && portfolio.entryValue > 0,
      totalValue: portfolio?.totalValue,
      entryValue: portfolio?.entryValue,
      assets: portfolio?.assets?.length
    });
  }, [portfolio]);
  
  // Main component render
  return (
    <Box p="md">
      {/* First row with Total Value, AI Assistant, Performance Chart, and Insights */}
      <Grid gutter="md" mb="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <DashboardSummary />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 5 }} order={{ base: 3, md: 2 }}>
          {/* AI Assistant */}
          <Stack gap="md" h={735}>
            <Paper 
              p="md" 
              shadow="none" 
              withBorder={false} 
              style={{ 
                backgroundColor: cardBgColor, 
                flex: 1,
              }}
            >
              <ChatInterface />
            </Paper>
          </Stack>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 3 }} order={{ base: 2, md: 3 }}>
          <Stack gap="md" h={735}>
            {/* Performance Chart */}
            <Paper 
              p="md" 
              shadow="sm" 
              withBorder 
              style={{ backgroundColor: cardBgColor, flex: 1 }}
            >
              <Title order={3} mb="md" style={{ color: textColor }}>
                Performance
              </Title>
              <DashboardPerformanceChart />
            </Paper>
            
            {/* AI Insights */}
            <Paper 
              p="md" 
              shadow="sm" 
              withBorder 
              style={{ backgroundColor: cardBgColor, flex: 1 }}
            >
              <Title order={3} mb="md" style={{ color: textColor }}>
                AI Insights
              </Title>
              <InsightsPanel />
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
      
      {/* Second row with News feed */}
      <Grid gutter="md">
        <Grid.Col span={12}>
          <Paper p="md" shadow="sm" withBorder style={{ backgroundColor: cardBgColor }}>
            <Title order={3} mb="md" style={{ color: textColor }}>
              Latest News
            </Title>
            <NewsFeed />
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

export default Dashboard;