import React, { useState } from 'react';
import { Title, Text, Paper, Grid, Card, Badge, Select, Tabs, Rating, Group, Divider, List, ThemeIcon, Space } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';

export const LeadershipAnalysis = () => {
  const [selectedPattern, setSelectedPattern] = useState(null);

  const leadershipPatterns = [
    {
      id: 1,
      pattern: "Decisive Intervention",
      description: "Quick, decisive action taken to stabilize financial systems during crisis.",
      example: "Ben Bernanke (Fed) during 2008: Implemented unconventional monetary policy tools including quantitative easing and emergency lending facilities.",
      lessonsLearned: "Speed matters in crisis response; decisive action can prevent worst-case scenarios; creativity in policy tools is essential when conventional approaches fail."
    },
    {
      id: 2,
      pattern: "Coordinated Global Response",
      description: "International coordination among central banks and finance ministries.",
      example: "2008-2009: Coordinated interest rate cuts and swap lines by major central banks (Fed, ECB, BoE, BoJ).",
      lessonsLearned: "Financial crises require coordinated responses in interconnected global markets; coordination prevents regulatory arbitrage and competitive devaluations."
    },
    {
      id: 3,
      pattern: "Transparent Communication",
      description: "Clear, consistent messaging to restore confidence and reduce uncertainty.",
      example: "Mario Draghi (ECB, 2012): 'Whatever it takes' speech that calmed Eurozone crisis without spending a euro.",
      lessonsLearned: "Words can be as powerful as actions; consistency and clarity in messaging reduces market uncertainty; transparency builds credibility."
    },
    {
      id: 4,
      pattern: "Balancing Moral Hazard",
      description: "Addressing immediate crisis while minimizing future risk-taking incentives.",
      example: "Hank Paulson (Treasury) during 2008: Allowed Lehman Brothers to fail but rescued AIG days later.",
      lessonsLearned: "Inconsistent approaches can exacerbate panic; clear principles for intervention are needed; some moral hazard may be unavoidable during acute crisis phases."
    },
    {
      id: 5,
      pattern: "Political Independence",
      description: "Maintaining central bank and regulatory independence during political pressure.",
      example: "Paul Volcker (Fed, 1980s): Maintained tight monetary policy despite political criticism.",
      lessonsLearned: "Long-term financial stability sometimes requires short-term political courage; independence from political cycles enables consistent policy application."
    },
    {
      id: 6,
      pattern: "Adaptive Learning",
      description: "Adjusting approach as new information emerges during crisis.",
      example: "Janet Yellen (Fed): Adjusted pace of interest rate normalization based on evolving economic data post-2008.",
      lessonsLearned: "Rigid adherence to pre-crisis models can exacerbate problems; flexibility and willingness to adjust course are crucial; data-driven responses improve outcomes."
    }
  ];

  const successFactors = [
    {
      factor: "Speed of Response",
      description: "How quickly decisive action is taken after crisis recognition",
      effectiveness: 5,
      example: "Fed's weekend emergency actions in March 2020 (COVID) vs. delayed responses during Great Depression"
    },
    {
      factor: "Communication Clarity",
      description: "Transparency and consistency of messaging to markets and public",
      effectiveness: 4,
      example: "Forward guidance and press conferences following FOMC meetings post-2008"
    },
    {
      factor: "Coordination",
      description: "Alignment between monetary, fiscal, and regulatory responses",
      effectiveness: 4,
      example: "G20 response to 2008 crisis with coordinated fiscal stimulus and monetary easing"
    },
    {
      factor: "Political Independence",
      description: "Ability to implement necessary but unpopular measures",
      effectiveness: 5,
      example: "ECB's Outright Monetary Transactions program despite German opposition"
    },
    {
      factor: "Flexibility",
      description: "Willingness to abandon conventional approaches when necessary",
      effectiveness: 4,
      example: "Bank of Japan's yield curve control versus traditional interest rate targeting"
    },
    {
      factor: "Public Trust",
      description: "Credibility of leadership with markets and general public",
      effectiveness: 5,
      example: "Paul Volcker's inflation fighting credibility and market confidence"
    },
    {
      factor: "Crisis Preparation",
      description: "Pre-crisis readiness with established protocols and scenarios",
      effectiveness: 3,
      example: "Bank stress tests and living wills implemented after 2008"
    },
    {
      factor: "Decision Architecture",
      description: "Structures that enable rapid but deliberative decision-making",
      effectiveness: 4,
      example: "FOMC structure balancing regional inputs with centralized authority"
    },
    {
      factor: "Communication Strategy",
      description: "Multi-channel approach to inform different stakeholders",
      effectiveness: 3,
      example: "Fed's expanded communication tools including social media and simplified explainers"
    },
    {
      factor: "Psychological Resilience",
      description: "Leadership capacity to maintain judgment under extreme pressure",
      effectiveness: 4,
      example: "Tim Geithner's calm during 2008 despite public criticism and market panic"
    }
  ];

  const handlePatternSelect = (pattern) => {
    setSelectedPattern(pattern);
  };

  return (
    <Paper p="md" radius="md" withBorder>
      <Title order={2} align="center" mb="lg">Leadership During Financial Crises</Title>
      
      <Tabs defaultValue="patterns">
        <Tabs.List>
          <Tabs.Tab value="patterns">Leadership Patterns</Tabs.Tab>
          <Tabs.Tab value="factors">Success Factors</Tabs.Tab>
          <Tabs.Tab value="implications">Leadership Implications</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="patterns" pt="md">
          <Grid>
            <Grid.Col span={selectedPattern ? 7 : 12}>
              <Grid>
                {leadershipPatterns.map(pattern => (
                  <Grid.Col span={selectedPattern ? 6 : 4} key={pattern.id}>
                    <Card 
                      shadow="sm" 
                      padding="lg" 
                      radius="md" 
                      withBorder
                      onClick={() => handlePatternSelect(pattern)}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedPattern?.id === pattern.id ? '#f0f9ff' : 'white'
                      }}
                    >
                      <Title order={4}>{pattern.pattern}</Title>
                      <Text size="sm" color="dimmed" mt="xs">{pattern.description}</Text>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            </Grid.Col>

            {selectedPattern && (
              <Grid.Col span={5}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Title order={3}>{selectedPattern.pattern}</Title>
                  <Text mt="md" mb="md">{selectedPattern.description}</Text>
                  
                  <Divider my="sm" />
                  
                  <Title order={5}>Historical Example</Title>
                  <Text size="sm" mt="xs">{selectedPattern.example}</Text>
                  
                  <Title order={5} mt="md">Key Lessons</Title>
                  <Text size="sm" mt="xs">{selectedPattern.lessonsLearned}</Text>
                </Card>
              </Grid.Col>
            )}
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="factors" pt="md">
          <Grid>
            {successFactors.map((factor, index) => (
              <Grid.Col span={6} key={index}>
                <Card shadow="sm" padding="md" radius="md" withBorder>
                  <Group position="apart" mb="xs">
                    <Title order={4}>{factor.factor}</Title>
                    <Rating value={factor.effectiveness} readOnly />
                  </Group>
                  <Text size="sm" color="dimmed" mb="md">{factor.description}</Text>
                  <Divider my="xs" />
                  <Text size="sm" italic>Example: {factor.example}</Text>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="implications" pt="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md">Key Implications for Crisis Leadership</Title>
            
            <List 
              spacing="lg"
              icon={
                <ThemeIcon color="blue" size={24} radius="xl">
                  <IconCircleCheck size="1rem" />
                </ThemeIcon>
              }
            >
              <List.Item>
                <Text weight={700}>Pre-Crisis Preparation</Text>
                <Text size="sm">Leaders who invest in scenario planning, stress testing, and relationship building before crises emerge demonstrate better decision-making under pressure.</Text>
              </List.Item>
              
              <List.Item>
                <Text weight={700}>Balancing Deliberation and Speed</Text>
                <Text size="sm">Successful crisis leadership requires mechanisms that allow for rapid decision-making without sacrificing necessary deliberation and expertise evaluation.</Text>
              </List.Item>
              
              <List.Item>
                <Text weight={700}>Communication as Strategy</Text>
                <Text size="sm">Strategic communication is not merely explaining decisions, but an active intervention tool that can restore confidence and reduce uncertainty.</Text>
              </List.Item>
              
              <List.Item>
                <Text weight={700}>Psychological Resilience</Text>
                <Text size="sm">The psychological pressure of crisis decision-making requires leaders to develop specific resilience practices and support structures.</Text>
              </List.Item>
              
              <List.Item>
                <Text weight={700}>Learning Systems</Text>
                <Text size="sm">Building continuous learning capabilities allows for mid-crisis adaptation and improvements to future crisis response.</Text>
              </List.Item>
            </List>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
};

export default LeadershipAnalysis; 