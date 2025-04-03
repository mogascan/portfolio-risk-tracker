// frontend/src/components/AI/RecommendationsPanel.js
import React, { useState, useEffect } from 'react';
import { Title, Text, useMantineColorScheme, useMantineTheme, Loader } from '@mantine/core';
import { fetchAiRecommendations } from '../../api/ai';
import './AI.css';

const RecommendationsPanel = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? theme.white : theme.black;

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        const response = await fetchAiRecommendations();
        setRecommendations(response.recommendations || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching AI recommendations:', err);
        setError('Failed to load AI recommendations');
        
        // Set mock recommendations for development
        setRecommendations([
          {
            title: "Rebalance Bitcoin Allocation",
            explanation: "Your Bitcoin allocation has grown to 40% of your portfolio, above the 30-35% typically recommended for a balanced crypto portfolio.",
            action: "Consider selling 5-10% of your BTC position and reallocating to either stablecoins or underweighted altcoins."
          },
          {
            title: "Explore DeFi Opportunities",
            explanation: "Your portfolio lacks exposure to the DeFi sector, which has shown significant growth potential. DeFi protocols can also provide passive income through staking and yield farming.",
            action: "Research allocating 5-10% of your portfolio to established DeFi tokens like AAVE, UNI, or MKR."
          },
          {
            title: "Implement Dollar-Cost Averaging",
            explanation: "Your trading history shows several large, one-time purchases which increases timing risk. Dollar-cost averaging can reduce this risk and emotional decision-making.",
            action: "Set up automated weekly or monthly purchases of $100-500 for your core holdings instead of infrequent large buys."
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecommendations();
  }, []);
  
  if (loading) {
    return <Loader size="xs" />;
  }
  
  if (error && recommendations.length === 0) {
    return <Text c="dimmed" size="xs">Error loading recommendations: {error}</Text>;
  }
  
  if (recommendations.length === 0) {
    return (
      <Text c="dimmed" size="xs">
        No AI recommendations available. Please connect your wallets or exchanges to get personalized recommendations.
      </Text>
    );
  }
  
  return (
    <div>
      <Title order={4} size="sm" mb={4} style={{ color: textColor }}>Recommendations</Title>
      <div className="recommendations-list">
        {recommendations.map((recommendation, index) => (
          <div key={index} className="recommendation-card" style={{ marginBottom: '10px' }}>
            <Text size="xs" fw={600} style={{ color: textColor }}>{recommendation.title}</Text>
            <Text c="dimmed" size="xs" style={{ marginTop: '2px' }}>{recommendation.explanation}</Text>
            <Text c="dimmed" size="xs" style={{ marginTop: '5px', color: isDark ? theme.colors.blue[3] : theme.colors.blue[6] }}>
              {recommendation.action}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsPanel;