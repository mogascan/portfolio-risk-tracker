import React, { useState } from 'react';
import { TextInput, Textarea, Button, Group, Stack, ColorSwatch, SimpleGrid, Switch, useMantineTheme, Box, Text } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { isNotEmpty } from '@mantine/form';
import { useForm } from '@mantine/form';
import { parseISODate, formatToISODate } from '../../utils/dateUtils';

const colorOptions = ['blue', 'cyan', 'green', 'yellow', 'orange', 'red', 'pink', 'grape', 'violet', 'indigo', 'teal'];

function AddEventForm({ onSubmit, initialValues = {}, isEditing = false }) {
  const theme = useMantineTheme();
  const [isMultiDay, setIsMultiDay] = useState(initialValues.endDate && initialValues.endDate !== initialValues.startDate);
  
  const form = useForm({
    initialValues: {
      title: initialValues.title || '',
      description: initialValues.description || '',
      startDate: parseISODate(initialValues.startDate),
      startTime: initialValues.startTime || '',
      endDate: parseISODate(initialValues.endDate),
      endTime: initialValues.endTime || '',
      location: initialValues.location || '',
      color: initialValues.color || 'blue',
      allDay: initialValues.allDay || false
    },
    validate: {
      title: isNotEmpty('Title is required'),
      startDate: isNotEmpty('Start date is required')
    }
  });
  
  const handleSubmit = (values) => {
    try {
      // Create event with properly formatted dates
      const eventWithId = {
        ...values,
        // Use consistent date format in storage
        startDate: formatToISODate(values.startDate),
        endDate: isMultiDay ? formatToISODate(values.endDate) : null,
        id: isEditing ? initialValues.id : Date.now().toString() + Math.random().toString(36).substr(2, 5)
      };
      
      // Ensure we're not submitting undefined or invalid values
      const cleanedEvent = {};
      Object.keys(eventWithId).forEach(key => {
        if (eventWithId[key] === undefined) {
          cleanedEvent[key] = null;
        } else {
          cleanedEvent[key] = eventWithId[key];
        }
      });
      
      // Validation checks
      if (!cleanedEvent.startDate) {
        console.error('Invalid start date in event submission');
        alert('Invalid start date. Please select a valid date.');
        return;
      }
      
      console.log('Submitting event:', cleanedEvent);
      onSubmit(cleanedEvent);
      form.reset();
    } catch (error) {
      console.error('Error in event submission:', error);
      alert('There was an error submitting the event. Please try again.');
    }
  };
  
  const toggleMultiDay = (checked) => {
    setIsMultiDay(checked);
    if (checked && !form.values.endDate) {
      // Initialize end date to start date if not set
      form.setFieldValue('endDate', form.values.startDate);
    }
  };
  
  const toggleAllDay = (checked) => {
    form.setFieldValue('allDay', checked);
    if (checked) {
      form.setFieldValue('startTime', '');
      form.setFieldValue('endTime', '');
    }
  };
  
  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack spacing="md">
        <TextInput
          label="Event Title"
          placeholder="Enter event title"
          required
          {...form.getInputProps('title')}
        />
        
        <Group grow align="flex-start">
          <DatePickerInput
            label="Start Date"
            placeholder="Select date"
            required
            {...form.getInputProps('startDate')}
          />
          
          {isMultiDay && (
            <DatePickerInput
              label="End Date"
              placeholder="Select date"
              minDate={form.values.startDate}
              {...form.getInputProps('endDate')}
            />
          )}
        </Group>
        
        <Group position="apart">
          <Switch 
            label="Multi-day event"
            checked={isMultiDay}
            onChange={(event) => toggleMultiDay(event.currentTarget.checked)}
          />
          
          <Switch 
            label="All day"
            checked={form.values.allDay}
            onChange={(event) => toggleAllDay(event.currentTarget.checked)}
          />
        </Group>
        
        {!form.values.allDay && (
          <Group grow>
            <TimeInput
              label="Start Time"
              placeholder="Enter start time"
              {...form.getInputProps('startTime')}
            />
            
            <TimeInput
              label="End Time"
              placeholder="Enter end time"
              {...form.getInputProps('endTime')}
            />
          </Group>
        )}
        
        <TextInput
          label="Location"
          placeholder="Enter location (optional)"
          {...form.getInputProps('location')}
        />
        
        <Textarea
          label="Description"
          placeholder="Enter event description (optional)"
          minRows={3}
          {...form.getInputProps('description')}
        />
        
        <Box>
          <Text size="sm" weight={500} mb="xs">Event Color</Text>
          <SimpleGrid cols={6} spacing="xs">
            {colorOptions.map((color) => (
              <ColorSwatch
                key={color}
                color={theme.colors[color][6]}
                size={30}
                radius="md"
                style={{ 
                  cursor: 'pointer',
                  border: form.values.color === color 
                    ? `2px solid ${theme.colors.dark[9]}` 
                    : '2px solid transparent' 
                }}
                onClick={() => form.setFieldValue('color', color)}
              />
            ))}
          </SimpleGrid>
        </Box>
        
        <Group position="right" mt="md">
          <Button type="submit" color="blue">
            {isEditing ? 'Update Event' : 'Add Event'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

export default AddEventForm; 