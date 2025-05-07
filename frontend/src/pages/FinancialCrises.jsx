import React from 'react';
import { Container, Title, Paper, Space, Divider } from '@mantine/core';
import IntegratedDashboard from '../components/Financial/IntegratedDashboard';
import LeadershipHistory from '../components/Financial/LeadershipHistory';
import { AppProvider } from '../components/Financial/AppContext';

const FinancialCrises = () => {
  return (
    <AppProvider>
      <Container fluid>
        <Title order={2} mb="lg">Financial Crises Analysis</Title>
        <Paper p="md" withBorder shadow="sm" mb="xl">
          <IntegratedDashboard />
        </Paper>
        
        {/* Leadership Throughout History */}
        <Title order={2} mb="lg" mt="xl">Financial Leadership Throughout History</Title>
        <Paper p="md" withBorder shadow="sm" mb="xl">
          <LeadershipHistory />
        </Paper>
      </Container>
    </AppProvider>
  );
};

export default FinancialCrises; 