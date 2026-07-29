import React, { useState } from 'react';
import { Title, Text, Paper, Grid, Card, Badge, Tabs, Timeline, Group, Divider, List, ThemeIcon, ScrollArea, Accordion } from '@mantine/core';
import { IconCircleCheck, IconHistory, IconUser, IconUsers, IconCalendarEvent, IconCrown, IconBriefcase } from '@tabler/icons-react';

const LeadershipHistory = () => {
  const [activeEra, setActiveEra] = useState("modern");
  const [selectedLeader, setSelectedLeader] = useState(null);

  // Historical leadership data
  const historicalLeaders = {
    "ancient": [
      {
        id: 1,
        name: "Croesus of Lydia",
        years: "595-546 BCE",
        country: "Kingdom of Lydia",
        achievement: "First standardized gold and silver coinage",
        context: "Introduced the world's first standardized gold and silver coins, creating a reliable medium of exchange that facilitated trade throughout the ancient Mediterranean world.",
        impact: "The introduction of standardized coinage revolutionized trade and commerce, allowing for more complex economic relationships and the accumulation of wealth beyond physical goods.",
        legacy: "Created the foundation for monetary systems that would be adopted by Greek and Roman civilizations and influence currency development for millennia.",
        leadership: "Visionary monetary innovation, standardization of value systems"
      },
      {
        id: 2,
        name: "Emperor Augustus",
        years: "27 BCE-14 CE",
        country: "Roman Empire",
        achievement: "Established the Aerarium Militare (Military Treasury)",
        context: "Created a specialized pension fund for military veterans, funded by new taxes, to ensure the stability of the Roman military system.",
        impact: "Provided economic security for veterans, reducing political unrest and creating a more loyal military force.",
        legacy: "One of the earliest examples of a state pension system and specialized treasury management.",
        leadership: "Institutional financial innovation, long-term economic planning"
      }
    ],
    "medieval": [
      {
        id: 3,
        name: "Jacques Coeur",
        years: "1395-1456",
        country: "Kingdom of France",
        achievement: "Created Early Trade Networks",
        context: "Established a vast trading network throughout the Mediterranean as a merchant, banker, and financial advisor to King Charles VII.",
        impact: "Revolutionized French international trade, particularly with the Levant, and helped finance the final phase of the Hundred Years' War.",
        legacy: "Demonstrated how private enterprise could support state finances and how international trade could be systematically organized.",
        leadership: "Financial diplomacy, trade network development, public-private financial partnership"
      },
      {
        id: 4,
        name: "Cosimo de' Medici",
        years: "1389-1464",
        country: "Republic of Florence",
        achievement: "Banking Innovation & Arts Patronage",
        context: "Expanded the Medici Bank into Europe's largest and most respected financial institution while becoming Florence's de facto political leader.",
        impact: "Developed advanced accounting methods, branch banking, and letters of credit while financing Renaissance art and architecture.",
        legacy: "Demonstrated how banking, politics, and cultural patronage could be integrated to create both profit and societal advancement.",
        leadership: "Banking innovation, cultural investment as economic development"
      }
    ],
    "early-modern": [
      {
        id: 5,
        name: "John Law",
        years: "1671-1729",
        country: "France (Scottish-born)",
        achievement: "Early Central Banking & Paper Money",
        context: "Created the Banque Générale (later Banque Royale) in France and implemented a paper money system backed by anticipated colonial revenues.",
        impact: "Temporarily restored French finances after Louis XIV's wars but created the Mississippi Bubble when the scheme collapsed.",
        legacy: "Provided important lessons about monetary policy, inflation risks, and the relationship between currency and actual economic activity.",
        leadership: "Monetary innovation, financial system design (with cautionary failures)"
      },
      {
        id: 6,
        name: "Alexander Hamilton",
        years: "1755-1804",
        country: "United States",
        achievement: "American Financial System Creation",
        context: "As first U.S. Treasury Secretary, established the federal banking system, national debt management, and tax collection systems.",
        impact: "Created financial credibility for the new nation, enabling it to borrow, trade, and develop economically despite its revolutionary origins.",
        legacy: "Designed financial institutions that balanced federal and state power while creating monetary stability.",
        leadership: "Financial institution building, national credit establishment"
      }
    ],
    "industrial": [
      {
        id: 7,
        name: "Nathan Rothschild",
        years: "1777-1836",
        country: "United Kingdom (German-born)",
        achievement: "International Banking & Government Finance",
        context: "Expanded family banking operations during the Napoleonic Wars, financing British war efforts and developing international bond markets.",
        impact: "Created new methods for international capital transfer and government debt management during wartime.",
        legacy: "Demonstrated how private banking networks could facilitate international finance and stabilize government finances during crisis.",
        leadership: "Crisis finance innovation, international capital coordination"
      },
      {
        id: 8,
        name: "J.P. Morgan",
        years: "1837-1913",
        country: "United States",
        achievement: "Private Central Banking Functions",
        context: "In the absence of a U.S. central bank, acted as lender of last resort during the Panic of 1907, coordinating private bankers to provide liquidity.",
        impact: "Prevented a financial collapse by organizing private capital to support failing institutions and restore market confidence.",
        legacy: "Demonstrated both the need for a formal central bank and how coordinated private action could temporarily substitute for it.",
        leadership: "Crisis coordination, financial stabilization through private authority"
      }
    ],
    "modern": [
      {
        id: 9,
        name: "Paul Volcker",
        years: "1979-1987 (as Fed Chair)",
        country: "United States",
        achievement: "Inflation Conquest",
        context: "Took over as Federal Reserve Chairman with U.S. inflation reaching 14%, implemented aggressive monetary tightening despite severe political pressure.",
        impact: "Successfully reduced inflation to below 3% by 1983, though at the cost of a significant recession, establishing price stability as the foundation for future growth.",
        legacy: "Restored central bank credibility and demonstrated the importance of independence from political pressures when making difficult monetary decisions.",
        leadership: "Political courage, long-term economic vision over short-term popularity"
      },
      {
        id: 10,
        name: "Raghuram Rajan",
        years: "2013-2016",
        country: "India",
        achievement: "Emerging Market Stabilization",
        context: "Took over as Reserve Bank of India Governor during the 'taper tantrum' when emerging markets faced capital flight as the Fed reduced quantitative easing.",
        impact: "Stabilized the rupee, reduced inflation, built up foreign exchange reserves, and cleaned up bad loans in the banking system.",
        legacy: "Demonstrated how sound monetary policy can protect emerging economies during global monetary shifts.",
        leadership: "Data-driven policy, institutional reform, clear communication during uncertainty"
      },
      {
        id: 11,
        name: "Janet Yellen",
        years: "2014-2018 (as Fed Chair), 2021-present (as Treasury Secretary)",
        country: "United States",
        achievement: "Post-Crisis Monetary Normalization",
        context: "Led the Federal Reserve's careful exit from quantitative easing and zero interest rate policy after the 2008 financial crisis.",
        impact: "Achieved monetary policy normalization without triggering market panic or economic downturn, using clear forward guidance and data-dependent decision-making.",
        legacy: "Established new approaches to monetary policy communication and demonstrated the importance of gradual, transparent policy shifts.",
        leadership: "Balanced risk management, clear communication, adaptive policy approach"
      }
    ]
  };

  const handleLeaderSelect = (leader) => {
    setSelectedLeader(leader);
  };

  const renderLeaderCard = (leader) => {
    return (
      <Card 
        shadow="sm" 
        padding="md" 
        radius="md" 
        withBorder
        onClick={() => handleLeaderSelect(leader)}
        style={{ 
          cursor: 'pointer',
          backgroundColor: selectedLeader?.id === leader.id ? '#f0f9ff' : 'white',
          height: '100%'
        }}
      >
        <Group position="apart">
          <Title order={4}>{leader.name}</Title>
          <Badge color="blue">{leader.years}</Badge>
        </Group>
        <Text size="sm" color="dimmed" mt="xs">{leader.country}</Text>
        <Text weight={500} mt="md">{leader.achievement}</Text>
      </Card>
    );
  };

  return (
    <Paper p="xl" radius="md" withBorder>
      <Title order={2} align="center" mb="xl">Financial Leadership Throughout History</Title>
      
      <Tabs defaultValue="timeline" mb="xl">
        <Tabs.List>
          <Tabs.Tab value="timeline" icon={<IconHistory size={14} />}>Historical Timeline</Tabs.Tab>
          <Tabs.Tab value="leaders" icon={<IconUsers size={14} />}>Notable Leaders</Tabs.Tab>
          <Tabs.Tab value="lessons" icon={<IconCircleCheck size={14} />}>Enduring Lessons</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="timeline" pt="xl">
          <Timeline active={4} bulletSize={24} lineWidth={2}>
            <Timeline.Item title="Ancient Financial Systems (600 BCE - 500 CE)" bullet={<IconCalendarEvent size={12} />}>
              <Text color="dimmed" size="sm">First standardized coinage, early banking systems, and state treasuries</Text>
              <Text size="xs" mt={4}>Key innovations: standardized coins, tax systems, early lending practices</Text>
            </Timeline.Item>
            
            <Timeline.Item title="Medieval Finance (500 - 1500 CE)" bullet={<IconCalendarEvent size={12} />}>
              <Text color="dimmed" size="sm">Trading families, early banking houses, and agricultural finance</Text>
              <Text size="xs" mt={4}>Key innovations: double-entry bookkeeping, bills of exchange, merchant banking</Text>
            </Timeline.Item>
            
            <Timeline.Item title="Early Modern Finance (1500 - 1800)" bullet={<IconCalendarEvent size={12} />}>
              <Text color="dimmed" size="sm">Central banks emerge, stock markets form, modern banking develops</Text>
              <Text size="xs" mt={4}>Key innovations: central banking, joint-stock companies, government bonds</Text>
            </Timeline.Item>
            
            <Timeline.Item title="Industrial Era Finance (1800 - 1945)" bullet={<IconCalendarEvent size={12} />}>
              <Text color="dimmed" size="sm">International banking networks, gold standard, financial regulation</Text>
              <Text size="xs" mt={4}>Key innovations: international banking, financial regulation, central bank coordination</Text>
            </Timeline.Item>
            
            <Timeline.Item title="Modern Financial System (1945 - Present)" bullet={<IconCalendarEvent size={12} />}>
              <Text color="dimmed" size="sm">Bretton Woods, fiat currencies, digital finance, global capital markets</Text>
              <Text size="xs" mt={4}>Key innovations: floating exchange rates, derivatives, algorithmic trading, digital payments</Text>
            </Timeline.Item>
          </Timeline>
        </Tabs.Panel>

        <Tabs.Panel value="leaders" pt="xl">
          <Group spacing="lg" mb="xl">
            <Badge 
              size="lg" 
              variant={activeEra === "ancient" ? "filled" : "outline"}
              onClick={() => setActiveEra("ancient")}
              style={{cursor: 'pointer'}}
            >
              Ancient World
            </Badge>
            <Badge 
              size="lg" 
              variant={activeEra === "medieval" ? "filled" : "outline"}
              onClick={() => setActiveEra("medieval")}
              style={{cursor: 'pointer'}}
            >
              Medieval Period
            </Badge>
            <Badge 
              size="lg" 
              variant={activeEra === "early-modern" ? "filled" : "outline"}
              onClick={() => setActiveEra("early-modern")}
              style={{cursor: 'pointer'}}
            >
              Early Modern
            </Badge>
            <Badge 
              size="lg" 
              variant={activeEra === "industrial" ? "filled" : "outline"}
              onClick={() => setActiveEra("industrial")}
              style={{cursor: 'pointer'}}
            >
              Industrial Era
            </Badge>
            <Badge 
              size="lg" 
              variant={activeEra === "modern" ? "filled" : "outline"}
              onClick={() => setActiveEra("modern")}
              style={{cursor: 'pointer'}}
            >
              Modern Era
            </Badge>
          </Group>

          <Grid>
            <Grid.Col span={selectedLeader ? 7 : 12}>
              <Grid>
                {historicalLeaders[activeEra]?.map(leader => (
                  <Grid.Col span={6} key={leader.id}>
                    {renderLeaderCard(leader)}
                  </Grid.Col>
                ))}
              </Grid>
            </Grid.Col>

            {selectedLeader && (
              <Grid.Col span={5}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group position="apart">
                    <Title order={3}>{selectedLeader.name}</Title>
                    <Badge color="blue">{selectedLeader.years}</Badge>
                  </Group>
                  <Text mt="xs" color="dimmed">{selectedLeader.country}</Text>
                  
                  <Divider my="md" />
                  
                  <Group spacing={5} mb={5}>
                    <IconCrown size={18} />
                    <Title order={5}>Key Achievement</Title>
                  </Group>
                  <Text>{selectedLeader.achievement}</Text>
                  
                  <Group spacing={5} mt="md" mb={5}>
                    <IconBriefcase size={18} />
                    <Title order={5}>Historical Context</Title>
                  </Group>
                  <Text size="sm">{selectedLeader.context}</Text>
                  
                  <Group spacing={5} mt="md" mb={5}>
                    <IconUser size={18} />
                    <Title order={5}>Leadership Style</Title>
                  </Group>
                  <Text size="sm">{selectedLeader.leadership}</Text>
                  
                  <Group spacing={5} mt="md" mb={5}>
                    <IconHistory size={18} />
                    <Title order={5}>Legacy</Title>
                  </Group>
                  <Text size="sm">{selectedLeader.legacy}</Text>
                </Card>
              </Grid.Col>
            )}
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="lessons" pt="xl">
          <ScrollArea h={500}>
            <Accordion>
              <Accordion.Item value="trust">
                <Accordion.Control>
                  <Text weight={700}>Trust as Financial Foundation</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text>All financial systems throughout history have relied on trust as their ultimate foundation. Whether Lydian coins, Renaissance banking, or modern cryptocurrency, financial innovations succeed when they establish and maintain trust.</Text>
                  <Text mt="md" size="sm">
                    <b>Historical Example:</b> The House of Medici maintained trust through relationships, consistency, and careful risk management, allowing their banking system to dominate European finance for generations.
                  </Text>
                  <Text mt="md" size="sm">
                    <b>Modern Application:</b> Central bank independence and transparent communication have become essential for maintaining trust in monetary systems, as demonstrated during the 2008 financial crisis and COVID-19 pandemic.
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="innovation">
                <Accordion.Control>
                  <Text weight={700}>Financial Innovation Cycles</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text>Financial leadership often emerges during periods of system transition, creating new methods and institutions to solve emerging problems. These innovations typically follow a pattern: novel solution → widespread adoption → destabilization → crisis → reform → new stability.</Text>
                  <Text mt="md" size="sm">
                    <b>Historical Example:</b> John Law's experiment with paper money in France represented a revolutionary innovation that solved short-term problems but created long-term instability through overissuance.
                  </Text>
                  <Text mt="md" size="sm">
                    <b>Modern Application:</b> The development of derivatives markets provided powerful risk management tools but contributed to systemic risk when complexity outpaced understanding and regulation.
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="independence">
                <Accordion.Control>
                  <Text weight={700}>Political Independence and Long-term Vision</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text>Effective financial leadership often requires independence from short-term political pressures and the courage to make unpopular decisions for long-term stability.</Text>
                  <Text mt="md" size="sm">
                    <b>Historical Example:</b> Alexander Hamilton established U.S. financial credibility by insisting on full payment of Revolutionary War debts despite political opposition, creating the foundation for future U.S. economic growth.
                  </Text>
                  <Text mt="md" size="sm">
                    <b>Modern Application:</b> Paul Volcker's decision to raise interest rates to unprecedented levels in the early 1980s created short-term economic pain but established decades of price stability thereafter.
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="crisis">
                <Accordion.Control>
                  <Text weight={700}>Crisis Response Frameworks</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text>Throughout history, financial leaders have developed frameworks for crisis response that balance immediate stability with long-term system health.</Text>
                  <Text mt="md" size="sm">
                    <b>Historical Example:</b> J.P. Morgan's response to the Panic of 1907 established a private-sector crisis coordination framework that would later inspire aspects of the Federal Reserve System.
                  </Text>
                  <Text mt="md" size="sm">
                    <b>Modern Application:</b> The coordinated central bank response to the 2008 crisis and COVID-19 pandemic built on historical lessons about liquidity provision, market confidence, and international coordination.
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="communication">
                <Accordion.Control>
                  <Text weight={700}>Communication as Financial Tool</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text>Financial leadership increasingly relies on communication as a primary tool, using clarity and consistency to shape expectations and behavior.</Text>
                  <Text mt="md" size="sm">
                    <b>Historical Example:</b> Nathan Rothschild's information networks provided advance knowledge of the Battle of Waterloo's outcome, demonstrating the financial power of timely, accurate information.
                  </Text>
                  <Text mt="md" size="sm">
                    <b>Modern Application:</b> Central bank forward guidance and press conferences have become essential monetary policy tools, often as important as interest rate decisions themselves in shaping market behavior.
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
};

export default LeadershipHistory; 