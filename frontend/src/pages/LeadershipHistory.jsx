import React from 'react';
import { Container, Title, Paper } from '@mantine/core';
import LeadershipHistory from '../components/Financial/LeadershipHistory';

const LeadershipHistoryPage = () => {
  return (
    <Container fluid>
      <Title order={2} mb="lg">Financial Leadership Throughout History</Title>
      <Paper p="md" withBorder shadow="sm" mb="xl">
        <LeadershipHistory />
      </Paper>
    </Container>
  );
};

export default LeadershipHistoryPage; 