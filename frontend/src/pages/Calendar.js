import React, { useState } from 'react';
import { Container, Title, Group, Paper, Button, Modal, Text, useMantineColorScheme, useMantineTheme, Menu, Divider, Switch, Box, ActionIcon, Flex } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight, IconPlus, IconUpload, IconDownload, IconDots, IconCalendar } from '@tabler/icons-react';
import MonthlyCalendar from '../components/Calendar/MonthlyCalendar';
import EventList from '../components/Calendar/EventList';
import AddEventForm from '../components/Calendar/AddEventForm';
import EventImporter from '../components/Calendar/EventImporter';
import { parseISODate, isDateInMonth, formatToISODate } from '../utils/dateUtils';
import { useCalendar } from '../contexts/CalendarContext';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function Calendar() {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  const currentDate = new Date();
  
  // Use the calendar context instead of direct localStorage
  const { events, addEvent, editEvent, deleteEvent, importEvents, exportEvents } = useCalendar();
  
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [addEventModalOpen, setAddEventModalOpen] = useState(false);
  const [importEventsModalOpen, setImportEventsModalOpen] = useState(false);
  const [shouldOverwriteEvents, setShouldOverwriteEvents] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const handleMonthSelect = (monthIndex) => {
    setCurrentMonth(monthIndex);
  };
  
  // Handler for date selection change
  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date);
      setCurrentMonth(date.getMonth());
      setCurrentYear(date.getFullYear());
    }
  };
  
  // Handler for adding events (now using context)
  const handleAddEvent = (newEvent) => {
    const success = addEvent(newEvent);
    if (success) {
      setAddEventModalOpen(false);
    }
  };
  
  // Handler for exporting events
  const handleExportEvents = () => {
    try {
      const eventsJson = exportEvents();
      if (!eventsJson) {
        throw new Error('Failed to generate export data');
      }
      
      // Create a blob with the JSON data
      const blob = new Blob([eventsJson], { type: 'application/json' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `calendar-events-${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting events:', error);
      alert('Failed to export events. Please try again.');
    }
  };
  
  // Handler for importing events (now using context)
  const handleImportEvents = (eventsToImport) => {
    const success = importEvents(eventsToImport, shouldOverwriteEvents);
    if (success) {
      setImportEventsModalOpen(false);
      setShouldOverwriteEvents(false);
    }
  };
  
  // Get current month's events
  const currentMonthEvents = events.filter(event => {
    try {
      // Use our utility function to check if date is in current month
      return isDateInMonth(event.startDate, currentYear, currentMonth) || 
             (event.endDate && isDateInMonth(event.endDate, currentYear, currentMonth));
    } catch (error) {
      console.error('Error filtering events for current month:', error);
      return false;
    }
  }).sort((a, b) => {
    try {
      // Parse dates consistently for sorting
      const dateA = parseISODate(a.startDate);
      const dateB = parseISODate(b.startDate);
      return dateA - dateB;
    } catch (error) {
      console.error('Error sorting events:', error);
      return 0;
    }
  });

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <Title order={2}>Calendar</Title>
        <Group>
          <Button 
            variant="light" 
            leftSection={<IconDownload size={14} />}
            onClick={handleExportEvents}
          >
            Export
          </Button>
          
          <Button 
            variant="light"
            leftSection={<IconUpload size={14} />}
            onClick={() => setImportEventsModalOpen(true)}
          >
            Import
          </Button>
          
          <Button 
            leftSection={<IconPlus size={14} />}
            onClick={() => setAddEventModalOpen(true)}
          >
            Add Event
          </Button>
        </Group>
      </Group>

      <Paper 
        shadow="none" 
        p="md" 
        mb="md" 
        withBorder={false}
        style={{
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '8px',
          backgroundColor: isDark ? theme.colors.dark[6] : 'white'
        }}
      >
        <Group justify="space-between" mb="md">
          <Group>
            <Button variant="subtle" onClick={handlePrevMonth} px={8}>
              <IconChevronLeft size={20} />
            </Button>
            <Text fw={700} fz="xl">
              {months[currentMonth]} {currentYear}
            </Text>
            <Button variant="subtle" onClick={handleNextMonth} px={8}>
              <IconChevronRight size={20} />
            </Button>
          </Group>
          
          <Flex gap="md" align="center">
            <DatePickerInput
              value={selectedDate}
              onChange={handleDateChange}
              placeholder="Select date"
              size="sm"
              valueFormat="MMM D, YYYY"
              rightSection={<IconCalendar size={16} />}
              styles={{
                input: {
                  width: '150px'
                }
              }}
            />
            
            <Group>
              {Array.from({ length: 12 }, (_, i) => (
                <Button 
                  key={i}
                  size="xs"
                  variant={i === currentMonth ? "filled" : "subtle"}
                  onClick={() => handleMonthSelect(i)}
                  px={12}
                >
                  {i + 1}
                </Button>
              ))}
            </Group>
          </Flex>
        </Group>
        
        <MonthlyCalendar 
          year={currentYear}
          month={currentMonth}
          events={events}
        />
      </Paper>
      
      <Group align="flex-start">
        <Paper 
          shadow="none" 
          p="md" 
          withBorder={false}
          style={{ 
            flex: 1,
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: '8px',
            backgroundColor: isDark ? theme.colors.dark[6] : 'white'
          }}
        >
          <Title order={3} mb="md">Events for {months[currentMonth]} {currentYear}</Title>
          <EventList 
            events={currentMonthEvents}
            onEditEvent={editEvent}
            onDeleteEvent={deleteEvent}
          />
        </Paper>
        
        <Paper 
          shadow="none" 
          p="md" 
          withBorder={false}
          style={{ 
            width: '300px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: '8px',
            backgroundColor: isDark ? theme.colors.dark[6] : 'white'
          }}
        >
          <Title order={4} mb="md">Market Sentiment Legend</Title>
          
          <Box>
            <Group mb="md">
              <Box w={16} h={16} style={{ backgroundColor: theme.colors.red[1], borderRadius: 4 }} />
              <Text size="sm">Bearish Market</Text>
            </Group>
            
            <Group mb="md">
              <Box w={16} h={16} style={{ backgroundColor: 'transparent', border: `1px solid ${theme.colors.gray[5]}`, borderRadius: 4 }} />
              <Text size="sm">Neutral Market</Text>
            </Group>
            
            <Group mb="md">
              <Box w={16} h={16} style={{ backgroundColor: theme.colors.green[1], borderRadius: 4 }} />
              <Text size="sm">Bullish Market</Text>
            </Group>
            
            <Divider my="md" />
            
            <Text size="xs" c="dimmed">
              Each day has a sentiment slider at the bottom. Slide left for bearish, center for neutral, and right for bullish sentiment.
            </Text>
            
            <Box mt="lg">
              <Group spacing={4} position="center">
                <Text size="xs" c="red.6">Bear</Text>
                <Text size="xs" mx="xs">•</Text>
                <Text size="xs" c="dimmed">Neutral</Text>
                <Text size="xs" mx="xs">•</Text>
                <Text size="xs" c="green.6">Bull</Text>
              </Group>
              <Box 
                mt="xs" 
                mb="md" 
                mx="auto" 
                style={{ 
                  width: '80%', 
                  height: '6px', 
                  background: `linear-gradient(90deg, ${theme.colors.red[4]} 0%, ${theme.colors.gray[5]} 50%, ${theme.colors.green[4]} 100%)`,
                  borderRadius: '3px'
                }} 
              />
            </Box>
          </Box>
        </Paper>
      </Group>
      
      {/* Add Event Modal */}
      <Modal 
        opened={addEventModalOpen} 
        onClose={() => setAddEventModalOpen(false)}
        title="Add New Event"
        size="md"
      >
        <AddEventForm 
          onSubmit={handleAddEvent}
          initialMonth={currentMonth}
          initialYear={currentYear}
        />
      </Modal>
      
      {/* Import Events Modal - with updated title to indicate overwrite functionality */}
      <Modal
        opened={importEventsModalOpen}
        onClose={() => {
          setImportEventsModalOpen(false);
          setShouldOverwriteEvents(false);
        }}
        title="Import Events"
        size="lg"
      >
        <Box mb="md">
          <Switch 
            label="Overwrite existing events" 
            description="Replace all current events with imported events instead of adding to them"
            checked={shouldOverwriteEvents}
            onChange={(event) => setShouldOverwriteEvents(event.currentTarget.checked)}
            size="md"
          />
          
          <Text size="xs" c="dimmed" mt="xs">
            <strong>Overwrite mode:</strong> Completely replaces your calendar with the imported events. Use this when re-importing a previously exported file after making changes.
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            <strong>Add mode:</strong> Only adds new events, avoiding duplicates based on event ID. Events with the same ID will be skipped.
          </Text>
        </Box>
        
        <Divider my="md" label={shouldOverwriteEvents ? "All existing events will be replaced" : "Events will be added to your calendar (skipping duplicates)"} labelPosition="center" />
        
        <EventImporter onImportEvents={handleImportEvents} />
      </Modal>
    </Container>
  );
}

export default Calendar; 