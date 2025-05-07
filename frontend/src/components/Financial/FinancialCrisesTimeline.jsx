import React, { useState } from 'react';
import { IconClock, IconChartBar, IconUsers, IconHistory } from '@tabler/icons-react';
import { Group, Text, Paper, Title, Button, Container } from '@mantine/core';
import StrategicTimelineComponent from '../StrategicTimeline/StrategicTimelineComponent';

const FinancialCrisesTimeline = () => {
  const [activeTab, setActiveTab] = useState('timeline');

  // Placeholder component for the Leadership Analysis tab
  const LeadershipCrises = () => (
    <div className="p-6">
      <Paper p="xl">
        <Title order={2} mb="md">Leadership During Financial Crises</Title>
        <Text mb="lg">This section analyzes leadership responses during various financial crises throughout history.</Text>
        
        <div style={{ background: 'var(--mantine-color-blue-0)', padding: '1rem', borderRadius: '0.5rem' }}>
          <Text size="sm">A complete implementation would show the interactive tabs, crisis cards, and leadership analysis.</Text>
        </div>
      </Paper>
    </div>
  );

  return (
    <Container size="xl" px="xs">
      <Title order={2} mb="md">Centuries of Financial Crises</Title>
      <Text color="dimmed" mb="xl">Analyzing historical patterns of crisis, innovation, and leadership responses</Text>
      
      {/* Dashboard Navigation */}
      <Paper p="md" withBorder mb="xl">
        <Group>
          <Button
            onClick={() => setActiveTab('timeline')}
            variant={activeTab === 'timeline' ? 'filled' : 'light'}
            leftIcon={<IconClock size={16} />}
          >
            Strategic Timeline
          </Button>
          <Button
            onClick={() => setActiveTab('leadership')}
            variant={activeTab === 'leadership' ? 'filled' : 'light'}
            leftIcon={<IconUsers size={16} />}
          >
            Leadership Analysis
          </Button>
          <Button
            onClick={() => setActiveTab('combined')}
            variant={activeTab === 'combined' ? 'filled' : 'light'}
            leftIcon={<IconChartBar size={16} />}
          >
            Comprehensive View
          </Button>
        </Group>
      </Paper>
      
      {/* Dashboard Content */}
      {activeTab === 'timeline' && (
        <Paper p="md" withBorder>
          <StrategicTimelineComponent />
        </Paper>
      )}

      {activeTab === 'leadership' && (
        <Paper p="md" withBorder>
          <LeadershipCrises />
        </Paper>
      )}

      {activeTab === 'combined' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Introduction */}
          <Paper p="xl" withBorder>
            <Title order={3} mb="md" style={{ display: 'flex', alignItems: 'center' }}>
              <IconHistory style={{ marginRight: '0.75rem' }} size={20} />
              Integrated Crisis Analysis
            </Title>
            <Text mb="lg">
              This comprehensive view combines our analysis of historical financial crises with the leadership contexts that surrounded them. By examining both the patterns of crisis cycles and the governance structures in place during each event, we can extract valuable insights about the relationship between leadership decisions and economic outcomes.
            </Text>
            <Paper p="md" withBorder style={{ background: 'var(--mantine-color-blue-0)' }}>
              <Title order={4} mb="md" color="blue">Key Historical Observations</Title>
              <ol style={{ paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Text>Financial crises occur in every governance system but leadership responses have evolved from minimal to extensive intervention over centuries.</Text>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Text>The average time between major crises (~25 years) suggests we are approaching another potential instability point in the financial system.</Text>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Text>Innovations are accelerating (~15 years between major breakthroughs) while policy and regulatory frameworks struggle to adapt at the same pace.</Text>
                </li>
                <li>
                  <Text>Leadership effectiveness during crises is not primarily determined by governance structure, but by decisiveness, timing, and willingness to implement necessary reforms.</Text>
                </li>
              </ol>
            </Paper>
          </Paper>

          {/* Combined View */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Paper p="xl" withBorder>
              <Title order={4} mb="md">Crisis Timeline Highlights</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderLeft: '4px solid var(--mantine-color-red-6)', paddingLeft: '1rem' }}>
                  <Title order={5}>1720: South Sea Bubble</Title>
                  <Text size="sm">First major speculative bubble under King George I's constitutional monarchy. Minimal government intervention.</Text>
                </div>
                <div style={{ borderLeft: '4px solid var(--mantine-color-red-6)', paddingLeft: '1rem' }}>
                  <Title order={5}>1929: Great Depression</Title>
                  <Text size="sm">Catastrophic market crash under President Hoover. Limited intervention initially, followed by FDR's expansive New Deal.</Text>
                </div>
                <div style={{ borderLeft: '4px solid var(--mantine-color-red-6)', paddingLeft: '1rem' }}>
                  <Title order={5}>2008: Global Financial Crisis</Title>
                  <Text size="sm">Systemic banking collapse under President Bush. Massive government intervention with bailouts and monetary policy.</Text>
                </div>
              </div>
            </Paper>
            
            <Paper p="xl" withBorder>
              <Title order={4} mb="md">Leadership Pattern Highlights</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderLeft: '4px solid var(--mantine-color-blue-6)', paddingLeft: '1rem' }}>
                  <Title order={5}>Minimal Intervention Era (1700s-1800s)</Title>
                  <Text size="sm">Crises were allowed to run their course with limited government response. Market forces determined outcomes.</Text>
                </div>
                <div style={{ borderLeft: '4px solid var(--mantine-color-blue-6)', paddingLeft: '1rem' }}>
                  <Title order={5}>Regulatory Development Era (1900s)</Title>
                  <Text size="sm">Creation of central banks, financial regulations, and economic stabilization mechanisms in response to crises.</Text>
                </div>
                <div style={{ borderLeft: '4px solid var(--mantine-color-blue-6)', paddingLeft: '1rem' }}>
                  <Title order={5}>Global Coordination Era (2000s-Present)</Title>
                  <Text size="sm">International cooperation, massive liquidity provision, and unprecedented fiscal responses to financial instability.</Text>
                </div>
              </div>
            </Paper>
          </div>
          
          {/* Strategic Implications */}
          <Paper p="xl" withBorder>
            <Title order={3} mb="md">Strategic Implications for Today</Title>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Paper p="md" withBorder style={{ background: 'var(--mantine-color-orange-0)' }}>
                <Title order={5} color="orange" mb="sm">Crisis Preparation</Title>
                <Text size="sm">
                  Historical cycles suggest preparing for financial instability within the next decade. High debt levels, inflation concerns, and geopolitical tensions mirror patterns seen before previous crises.
                </Text>
              </Paper>
              
              <Paper p="md" withBorder style={{ background: 'var(--mantine-color-green-0)' }}>
                <Title order={5} color="green" mb="sm">Innovation Opportunities</Title>
                <Text size="sm">
                  Accelerating innovation cycles create significant opportunities as AI, clean tech, and biotech revolutions converge. Each crisis historically creates space for transformative innovations.
                </Text>
              </Paper>
              
              <Paper p="md" withBorder style={{ background: 'var(--mantine-color-blue-0)' }}>
                <Title order={5} color="blue" mb="sm">Governance Insights</Title>
                <Text size="sm">
                  Leadership effectiveness during crises depends more on decisiveness and adaptability than on governance structure. Political constraints often prevent optimal crisis response.
                </Text>
              </Paper>
              
              <Paper p="md" withBorder style={{ background: 'var(--mantine-color-violet-0)' }}>
                <Title order={5} color="violet" mb="sm">Think Tank Role</Title>
                <Text size="sm">
                  Multidisciplinary analysis combining historical patterns, leadership context, and technological change provides crucial strategic advantage in navigating the 2020s convergence zone.
                </Text>
              </Paper>
            </div>
          </Paper>
        </div>
      )}
    </Container>
  );
};

export default FinancialCrisesTimeline; 