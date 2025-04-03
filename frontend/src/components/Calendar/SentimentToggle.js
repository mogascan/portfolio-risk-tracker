import React, { useState, useEffect } from 'react';
import { Box, Group, Slider, Text, useMantineTheme } from '@mantine/core';
import { useCalendar } from '../../contexts/CalendarContext';
import { formatToISODate } from '../../utils/dateUtils';

const sentimentOptions = [
  { value: 'bear', label: 'Bear', color: 'red.4' },
  { value: 'neutral', label: 'Neutral', color: 'gray.5' },
  { value: 'bull', label: 'Bull', color: 'green.4' }
];

function SentimentToggle({ selectedDate }) {
  const theme = useMantineTheme();
  const { getSentiment, setSentiment } = useCalendar();
  
  // Convert the selected date to ISO format for consistent storage
  const dateString = formatToISODate(selectedDate) || formatToISODate(new Date());
  
  // Initialize the sentiment value
  const [value, setValue] = useState(() => {
    const currentSentiment = getSentiment(dateString);
    switch (currentSentiment) {
      case 'bear': return 0;
      case 'bull': return 2;
      default: return 1;  // neutral
    }
  });
  
  // When the selected date changes, update the toggle position
  useEffect(() => {
    const currentSentiment = getSentiment(dateString);
    switch (currentSentiment) {
      case 'bear': setValue(0); break;
      case 'bull': setValue(2); break;
      default: setValue(1); break;
    }
  }, [dateString, getSentiment]);
  
  // When the slider value changes, update the sentiment
  const handleChange = (newValue) => {
    setValue(newValue);
    const sentimentValue = sentimentOptions[newValue].value;
    setSentiment(dateString, sentimentValue);
  };
  
  // Get the current color from selected option
  const currentColor = sentimentOptions[value].color;
  const colorParts = currentColor.split('.');
  const thumbColor = theme.colors[colorParts[0]][colorParts[1]];
  
  // Create CSS variable for gradient background
  const trackGradient = `linear-gradient(90deg, ${theme.colors.red[4]} 0%, ${theme.colors.gray[5]} 50%, ${theme.colors.green[4]} 100%)`;
  
  return (
    <Box p="md">
      <Text fw={500} size="sm" mb={10}>Market Sentiment</Text>
      
      <Group justify="space-between" mb={5}>
        {sentimentOptions.map((option, index) => (
          <Text 
            key={option.value} 
            size="sm" 
            c={value === index ? option.color : 'dimmed'}
            fw={value === index ? 700 : 400}
          >
            {option.label}
          </Text>
        ))}
      </Group>
      
      <Slider
        min={0}
        max={2}
        step={1}
        value={value}
        onChange={handleChange}
        marks={sentimentOptions.map((option, index) => ({ value: index, label: '' }))}
        styles={{
          track: { 
            background: trackGradient 
          },
          thumb: {
            backgroundColor: thumbColor,
            borderColor: thumbColor
          },
          markFilled: {
            borderColor: 'transparent',
            backgroundColor: 'transparent'
          },
          mark: {
            backgroundColor: 'transparent',
            borderColor: 'transparent'
          }
        }}
      />
    </Box>
  );
}

export default SentimentToggle; 