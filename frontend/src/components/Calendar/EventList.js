import React, { useState } from 'react';
import { Paper, Text, Group, ActionIcon, Stack, Modal, Badge, Box, useMantineColorScheme, useMantineTheme, Collapse, Button } from '@mantine/core';
import { IconPencil, IconTrash, IconCalendar, IconChevronDown, IconChevronUp, IconClock } from '@tabler/icons-react';
import AddEventForm from './AddEventForm';
import { formatDateRangeForDisplay, isDateInPast } from '../../utils/dateUtils';

function EventList({ events, onEditEvent, onDeleteEvent }) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  
  const handleEditClick = (event) => {
    setCurrentEvent(event);
    setEditModalOpen(true);
  };
  
  const handleEditSubmit = (editedEvent) => {
    onEditEvent({ ...editedEvent, id: currentEvent.id });
    setEditModalOpen(false);
  };
  
  const handleDeleteClick = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDeleteEvent(eventId);
    }
  };
  
  // Group events by date and determine if they're past events
  const groupEventsByDate = () => {
    const grouped = {
      future: {},
      past: {}
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of today
    
    events.forEach(event => {
      // Use our utility function for consistent date formatting
      const date = formatDateRangeForDisplay(event.startDate, event.endDate);
      // Use our utility function to check if date is in past
      const isPastEvent = isDateInPast(event.startDate);
      
      const targetGroup = isPastEvent ? grouped.past : grouped.future;
      
      if (!targetGroup[date]) {
        targetGroup[date] = [];
      }
      targetGroup[date].push(event);
    });
    
    return grouped;
  };
  
  const groupedEvents = groupEventsByDate();
  const hasPastEvents = Object.keys(groupedEvents.past).length > 0;
  const hasFutureEvents = Object.keys(groupedEvents.future).length > 0;
  
  // Count total past events
  const pastEventCount = Object.values(groupedEvents.past).reduce(
    (total, events) => total + events.length, 
    0
  );
  
  // Render event group function
  const renderEventGroup = (dateEvents, date) => (
    <Box key={date} mb="md">
      <Group position="apart" mb="xs">
        <Group>
          <IconCalendar size={16} color={theme.colors.blue[6]} />
          <Text fw={600}>{date}</Text>
        </Group>
        <Badge color="blue" variant="light">{dateEvents.length} event{dateEvents.length !== 1 ? 's' : ''}</Badge>
      </Group>
      
      <Stack spacing="xs">
        {dateEvents.map(event => (
          <Paper
            key={event.id}
            withBorder
            p="sm"
            style={{
              borderLeft: `4px solid ${event.color ? theme.colors[event.color][6] : theme.colors.blue[6]}`,
              backgroundColor: isDark 
                ? theme.colors.dark[6] 
                : (event.color ? theme.colors[event.color][0] : theme.colors.gray[0])
            }}
          >
            <Group position="apart" noWrap>
              <div style={{ flex: 1 }}>
                <Text fw={600}>{event.title}</Text>
                {event.description && (
                  <Text size="sm" c="dimmed" lineClamp={2}>{event.description}</Text>
                )}
                {event.location && (
                  <Text size="sm" italic>Location: {event.location}</Text>
                )}
              </div>
              
              <Group spacing={4}>
                <ActionIcon 
                  size="sm" 
                  color="blue" 
                  variant="subtle"
                  onClick={() => handleEditClick(event)}
                >
                  <IconPencil size={16} />
                </ActionIcon>
                <ActionIcon 
                  size="sm" 
                  color="red" 
                  variant="subtle"
                  onClick={() => handleDeleteClick(event.id)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
  
  return (
    <div>
      {!hasFutureEvents && !hasPastEvents ? (
        <Text c="dimmed" ta="center" py="lg">No events scheduled for this month.</Text>
      ) : (
        <>
          {/* Future Events */}
          {hasFutureEvents ? (
            <>
              <Text fw={700} mb="md">Current & Future Events</Text>
              {Object.entries(groupedEvents.future).map(([date, dateEvents]) => 
                renderEventGroup(dateEvents, date)
              )}
            </>
          ) : (
            <Text c="dimmed" ta="center" py="md">No upcoming events.</Text>
          )}
          
          {/* Past Events Section */}
          {hasPastEvents && (
            <Box mt="xl">
              <Button 
                variant="subtle" 
                color={isDark ? "gray.6" : "gray.7"}
                leftSection={
                  showPastEvents ? 
                  <IconChevronUp size={16} /> : 
                  <IconChevronDown size={16} />
                }
                rightSection={
                  <Badge size="sm" variant="filled" color="gray">
                    {pastEventCount}
                  </Badge>
                }
                onClick={() => setShowPastEvents(!showPastEvents)}
                fullWidth
              >
                <Group>
                  <IconClock size={16} />
                  <Text>Past Events</Text>
                </Group>
              </Button>
              
              <Collapse in={showPastEvents}>
                <Box mt="md">
                  {Object.entries(groupedEvents.past).map(([date, dateEvents]) => 
                    renderEventGroup(dateEvents, date)
                  )}
                </Box>
              </Collapse>
            </Box>
          )}
        </>
      )}
      
      {/* Edit Event Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Event"
        size="md"
      >
        {currentEvent && (
          <AddEventForm
            onSubmit={handleEditSubmit}
            initialValues={currentEvent}
            isEditing={true}
          />
        )}
      </Modal>
    </div>
  );
}

export default EventList; 