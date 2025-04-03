import React, { createContext, useState, useContext, useEffect } from 'react';
import { formatToISODate } from '../utils/dateUtils';

const CalendarContext = createContext();

// Default empty events array
const defaultEvents = [];

// Default sentiment map (empty)
const defaultSentiment = {};

// Helper to safely parse stored events
const parseStoredEvents = (jsonData) => {
  try {
    if (!jsonData) return null;
    
    const data = JSON.parse(jsonData);
    if (!Array.isArray(data)) {
      console.error('Stored calendar events are not in array format:', data);
      return null;
    }
    
    // Validate each event and ensure it has required fields
    const validatedEvents = data.filter(event => {
      return event && event.title && event.startDate;
    });
    
    return validatedEvents;
  } catch (err) {
    console.error('Error parsing calendar events data:', err);
    return null;
  }
};

export function CalendarProvider({ children }) {
  // Initialize events from localStorage
  const [events, setEvents] = useState(() => {
    try {
      const savedEvents = localStorage.getItem('calendarEvents');
      console.log('Loading calendar events from localStorage...');
      
      if (savedEvents && savedEvents !== 'undefined' && savedEvents !== 'null') {
        const parsedEvents = parseStoredEvents(savedEvents);
        if (parsedEvents) {
          console.log('Successfully loaded events from localStorage:', parsedEvents.length);
          return parsedEvents;
        }
      }
      
      console.log('No valid events found, using default empty events array');
      return defaultEvents;
    } catch (error) {
      console.error('Error initializing events from localStorage:', error);
      return defaultEvents;
    }
  });

  // Initialize date sentiment from localStorage
  const [dateSentiment, setDateSentiment] = useState(() => {
    try {
      const savedSentiment = localStorage.getItem('calendarSentiment');
      console.log('Loading calendar sentiment data from localStorage...');
      
      if (savedSentiment && savedSentiment !== 'undefined' && savedSentiment !== 'null') {
        try {
          const parsedSentiment = JSON.parse(savedSentiment);
          if (typeof parsedSentiment === 'object') {
            console.log('Successfully loaded sentiment data');
            return parsedSentiment;
          }
        } catch (error) {
          console.error('Error parsing sentiment data:', error);
        }
      }
      
      console.log('No valid sentiment data found, using default empty object');
      return defaultSentiment;
    } catch (error) {
      console.error('Error initializing sentiment from localStorage:', error);
      return defaultSentiment;
    }
  });

  // Save events to localStorage whenever they change
  useEffect(() => {
    try {
      if (events && Array.isArray(events)) {
        // Validate each event before saving
        const validEvents = events.filter(event => {
          return event && event.title && event.startDate;
        });
        
        const eventsJson = JSON.stringify(validEvents);
        localStorage.setItem('calendarEvents', eventsJson);
        console.log('Saved events to localStorage:', validEvents.length);
      }
    } catch (error) {
      console.error('Error saving events to localStorage:', error);
    }
  }, [events]);

  // Save sentiment to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('calendarSentiment', JSON.stringify(dateSentiment));
      console.log('Saved sentiment data to localStorage');
    } catch (error) {
      console.error('Error saving sentiment to localStorage:', error);
    }
  }, [dateSentiment]);

  // Add a new event
  const addEvent = (newEvent) => {
    try {
      const eventWithId = { 
        ...newEvent, 
        id: newEvent.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      setEvents(prevEvents => [...prevEvents, eventWithId]);
      console.log('Added new event:', eventWithId.title);
      return true;
    } catch (error) {
      console.error('Error adding event:', error);
      return false;
    }
  };

  // Edit an existing event
  const editEvent = (editedEvent) => {
    try {
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === editedEvent.id ? editedEvent : event
        )
      );
      console.log('Edited event:', editedEvent.title);
      return true;
    } catch (error) {
      console.error('Error editing event:', error);
      return false;
    }
  };

  // Delete an event
  const deleteEvent = (eventId) => {
    try {
      setEvents(prevEvents => 
        prevEvents.filter(event => event.id !== eventId)
      );
      console.log('Deleted event with ID:', eventId);
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  };

  // Import events with option to overwrite existing
  const importEvents = (importedEvents, shouldOverwrite) => {
    try {
      // Validate imported events
      const validImportedEvents = importedEvents.filter(event => {
        return event && event.title && event.startDate;
      }).map(event => ({
        ...event,
        // Ensure each event has a proper ID
        id: event.id || `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      
      if (shouldOverwrite) {
        // Replace all events
        setEvents(validImportedEvents);
        console.log('Replaced all events with imported events:', validImportedEvents.length);
      } else {
        // Append without duplicates
        setEvents(prevEvents => {
          const existingIds = new Set(prevEvents.map(event => event.id));
          const uniqueNewEvents = validImportedEvents.filter(event => 
            !existingIds.has(event.id)
          );
          
          return [...prevEvents, ...uniqueNewEvents];
        });
        console.log('Added imported events to existing events');
      }
      return true;
    } catch (error) {
      console.error('Error importing events:', error);
      return false;
    }
  };

  // Export events to JSON string
  const exportEvents = () => {
    try {
      const exportableEvents = events.map(event => ({
        ...event,
        id: event.id || `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: event.title || 'Untitled Event',
        startDate: event.startDate || formatToISODate(new Date())
      }));
      
      return JSON.stringify(exportableEvents, null, 2);
    } catch (error) {
      console.error('Error exporting events:', error);
      return null;
    }
  };

  // Get sentiment for a specific date
  const getSentiment = (dateStr) => {
    return dateSentiment[dateStr] || 'neutral';
  };

  // Set sentiment for a specific date
  const setSentiment = (dateStr, sentiment) => {
    try {
      setDateSentiment(prev => ({
        ...prev,
        [dateStr]: sentiment
      }));
      console.log(`Updated sentiment for ${dateStr} to ${sentiment}`);
      return true;
    } catch (error) {
      console.error('Error setting sentiment:', error);
      return false;
    }
  };

  // Set sentiment for a range of dates
  const setSentimentRange = (startDateStr, endDateStr, sentiment) => {
    try {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date range');
      }
      
      const updates = {};
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        const dateStr = formatToISODate(currentDate);
        updates[dateStr] = sentiment;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setDateSentiment(prev => ({
        ...prev,
        ...updates
      }));
      
      console.log(`Updated sentiment for date range ${startDateStr} to ${endDateStr}`);
      return true;
    } catch (error) {
      console.error('Error setting sentiment range:', error);
      return false;
    }
  };

  // Clear sentiment for a specific date
  const clearSentiment = (dateStr) => {
    try {
      setDateSentiment(prev => {
        const newSentiment = { ...prev };
        delete newSentiment[dateStr];
        return newSentiment;
      });
      console.log(`Cleared sentiment for ${dateStr}`);
      return true;
    } catch (error) {
      console.error('Error clearing sentiment:', error);
      return false;
    }
  };

  const value = {
    events,
    addEvent,
    editEvent,
    deleteEvent,
    importEvents,
    exportEvents,
    dateSentiment,
    getSentiment,
    setSentiment,
    setSentimentRange,
    clearSentiment
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}; 