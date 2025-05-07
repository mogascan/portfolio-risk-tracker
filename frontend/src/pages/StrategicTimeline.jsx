import React from 'react';
import { Container, Title, Paper, Space, Divider } from '@mantine/core';
import StrategicTimelineComponent from '../components/StrategicTimeline/StrategicTimelineComponent';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import CrisesTimeline from '../components/Financial/CrisesTimeline';
import LeadershipCrises from '../components/Financial/LeadershipCrises';

const StrategicTimeline = () => {
  return (
    <Container fluid>
      <Title order={2} mb="lg">Strategic Timeline</Title>
      <Paper p="md" withBorder shadow="sm" mb="xl">
        <StrategicTimelineComponent />
      </Paper>
      
      {/* Financial Crises Timeline */}
      <Title order={2} mb="lg" mt="xl">Financial Crises Timeline</Title>
      <Paper p="md" withBorder shadow="sm" mb="xl">
        <CrisesTimeline />
      </Paper>
      
      {/* Leadership Crises Analysis */}
      <Title order={2} mb="lg" mt="xl">Leadership During Financial Crises</Title>
      <Paper p="md" withBorder shadow="sm" mb="xl">
        <LeadershipCrises />
      </Paper>
    </Container>
  );
};

export default StrategicTimeline; 