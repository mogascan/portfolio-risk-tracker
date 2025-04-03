import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { sendAiQuery } from "../api/ai";

const AIContext = createContext();

export function useAI() {
  return useContext(AIContext);
}

export const AIProvider = ({ children }) => {
  // State for chat management
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // State for conversations
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  
  // Reference to the createNewConversation function to avoid dependency issues
  const createNewConversationRef = useRef(null);
  
  // Helper function to create a new conversation object
  const createNewConversationObject = () => ({
    id: Date.now().toString(),
    title: 'New Conversation',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  // Create a new conversation
  const createNewConversation = useCallback(() => {
    console.log("Creating new conversation");
    const newConversation = createNewConversationObject();
    
    setConversations(prev => [...prev, newConversation]);
    setActiveConversationId(newConversation.id);
    setMessages([]);
    
    console.log("Created new conversation:", newConversation.id);
    return newConversation;
  }, []);
  
  // Store the latest version of createNewConversation in a ref to avoid dependency issues
  useEffect(() => {
    createNewConversationRef.current = createNewConversation;
  }, [createNewConversation]);
  
  // Create a default conversation on mount
  useEffect(() => {
    if (conversations.length === 0) {
      console.log("No conversations found, creating initial conversation");
      // Use the ref to access the latest version of createNewConversation
      const timer = setTimeout(() => {
        if (createNewConversationRef.current) {
          createNewConversationRef.current();
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [conversations.length]);
  
  // Ensure all conversations have required timestamp fields
  useEffect(() => {
    if (conversations.length > 0) {
      const now = new Date().toISOString();
      const needsUpdate = conversations.some(
        conv => !conv.createdAt || !conv.updatedAt
      );
      
      if (needsUpdate) {
        console.log("Fixing missing timestamp fields in conversations");
        setConversations(prevConvs => 
          prevConvs.map(conv => ({
            ...conv,
            createdAt: conv.createdAt || now,
            updatedAt: conv.updatedAt || now
          }))
        );
      }
    }
  }, [conversations]);
  
  // Set the active conversation
  const setActiveConversation = useCallback((conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setActiveConversationId(conversationId);
      setMessages(conversation.messages);
      console.log("Set active conversation:", conversationId);
    }
  }, [conversations]);
  
  // Delete a conversation
  const deleteConversation = useCallback((conversationId) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    // If the deleted conversation was active, set a new active conversation
    if (activeConversationId === conversationId) {
      const remainingConversations = conversations.filter(c => c.id !== conversationId);
      if (remainingConversations.length > 0) {
        setActiveConversationId(remainingConversations[0].id);
        setMessages(remainingConversations[0].messages);
      } else {
        createNewConversation();
      }
    }
  }, [activeConversationId, conversations, createNewConversation]);
  
  // Function to send message to AI
  const sendMessage = useCallback(async (message, options = {}) => {
    if (!message || message.trim() === '') return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Add user message to chat
      const userMessage = {
        id: uuidv4(),
        content: message,
        text: message, // For backward compatibility
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      
      // Add to messages state and update the active conversation
      setMessages(prev => [...prev, userMessage]);
      
      // Update the conversation with the new message
      if (activeConversationId) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === activeConversationId 
              ? { 
                  ...conv, 
                  messages: [...conv.messages, userMessage],
                  updatedAt: new Date().toISOString()
                }
              : conv
          )
        );
      }
      
      // Send message to AI backend which will handle context and intent classification
      console.log("Sending message to backend AI:", message);
      console.log("Request options:", options);
      
      // Pass debug flag if it exists in options
      const requestOptions = { ...options };
      const response = await sendAiQuery(message, requestOptions);
      console.log('Response from AI service:', response);
      
      if (response && response.message) {
        // Create AI message object
        let messageText = response.message;
        
        // Ensure message is a string, not an object
        if (typeof messageText === 'object') {
          try {
            messageText = JSON.stringify(messageText);
          } catch (e) {
            messageText = "Response contained an object that couldn't be displayed properly.";
          }
        }
        
        // Create the AI message with debug metadata if available
        const aiMessage = {
          id: uuidv4(),
          content: messageText,
          text: messageText, // For backward compatibility
          sender: 'ai',
          timestamp: new Date().toISOString(),
          metadata: response.source || null,
          debug: response.metadata || null, // Store debug metadata from response
          isError: response.isError || false
        };
        
        console.log("AI message with debug info:", aiMessage);
        
        // Add to messages state and make sure we're updating the state correctly
        setMessages(prevMessages => [...prevMessages, aiMessage]);
        
        // Update the conversation with the new message and ensure it's saved
        if (activeConversationId) {
          setConversations(prevConvs => {
            // Find the active conversation
            const activeConv = prevConvs.find(c => c.id === activeConversationId);
            if (activeConv) {
              // Create updated conversation with both user and AI messages
              const updatedConv = {
                ...activeConv,
                messages: [...activeConv.messages, aiMessage],
                updatedAt: new Date().toISOString()
              };
              
              // Replace the old conversation with the updated one
              return prevConvs.map(c => 
                c.id === activeConversationId ? updatedConv : c
              );
            }
            return prevConvs;
          });
        }
        
        // Log the message was added
        console.log("Added AI message to conversation:", aiMessage.text.substring(0, 50));
      } else {
        console.error("No message found in AI response:", response);
        
        // Create an error message to display in the chat
        const errorMessage = {
          id: uuidv4(),
          content: `I'm sorry, but I couldn't process your request. ${response?.message || 'An unknown error occurred.'}`,
          text: `I'm sorry, but I couldn't process your request. ${response?.message || 'An unknown error occurred.'}`, // For backward compatibility
          sender: 'ai',
          timestamp: new Date().toISOString(),
          isError: true
        };
        
        // Add the error message to the conversation
        setMessages(prevMessages => [...prevMessages, errorMessage]);
        
        if (activeConversationId) {
          setConversations(prevConvs => {
            const activeConv = prevConvs.find(c => c.id === activeConversationId);
            if (activeConv) {
              const updatedConv = {
                ...activeConv,
                messages: [...activeConv.messages, errorMessage],
                updatedAt: new Date().toISOString()
              };
              return prevConvs.map(c => 
                c.id === activeConversationId ? updatedConv : c
              );
            }
            return prevConvs;
          });
        }
        
        setError(response?.message || "Error sending message to AI");
      }
      
      setIsProcessing(false);
      
    } catch (error) {
      console.error("Error sending message to AI:", error);
      
      // Create an error message to display in the chat
      const errorMessage = {
        id: uuidv4(),
        content: `I'm sorry, but I couldn't process your request. ${error.message || 'An unknown error occurred.'}`,
        text: `I'm sorry, but I couldn't process your request. ${error.message || 'An unknown error occurred.'}`, // For backward compatibility
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      // Add the error message to the conversation
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      
      if (activeConversationId) {
        setConversations(prevConvs => {
          const activeConv = prevConvs.find(c => c.id === activeConversationId);
          if (activeConv) {
            const updatedConv = {
              ...activeConv,
              messages: [...activeConv.messages, errorMessage],
              updatedAt: new Date().toISOString()
            };
            return prevConvs.map(c => 
              c.id === activeConversationId ? updatedConv : c
            );
          }
          return prevConvs;
        });
      }
      
      setError(error.message || "Error sending message to AI");
      setIsProcessing(false);
    }
  }, [activeConversationId]);
  
  // Search conversations
  const searchConversations = useCallback((query) => {
    if (!query) return conversations;
    
    const lowerQuery = query.toLowerCase();
    return conversations.filter(conv => {
      // Search in title
      if (conv.title.toLowerCase().includes(lowerQuery)) return true;
      
      // Search in messages
      return conv.messages.some(msg => 
        msg.text.toLowerCase().includes(lowerQuery)
      );
    });
  }, [conversations]);
  
  // Clear chat history
  const clearChatHistory = useCallback(() => {
    if (activeConversationId) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversationId 
            ? { ...conv, messages: [] }
            : conv
        )
      );
      setMessages([]);
    }
  }, [activeConversationId]);

  const value = {
    isProcessing,
    error,
    sendMessage,
    messages,
    conversations,
    activeConversationId,
    createNewConversation,
    setActiveConversation,
    deleteConversation,
    searchQuery: '',
    searchConversations,
    clearChatHistory
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};
