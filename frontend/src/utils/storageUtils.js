// frontend/src/utils/storageUtils.js

/**
 * Utility functions for local storage operations
 */

/**
 * Save data to local storage
 * @param {string} key - The storage key
 * @param {any} data - The data to store (will be JSON stringified)
 */
export const saveToStorage = (key, data) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (key: ${key}):`, error);
    return false;
  }
};

/**
 * Load data from local storage
 * @param {string} key - The storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} The parsed data or defaultValue
 */
export const loadFromStorage = (key, defaultValue = null) => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`Error loading from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
};

/**
 * Remove data from local storage
 * @param {string} key - The storage key to remove
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (key: ${key}):`, error);
    return false;
  }
};

/**
 * Clear all app-related data from local storage
 * @param {string} prefix - Optional prefix to limit clearing to specific keys
 */
export const clearAppStorage = (prefix = '') => {
  try {
    if (prefix) {
      // Only remove items that start with the prefix
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });
    } else {
      // Clear everything
      localStorage.clear();
    }
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

/**
 * Get all keys in local storage with a specific prefix
 * @param {string} prefix - The prefix to filter by
 * @returns {string[]} Array of matching keys
 */
export const getStorageKeysByPrefix = (prefix) => {
  try {
    return Object.keys(localStorage).filter(key => key.startsWith(prefix));
  } catch (error) {
    console.error(`Error getting keys with prefix (${prefix}):`, error);
    return [];
  }
};

export default {
  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  clearAppStorage,
  getStorageKeysByPrefix
}; 