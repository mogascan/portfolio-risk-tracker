import React, { createContext, useState, useContext, useEffect } from 'react';

const BookmarkContext = createContext();

export const useBookmarks = () => useContext(BookmarkContext);

export const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const savedBookmarks = localStorage.getItem('newsBookmarks');
      return savedBookmarks ? JSON.parse(savedBookmarks) : [];
    } catch (error) {
      console.error('Error loading bookmarks from localStorage:', error);
      return [];
    }
  });

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('newsBookmarks', JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks to localStorage:', error);
    }
  }, [bookmarks]);

  // Listen for storage changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'newsBookmarks') {
        try {
          const newBookmarks = e.newValue ? JSON.parse(e.newValue) : [];
          setBookmarks(newBookmarks);
        } catch (error) {
          console.error('Error parsing bookmarks from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Ensure ID is a string for consistency
  const normalizeId = (id) => {
    return String(id);
  };

  const addBookmark = (newsItem) => {
    if (!newsItem) return;
    
    // Make sure the ID is a string
    const normalizedItem = {
      ...newsItem,
      id: normalizeId(newsItem.id)
    };
    
    setBookmarks(prevBookmarks => {
      if (!prevBookmarks.some(item => normalizeId(item.id) === normalizedItem.id)) {
        return [...prevBookmarks, normalizedItem];
      }
      return prevBookmarks;
    });
  };

  const removeBookmark = (id) => {
    const normalizedId = normalizeId(id);
    setBookmarks(prevBookmarks => 
      prevBookmarks.filter(item => normalizeId(item.id) !== normalizedId)
    );
  };

  const isBookmarked = (id) => {
    const normalizedId = normalizeId(id);
    return bookmarks.some(item => normalizeId(item.id) === normalizedId);
  };

  return (
    <BookmarkContext.Provider value={{ bookmarks, addBookmark, removeBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export default BookmarkContext; 