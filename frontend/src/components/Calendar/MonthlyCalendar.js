import React, { useState } from 'react';
import { Grid, Box, Text, Group, Badge, useMantineColorScheme, useMantineTheme, Tooltip, Paper, Slider } from '@mantine/core';
import { parseISODate, formatToISODate } from '../../utils/dateUtils';
import { useCalendar } from '../../contexts/CalendarContext';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Component for a single calendar day
function CalendarDay({ day, month, year, events, isToday, sentimentValue, onSentimentChange }) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  const [isHovered, setIsHovered] = useState(false);
  
  // Only calculate these if we have a valid day
  if (!day) return <div></div>;
  
  // Get events for this day
  const dayEvents = events.filter(event => {
    try {
      // Use our utility function to parse dates consistently
      const eventStartDate = parseISODate(event.startDate);
      const eventEndDate = event.endDate ? parseISODate(event.endDate) : parseISODate(event.startDate);
      
      // Create a UTC date for the current day being checked
      const currentDate = new Date(Date.UTC(year, month, day));
      
      // Set hours to compare full days
      const startCompare = new Date(eventStartDate);
      startCompare.setUTCHours(0, 0, 0, 0);
      
      const endCompare = new Date(eventEndDate);
      endCompare.setUTCHours(23, 59, 59, 999);
      
      const dayCompare = new Date(currentDate);
      dayCompare.setUTCHours(12, 0, 0, 0); // Set to noon to avoid any edge cases
      
      // Check if current date is within event range
      return dayCompare >= startCompare && dayCompare <= endCompare;
    } catch (error) {
      console.error('Error checking event date:', error);
      return false;
    }
  });
  
  // Get background color based on sentiment
  const getSentimentBgColor = () => {
    const opacity = isDark ? 0.2 : 0.1; // Lower opacity for dark mode
    
    switch (sentimentValue) {
      case 0: // bear
        return isDark ? `rgba(248, 113, 113, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
      case 2: // bull
        return isDark ? `rgba(74, 222, 128, ${opacity})` : `rgba(34, 197, 94, ${opacity})`;
      default: // neutral
        return 'transparent';
    }
  };
  
  // Function to format time for tooltip display
  const formatEventTime = (event) => {
    if (event.allDay) return 'All day';
    
    let timeStr = '';
    if (event.startTime) timeStr += event.startTime;
    if (event.endTime) timeStr += ` - ${event.endTime}`;
    
    return timeStr || 'No time specified';
  };
  
  // Function to generate tooltip content for an event
  const renderEventTooltip = (event) => (
    <Paper 
      p="xs" 
      withBorder 
      style={{ 
        maxWidth: '250px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[2]}`,
        borderRadius: '4px'
      }}
    >
      <Text fw={600} size="sm">{event.title}</Text>
      
      <Text size="xs" mt={4}>
        {formatEventTime(event)}
      </Text>
      
      {event.location && (
        <Text size="xs" mt={4}>
          <strong>Location:</strong> {event.location}
        </Text>
      )}
      
      {event.description && (
        <Text size="xs" mt={4}>
          {event.description}
        </Text>
      )}
    </Paper>
  );
  
  // Create CSS variable for gradient background
  const trackGradient = `linear-gradient(90deg, ${theme.colors.red[4]} 0%, ${theme.colors.gray[5]} 50%, ${theme.colors.green[4]} 100%)`;
  
  // Get sentiment indicator color
  const getIndicatorColor = () => {
    switch (sentimentValue) {
      case 0: return theme.colors.red[4]; // bear
      case 2: return theme.colors.green[4]; // bull
      default: return theme.colors.gray[5]; // neutral
    }
  };
  
  return (
    <Box 
      p="xs" 
      style={{ 
        minHeight: '100px',
        border: `1px solid ${isDark ? theme.colors.blue[7] : theme.colors.gray[3]}`,
        borderRadius: '8px',
        backgroundColor: isToday 
          ? (isDark ? theme.colors.dark[5] : theme.colors.blue[0]) 
          : getSentimentBgColor(),
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <Text 
        fw={isToday ? 700 : 400} 
        style={{ 
          color: isToday ? theme.colors.blue[6] : undefined,
          position: 'absolute',
          top: '5px',
          right: '10px'
        }}
      >
        {day}
      </Text>
      
      <Box mt={18}>
        {dayEvents.length > 0 && (
          <Group direction="column" spacing={4} mt={4}>
            {dayEvents.slice(0, 3).map(event => (
              <Tooltip
                key={event.id}
                label={renderEventTooltip(event)}
                position="right"
                withArrow
                arrowPosition="center"
                multiline
                width={250}
                styles={{
                  tooltip: {
                    padding: 0,
                    border: 'none',
                    backgroundColor: 'transparent'
                  },
                  arrow: {
                    backgroundColor: isDark ? theme.colors.dark[4] : theme.colors.gray[2]
                  }
                }}
              >
                <Badge 
                  key={event.id} 
                  size="sm" 
                  color={event.color || 'blue'} 
                  fullWidth
                  style={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  {event.title}
                </Badge>
              </Tooltip>
            ))}
            
            {dayEvents.length > 3 && (
              <Tooltip
                label={
                  <Paper p="xs" withBorder style={{ 
                    maxWidth: '250px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[2]}`,
                    borderRadius: '4px'
                  }}>
                    <Text size="xs" fw={600} mb={5}>Additional Events:</Text>
                    {dayEvents.slice(3).map(event => (
                      <Text key={event.id} size="xs" mb={2}>
                        • {event.title}
                      </Text>
                    ))}
                  </Paper>
                }
                position="right"
                withArrow
                arrowPosition="center"
                multiline
                width={250}
                styles={{
                  tooltip: {
                    padding: 0,
                    border: 'none',
                    backgroundColor: 'transparent'
                  },
                  arrow: {
                    backgroundColor: isDark ? theme.colors.dark[4] : theme.colors.gray[2]
                  }
                }}
              >
                <Text 
                  size="xs" 
                  c="dimmed" 
                  ta="center" 
                  style={{ cursor: 'pointer' }}
                >
                  {dayEvents.length - 3} more
                </Text>
              </Tooltip>
            )}
          </Group>
        )}
        
        {/* Sentiment indicator or slider at the bottom of each day */}
        <Box style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px' }}>
          {isHovered ? (
            // Show slider when hovered
            <Slider
              min={0}
              max={2}
              step={1}
              value={sentimentValue}
              onChange={onSentimentChange}
              size="xs"
              marks={[
                { value: 0, label: '' },
                { value: 1, label: '' },
                { value: 2, label: '' },
              ]}
              label={null}
              styles={{
                track: { 
                  background: trackGradient,
                  height: '4px'
                },
                thumb: {
                  width: '10px',
                  height: '10px',
                  backgroundColor: getIndicatorColor(),
                  borderColor: getIndicatorColor(),
                },
                markFilled: {
                  display: 'none'
                },
                mark: {
                  display: 'none'
                }
              }}
            />
          ) : (
            // Show simple indicator dot when not hovered
            <Box 
              style={{ 
                height: '6px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Box 
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: sentimentValue === 1 ? 'transparent' : getIndicatorColor(),
                  border: sentimentValue === 1 ? `1px solid ${theme.colors.gray[5]}` : 'none',
                  transition: 'all 0.2s ease'
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function MonthlyCalendar({ year, month, events }) {
  const { getSentiment, setSentiment } = useCalendar();
  
  // Get the first day of the month
  const firstDayOfMonth = new Date(year, month, 1);
  // Get the day of the week for the first day (0-6, where 0 is Sunday)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  // Get the number of days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Create an array of days for the calendar grid
  const days = [];
  
  // Add empty spaces for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  // Function to get sentiment value for a day (0 = bear, 1 = neutral, 2 = bull)
  const getSentimentValue = (day) => {
    if (!day) return 1; // default neutral
    
    const dateStr = formatToISODate(new Date(year, month, day));
    const sentiment = getSentiment(dateStr);
    
    switch (sentiment) {
      case 'bear': return 0;
      case 'bull': return 2;
      default: return 1; // neutral
    }
  };
  
  // Function to set sentiment for a day
  const handleSentimentChange = (day, value) => {
    if (!day) return;
    
    const dateStr = formatToISODate(new Date(year, month, day));
    let sentiment;
    
    switch (value) {
      case 0: sentiment = 'bear'; break;
      case 2: sentiment = 'bull'; break;
      default: sentiment = 'neutral'; break;
    }
    
    setSentiment(dateStr, sentiment);
  };
  
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';

  return (
    <Box>
      {/* Calendar header (days of week) */}
      <Grid columns={7}>
        {DAYS_OF_WEEK.map((day, index) => (
          <Grid.Col span={1} key={index}>
            <Box 
              p="xs" 
              ta="center"
              style={{ 
                backgroundColor: isDark ? theme.colors.dark[6] : theme.colors.blue[0],
                color: isDark ? theme.colors.dark[0] : theme.colors.blue[9],
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: isDark ? `0 1px 3px rgba(0, 0, 0, 0.2)` : 'none',
                border: `1px solid ${isDark ? theme.colors.blue[7] : theme.colors.blue[1]}`,
                transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
              }}
            >
              {day}
            </Box>
          </Grid.Col>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const isToday = day && new Date().getDate() === day && 
                          new Date().getMonth() === month && 
                          new Date().getFullYear() === year;
          
          // Get sentiment value (0=bear, 1=neutral, 2=bull)
          const sentimentValue = getSentimentValue(day);
          
          return (
            <Grid.Col span={1} key={index}>
              {day ? (
                <CalendarDay 
                  day={day}
                  month={month}
                  year={year}
                  events={events}
                  isToday={isToday}
                  sentimentValue={sentimentValue}
                  onSentimentChange={(value) => handleSentimentChange(day, value)}
                />
              ) : null}
            </Grid.Col>
          );
        })}
      </Grid>
    </Box>
  );
}

export default MonthlyCalendar; 