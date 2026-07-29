import React from 'react';
import { Grid, Box, Paper, Title, Text, useMantineColorScheme, useMantineTheme, Loader, Badge, Group, Stack, ScrollArea, ActionIcon } from '@mantine/core';
import { IconExternalLink, IconAlertCircle, IconClock, IconBookmark, IconBookmarkFilled } from '@tabler/icons-react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useMarket } from '../../contexts/MarketContext';
import { useBookmarks } from '../../contexts/BookmarkContext';
import classes from './RiskNewsPanel.module.css';

function RiskNewsPanel({ riskNews, loadingNews, formatNewsDate }) {
  const { portfolio } = usePortfolio();
  const { topCoins } = useMarket();
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  
  const volatility = 65; // This would come from your risk calculation logic
  const riskiestAsset = findRiskiestAsset();
  
  // Risk monitoring functions
  function findRiskiestAsset() {
    if (!portfolio.assets || portfolio.assets.length === 0 || !topCoins || topCoins.length === 0) {
      return null;
    }

    // Sort assets by risk (highest market rank = highest risk)
    const assetsWithRisk = portfolio.assets.map(asset => {
      const coin = topCoins.find(c => 
        c.id === asset.coinId || 
        c.symbol.toLowerCase() === asset.symbol.toLowerCase()
      );
      
      const marketRank = coin ? coin.market_cap_rank : 999999; // Assign a very high rank if not found
      return { ...asset, marketRank };
    });
    
    // Sort by market rank (highest number = highest risk)
    const sortedByRisk = [...assetsWithRisk].sort((a, b) => b.marketRank - a.marketRank);
    
    // Return the riskiest asset (highest market rank)
    return sortedByRisk[0];
  }
  
  const getRiskLevel = (vol) => {
    if (vol <= 30) return 'Low Risk';
    if (vol <= 70) return 'Moderate Risk';
    return 'High Risk';
  };
  
  // Add bookmark handler function
  const handleBookmarkToggle = (newsItem) => {
    const normalizedItem = {
      id: newsItem.id || `risk-${Date.now()}-${Math.random()}`,
      title: newsItem.title,
      summary: newsItem.summary,
      source: newsItem.source,
      url: newsItem.url,
      timestamp: newsItem.publishedAt,
      sentiment: 'NEUTRAL'
    };

    if (isBookmarked(normalizedItem.id)) {
      removeBookmark(normalizedItem.id);
    } else {
      addBookmark(normalizedItem);
    }
  };

  return (
    <Stack gap="md" style={{
      backgroundColor: 'transparent',
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
    }}>
      <Grid gutter="md">
        {/* Risk Metrics Card */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper
            p="md"
            radius="md"
            withBorder={false}
            style={{
              backgroundColor: isDark ? theme.colors.dark[6] : theme.white,
              borderLeft: `4px solid ${
                volatility > 70 
                  ? theme.colors[isDark ? 'red' : 'red'][isDark ? 4 : 6]
                  : volatility > 40 
                    ? theme.colors[isDark ? 'orange' : 'orange'][isDark ? 4 : 6]
                    : theme.colors[isDark ? 'green' : 'green'][isDark ? 4 : 6]
              }`,
              height: '100%'
            }}
          >
            <Stack gap="sm">
              <Group justify="space-between">
                <Title order={4}>Risk</Title>
                <Badge size="sm" color={volatility > 70 ? "red" : volatility > 30 ? "yellow" : "green"}>
                  {getRiskLevel(volatility)}
                </Badge>
              </Group>

              <Box>
                <Text size="sm" mb={4}>Portfolio Volatility:</Text>
                <Text size="lg" fw={700}>{volatility}%</Text>
              </Box>

              <Box>
                <Box
                  style={{
                    width: '100%',
                    height: 8,
                    backgroundColor: isDark ? theme.colors.dark[5] : theme.colors.gray[2],
                    borderRadius: theme.radius.sm,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    style={{
                      width: `${volatility}%`,
                      height: '100%',
                      backgroundColor: volatility > 70 
                        ? theme.colors[isDark ? 'red' : 'red'][isDark ? 4 : 6]
                        : volatility > 40 
                          ? theme.colors[isDark ? 'orange' : 'orange'][isDark ? 4 : 6]
                          : theme.colors[isDark ? 'green' : 'green'][isDark ? 4 : 6],
                      borderRadius: theme.radius.sm
                    }}
                  />
                </Box>
              </Box>

              {riskiestAsset && (
                <Box>
                  <Text size="sm" fw={500} mb={8}>Risk Assets:</Text>
                  <Group gap="xs">
                    <Badge 
                      color="red" 
                      size="sm"
                      leftSection={
                        <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'red' }} />
                      }
                    >
                      {riskiestAsset.symbol}
                    </Badge>
                  </Group>
                </Box>
              )}

              <Box mt="auto">
                <Text size="sm" fw={500} mb={8}>Additional Risk Metrics</Text>
                <Group gap="xs">
                  <Badge color="blue" variant="outline" size="sm">Market Correlation</Badge>
                  <Badge color="yellow" variant="outline" size="sm">Liquidity Risk</Badge>
                  <Badge color="cyan" variant="outline" size="sm">Event Risk</Badge>
                </Group>
              </Box>
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Risk News Card */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper
            p="md"
            radius="md"
            withBorder={false}
            style={{
              backgroundColor: isDark ? theme.colors.dark[6] : theme.white,
              height: 120,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Group justify="space-between" mb="xs">
              <Title order={4}>Risk-Related News</Title>
              <Badge color="red" size="sm">
                <Group gap={5} noWrap>
                  <IconAlertCircle size={14} />
                  <Text size="xs">{riskNews.length} ALERTS</Text>
                </Group>
              </Badge>
            </Group>

            {loadingNews ? (
              <Box py="sm" style={{ display: 'flex', justifyContent: 'center' }}>
                <Loader size="sm" />
              </Box>
            ) : riskNews.length > 0 ? (
              <ScrollArea offsetScrollbars scrollbarSize={6} style={{ flex: 1 }}>
                <Stack gap={6}>
                  {riskNews.slice(0, 3).map((item, index) => (
                    <Box
                      key={index}
                      p="xs"
                      className={classes.newsItem}
                      style={{
                        borderRadius: theme.radius.sm,
                      }}
                    >
                      <Group justify="space-between" align="flex-start">
                        <Box style={{ flex: 1 }}>
                          <Text
                            component="a"
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="sm"
                            fw={500}
                            style={{
                              color: isDark ? theme.white : theme.black,
                              textDecoration: 'none',
                              display: 'block'
                            }}
                          >
                            {item.title}
                            <IconExternalLink size={14} style={{ marginLeft: 5, verticalAlign: 'middle' }} />
                          </Text>

                          <Group justify="space-between" mt={5}>
                            <Text size="xs" color="dimmed">{item.source || "Unknown source"}</Text>
                            <Group gap={4} noWrap>
                              <IconClock size={12} />
                              <Text size="xs" color="dimmed">{formatNewsDate(item.publishedAt)}</Text>
                            </Group>
                          </Group>
                        </Box>
                        
                        <ActionIcon
                          variant="subtle"
                          color={isBookmarked(item.id) ? "blue" : "gray"}
                          onClick={() => handleBookmarkToggle(item)}
                          title={isBookmarked(item.id) ? "Remove bookmark" : "Add bookmark"}
                        >
                          {isBookmarked(item.id) ? (
                            <IconBookmarkFilled size={16} />
                          ) : (
                            <IconBookmark size={16} />
                          )}
                        </ActionIcon>
                      </Group>
                    </Box>
                  ))}
                </Stack>
              </ScrollArea>
            ) : (
              <Text size="sm" color="dimmed" italic>No risk-related news found.</Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

export default RiskNewsPanel;
