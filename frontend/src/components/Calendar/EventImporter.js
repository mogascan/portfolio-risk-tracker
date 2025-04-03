import React, { useState } from 'react';
import { Button, Group, Text, Paper, Alert, Box, Code, Stack, Select, Accordion } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { IconUpload, IconX, IconAlertCircle, IconFileImport, IconInfoCircle } from '@tabler/icons-react';
import { formatToISODate } from '../../utils/dateUtils';

function EventImporter({ onImportEvents }) {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [format, setFormat] = useState('json');
  const [error, setError] = useState('');
  const [previewEvents, setPreviewEvents] = useState([]);
  
  const resetState = () => {
    setFile(null);
    setFileContent('');
    setError('');
    setPreviewEvents([]);
  };
  
  const handleDrop = (files) => {
    const droppedFile = files[0];
    setFile(droppedFile);
    setError('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        setFileContent(content);
        
        // Try to parse based on selected format
        if (format === 'json') {
          const parsedEvents = JSON.parse(content);
          validateAndPreviewEvents(parsedEvents);
        } else if (format === 'csv') {
          const parsedEvents = parseCSV(content);
          validateAndPreviewEvents(parsedEvents);
        }
      } catch (err) {
        setError(`Failed to parse file: ${err.message}`);
        setPreviewEvents([]);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
    };
    
    reader.readAsText(droppedFile);
  };
  
  const parseCSV = (csvContent) => {
    // Split into lines and get headers from first line
    const lines = csvContent.split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have headers and at least one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Check for required headers
    const requiredFields = ['title', 'startDate'];
    for (const field of requiredFields) {
      if (!headers.includes(field)) {
        throw new Error(`CSV must include a '${field}' column`);
      }
    }
    
    // Parse data rows
    const events = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        throw new Error(`Line ${i+1} has ${values.length} values, but should have ${headers.length}`);
      }
      
      const event = {};
      headers.forEach((header, index) => {
        event[header] = values[index];
      });
      
      // Add ID if not present
      if (!event.id) {
        event.id = Date.now() + i.toString();
      }
      
      events.push(event);
    }
    
    return events;
  };
  
  const validateAndPreviewEvents = (events) => {
    if (!Array.isArray(events)) {
      throw new Error('Imported data must be an array of events');
    }
    
    // Validate that each event has required fields
    const validatedEvents = events.map((event, index) => {
      if (!event.title) {
        throw new Error(`Event at index ${index} is missing a title`);
      }
      if (!event.startDate) {
        throw new Error(`Event at index ${index} is missing a start date`);
      }
      
      // Normalize dates to ensure they're properly handled with the timezone offset
      if (event.startDate && typeof event.startDate === 'string') {
        // Ensure date is in proper ISO format YYYY-MM-DD
        if (!event.startDate.includes('T')) {
          try {
            event.startDate = formatToISODate(new Date(event.startDate));
          } catch (error) {
            console.error('Error formatting start date:', error);
          }
        }
      }
      
      if (event.endDate && typeof event.endDate === 'string') {
        // Ensure date is in proper ISO format YYYY-MM-DD
        if (!event.endDate.includes('T')) {
          try {
            event.endDate = formatToISODate(new Date(event.endDate));
          } catch (error) {
            console.error('Error formatting end date:', error);
          }
        }
      }
      
      // Ensure each event has an ID
      if (!event.id) {
        event.id = Date.now() + index.toString();
      }
      
      return event;
    });
    
    setPreviewEvents(validatedEvents.slice(0, 5)); // Preview first 5 events
  };
  
  const handleImport = () => {
    try {
      let eventsToImport;
      
      if (format === 'json') {
        eventsToImport = JSON.parse(fileContent);
      } else if (format === 'csv') {
        eventsToImport = parseCSV(fileContent);
      }
      
      // Validate one more time
      validateAndPreviewEvents(eventsToImport);
      
      // Import the events
      onImportEvents(eventsToImport);
      
      // Reset state
      resetState();
    } catch (err) {
      setError(`Failed to import events: ${err.message}`);
    }
  };
  
  return (
    <Stack spacing="md">
      <Alert 
        icon={<IconInfoCircle size={16} />} 
        title="Import Mode" 
        color="blue" 
        variant="light"
      >
        If you're importing the same file again, make sure to enable the "Overwrite existing events" option 
        to prevent duplicate events. Events with the same ID will be updated rather than duplicated.
      </Alert>
      
      <Select
        label="File Format"
        value={format}
        onChange={setFormat}
        data={[
          { value: 'json', label: 'JSON' },
          { value: 'csv', label: 'CSV' }
        ]}
      />
      
      <Box>
        <Text size="sm" weight={500} mb="xs">Upload File</Text>
        <Dropzone
          onDrop={handleDrop}
          onReject={() => setError('File rejected')}
          maxSize={3 * 1024 * 1024}
          accept={{
            'text/csv': ['.csv'],
            'application/json': ['.json']
          }}
        >
          <Group position="center" spacing="xl" style={{ minHeight: 100, pointerEvents: 'none' }}>
            <Dropzone.Accept>
              <IconUpload size={32} stroke={1.5} />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={32} stroke={1.5} />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFileImport size={32} stroke={1.5} />
            </Dropzone.Idle>

            <div>
              <Text size="lg" inline>
                {file ? file.name : 'Drag file here or click to select'}
              </Text>
              <Text size="sm" color="dimmed" inline mt={7}>
                File should be in {format === 'json' ? 'JSON' : 'CSV'} format
              </Text>
            </div>
          </Group>
        </Dropzone>
      </Box>
      
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Error" 
          color="red" 
          variant="filled"
        >
          {error}
        </Alert>
      )}
      
      {previewEvents.length > 0 && (
        <Box>
          <Text size="sm" weight={500} mb="xs">Preview ({previewEvents.length} of {format === 'json' ? JSON.parse(fileContent).length : parseCSV(fileContent).length} events)</Text>
          <Paper withBorder p="sm">
            <Code block>{JSON.stringify(previewEvents, null, 2)}</Code>
          </Paper>
        </Box>
      )}
      
      <Group position="right">
        <Button 
          onClick={resetState} 
          variant="outline" 
          color="gray"
          disabled={!file}
        >
          Reset
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={!file || !!error || previewEvents.length === 0}
        >
          Import Events
        </Button>
      </Group>
      
      <Accordion>
        <Accordion.Item value="formatGuide">
          <Accordion.Control>File Format Requirements</Accordion.Control>
          <Accordion.Panel>
            <Paper withBorder p="sm">
              {format === 'json' ? (
                <div>
                  <Text mb="xs">JSON must be an array of event objects with the following structure:</Text>
                  <Code block>
{`[
  {
    "id": "unique-id", // Optional, will be generated if missing
    "title": "Event Title", // Required
    "startDate": "2023-05-01", // Required, ISO format
    "endDate": "2023-05-02", // Optional
    "startTime": "09:00", // Optional
    "endTime": "10:00", // Optional
    "description": "Description", // Optional
    "location": "Location", // Optional
    "color": "blue", // Optional
    "allDay": false // Optional
  },
  // more events...
]`}
                  </Code>
                  <Text size="xs" mt="sm" fw={500}>Important notes:</Text>
                  <Text size="xs" mt="xs">• The <Code>id</Code> field is used to identify unique events. When importing the same file multiple times, events with the same IDs will update the existing events rather than create duplicates.</Text>
                  <Text size="xs" mt="xs">• You can export your current events using the "Export" button, modify that file, and re-import with the "Overwrite" option enabled to update your calendar.</Text>
                  <Text size="xs" mt="xs">• If you're adding new events to an exported file, you can remove the ID field for the new events to prevent conflicts.</Text>
                </div>
              ) : (
                <div>
                  <Text mb="xs">CSV must have the following headers (at minimum):</Text>
                  <Code block>
{`title,startDate
Event 1,2023-05-01
Event 2,2023-05-02
`}
                  </Code>
                  <Text size="sm" mt="xs">Additional optional columns: endDate, startTime, endTime, description, location, color, allDay, id</Text>
                </div>
              )}
            </Paper>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}

export default EventImporter; 