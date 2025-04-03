/**
 * Format a date string as a relative time (e.g., "2 hours ago")
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted relative time
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown time';
  
  // Check if the dateString is already in the format "Xh ago" or "Xm ago"
  if (dateString.endsWith('h ago') || dateString.endsWith('m ago')) {
    return dateString;
  }
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    
    if (isNaN(seconds)) {
      return dateString; // If parsing fails, return the original string
    }
    
    // Format based on elapsed time
    if (seconds < 60) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      // Format as MM/DD/YYYY for older dates
      return date.toLocaleDateString();
    }
  } catch (e) {
    console.error('Error parsing date:', e);
    return dateString;
  }
};

/**
 * Format a date to a consistent format
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};

/**
 * Utility functions for handling dates consistently across the application
 */

/**
 * Convert a date string or Date object to a ISO date string (YYYY-MM-DD)
 * using UTC to avoid timezone issues
 */
export const formatToISODate = (date) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      console.error('Invalid date:', date);
      return null;
    }
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

/**
 * Parse a date string (especially ISO format YYYY-MM-DD) to a Date object
 * using UTC to avoid timezone issues
 */
export const parseISODate = (dateStr) => {
  if (!dateStr) return new Date();
  
  try {
    // Handle ISO date strings (YYYY-MM-DD) specially to avoid timezone issues
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    }
    
    // For other formats, use standard Date parsing
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateStr);
      return new Date();
    }
    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

/**
 * Format a date range for display, handling timezone issues
 */
export const formatDateRangeForDisplay = (startDate, endDate) => {
  let start, end;
  
  try {
    // Parse dates
    start = parseISODate(startDate);
    end = endDate ? parseISODate(endDate) : null;
    
    // Format for display
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC' // Use UTC to avoid timezone shifts
      });
    };
    
    if (!end || formatDate(start) === formatDate(end)) {
      return formatDate(start);
    }
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return startDate; // Fallback to original string
  }
};

/**
 * Check if a date is in the past (before today)
 */
export const isDateInPast = (dateStr) => {
  try {
    const date = parseISODate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  } catch (error) {
    console.error('Error checking if date is in past:', error);
    return false;
  }
};

/**
 * Check if a date falls within a specific month and year
 */
export const isDateInMonth = (dateStr, year, month) => {
  try {
    const date = parseISODate(dateStr);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month;
  } catch (error) {
    console.error('Error checking if date is in month:', error);
    return false;
  }
};

export default {
  formatTimeAgo,
  formatDate,
  formatToISODate,
  parseISODate,
  formatDateRangeForDisplay,
  isDateInPast,
  isDateInMonth
}; 