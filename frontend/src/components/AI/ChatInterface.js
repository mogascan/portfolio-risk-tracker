// frontend/src/components/AI/ChatInterface.js
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Paper, Textarea, Stack, Text, Loader, ActionIcon, Group, Select, Tooltip, Alert, useMantineColorScheme, useMantineTheme, Avatar, Code, Switch } from '@mantine/core';
import { useAI } from '../../contexts/AIContext';
import ChatHistoryPanel from './ChatHistoryPanel';

// Check if we're in development mode for debugging
const isDev = process.env.NODE_ENV === 'development';

function ChatInterface({ height = '550px' }) {
  const { sendMessage, isProcessing, error, conversations, activeConversationId, createNewConversation } = useAI();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [input, setInput] = useState('');
  const [debugMode, setDebugMode] = useState(() => {
    // Initialize from localStorage
    const savedDebugMode = localStorage.getItem('aiDebugMode');
    return savedDebugMode ? JSON.parse(savedDebugMode) : false;
  });
  const scrollAreaRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [localError, setLocalError] = useState(null);
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';

  // Persist debug mode to localStorage when changed
  useEffect(() => {
    localStorage.setItem('aiDebugMode', JSON.stringify(debugMode));
  }, [debugMode]);

  // Create a new conversation if none exists
  useEffect(() => {
    if (!conversations || conversations.length === 0) {
      console.log("No conversations found, creating a new one");
      createNewConversation();
    }
  }, [conversations, createNewConversation]);

  // Find the active conversation
  const activeConversation = conversations && conversations.find(conv => conv.id === activeConversationId);
  
  // Get messages from active conversation or use welcome message
  const messages = activeConversation?.messages || [];
  const hasMessages = messages && messages.length > 0;
  
  // Show welcome message only if there are no messages - using useMemo to avoid dependencies issues
  const displayMessages = useMemo(() => {
    // Only show welcome message if we're not currently processing a message
    // This prevents the welcome message from showing while we're waiting for a response
    if (!hasMessages && !isProcessing) {
      return [{
        id: 'welcome',
        text: "Hello! I'm your AI portfolio assistant. Ask me anything about your crypto holdings, market trends, or specific assets.",
        sender: 'ai',
        timestamp: new Date().toISOString(),
      }];
    }
    
    // If we have messages or we're processing, show the actual messages
    return messages;
  }, [hasMessages, isProcessing, messages]);
  
  // Debug logging
  useEffect(() => {
    console.log("====== CHAT INTERFACE DEBUG ======");
    console.log("Chat interface render");
    console.log("Active conversation ID:", activeConversationId);
    console.log("Found active conversation:", activeConversation);
    console.log("All conversations:", conversations);
    console.log("Error state:", error);
    console.log("Local error state:", localError);
    console.log("Is processing:", isProcessing);
    console.log("Debug mode:", debugMode);
    
    if (activeConversation) {
      console.log("Active conversation messages:", activeConversation.messages);
    }
    
    console.log("Display messages:", displayMessages);
    console.log("====== END DEBUG ======");
  }, [activeConversationId, activeConversation, conversations, error, localError, isProcessing, displayMessages, debugMode]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    console.log("Messages updated, scrolling to bottom:", displayMessages.length);
    if (scrollAreaRef.current) {
      setTimeout(() => {
        const scrollArea = scrollAreaRef.current;
        if (scrollArea) {
          scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [displayMessages]);

  const models = [
    { value: 'gpt-4', label: 'GPT-4 (Most Capable)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Faster)' },
    { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo (Preview)' }
  ];

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    // Clear any previous errors
    setLocalError(null);

    try {
      console.log('Sending message with model:', selectedModel);
      console.log('Current input:', input);
      console.log('Debug mode:', debugMode);
      
      // Store the input value before clearing it
      const messageText = input;
      setInput('');
      
      // Send message to AI with debug flag if enabled
      await sendMessage(messageText, { 
        model: selectedModel,
        debug: debugMode
      });
      
    } catch (err) {
      console.error('Error sending message:', err);
      setLocalError(err.message || 'Failed to send message');
    }
  };

  // Render debug information for AI messages
  const renderDebugInfo = (message) => {
    if (!debugMode || message.sender !== 'ai' || !message.debug) return null;

    return (
      <Paper 
        shadow="xs" 
        padding="xs" 
        mt={8} 
        style={{ 
          fontSize: '0.75rem', 
          backgroundColor: isDark ? theme.colors.dark[6] : theme.colors.gray[0],
          border: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[3]}`
        }}
      >
        <Text size="xs" fw={700} mb={2}>Debug Information</Text>
        <Text size="xs">Intent: {message.debug.intent || 'Unknown'}</Text>
        <Text size="xs">Context Sources: {Array.isArray(message.debug.context_sources) 
          ? message.debug.context_sources.join(', ') 
          : message.debug.context_sources || 'None'}</Text>
        <Text size="xs">Prompt: {message.debug.prompt_used || 'Default'}</Text>
      </Paper>
    );
  };

  return (
    <div className="chat-interface" style={{
      backgroundColor: isDark ? theme.colors.dark[8] : theme.colors.gray[0],
      borderRadius: '8px',
      height: height,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Stack 
        h="100%" 
        spacing="xs"
        style={{ 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          backgroundColor: isDark ? theme.colors.dark[7] : theme.white
        }}
      >
        <ChatHistoryPanel 
          opened={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)} 
        />
        
        <Group 
          p="xs" 
          style={{ 
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px 8px 0 0',
            justifyContent: 'space-between',
            padding: '6px 12px',
            flexShrink: 0
          }}
        >
          <Group>
            <ActionIcon 
              variant="subtle" 
              onClick={() => setIsHistoryOpen(true)}
              size="md"
            >
              "☰"
            </ActionIcon>
            <Text size="sm" fw={500}>
              {activeConversation?.title || 'New Conversation'}
            </Text>
          </Group>

          <Group>
            <Switch
              size="xs"
              label="Debug AI"
              checked={debugMode}
              onChange={(event) => setDebugMode(event.currentTarget.checked)}
            />
            <Select
              size="xs"
              value={selectedModel}
              onChange={setSelectedModel}
              data={models}
            />
          </Group>
        </Group>

        <div 
          className="chat-messages-container"
          style={{ 
            padding: '8px 16px',
            flex: '1 1 auto',
            overflowY: 'auto',
            minHeight: '100px'
          }}
          ref={scrollAreaRef}
        >
          {(error || localError) && (
            <Alert 
              icon="⚠"
              title="Error" 
              color="red" 
              mb="md"
              withCloseButton
              onClose={() => setLocalError(null)}
            >
              {error || localError}
            </Alert>
          )}
          
          {displayMessages.map((message, index) => (
            <div
              key={message.id || `message-${index}`}
              style={{
                display: 'flex',
                flexDirection: 'column', // Changed to column to accommodate debug info
                alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '18px',
                position: 'relative',
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%',
                }}
              >
                {message.sender !== 'user' && (
                  <Avatar 
                    size="md" 
                    color="blue" 
                    radius="xl"
                    style={{ marginRight: '10px', alignSelf: 'flex-end', marginBottom: '4px' }}
                  >
                    {message.isError ? "⚠" : "🤖"}
                  </Avatar>
                )}

                <Paper
                  radius="md"
                  withBorder={false}
                  styles={(theme) => ({
                    root: {
                      backgroundColor: message.sender === 'user' 
                        ? theme.colorScheme === 'dark' 
                          ? '#1a73e8' 
                          : '#1a73e8'
                        : message.isError
                          ? theme.colorScheme === 'dark'
                            ? theme.colors.red[9]
                            : theme.colors.red[1]
                          : theme.colorScheme === 'dark'
                            ? '#353940'
                            : '#f0f2f5',
                      color: message.sender === 'user' 
                        ? '#ffffff'
                        : message.isError
                          ? theme.colorScheme === 'dark'
                            ? theme.colors.red[2]
                            : theme.colors.red[9]
                          : theme.colorScheme === 'dark'
                            ? '#ffffff'
                            : '#1a1b1e',
                      maxWidth: '80%',
                      padding: '14px 18px',
                      border: 'none',
                      boxShadow: 'none',
                      position: 'relative',
                      borderRadius: message.sender === 'user'
                        ? '16px 4px 16px 16px'
                        : '4px 16px 16px 16px',
                      marginRight: message.sender === 'user' ? '4px' : '0',
                      marginLeft: message.sender === 'user' ? '0' : '4px',
                      borderBottom: message.sender === 'user'
                        ? '2px solid rgba(0, 0, 0, 0.1)'
                        : message.isError
                          ? '2px solid rgba(220, 38, 38, 0.5)'
                          : '2px solid rgba(0, 0, 0, 0.05)',
                    },
                  })}
                >
                  <div 
                    style={{ 
                      fontSize: '15px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      maxWidth: '100%'
                    }}
                  >
                    {message.text || message.content}
                  </div>
                </Paper>
              </div>
              
              {/* Debug information display - only for AI messages when debug mode is on */}
              {message.sender === 'ai' && renderDebugInfo(message)}
            </div>
          ))}
          
          {isProcessing && (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '16px',
                marginLeft: '4px'
              }}
            >
              <Avatar 
                size="md" 
                color="blue" 
                radius="xl"
                style={{ marginRight: '10px'}}
              >
                🤖
              </Avatar>
              <Loader size="sm" />
            </div>
          )}
        </div>
        
        <div 
          style={{ 
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            padding: '12px 16px 16px 16px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}
        >
          <div 
            className="chat-input-container"
            style={{ 
              padding: '8px',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              position: 'relative',
              bottom: 0,
              zIndex: 10,
              backgroundColor: isDark ? theme.colors.dark[7] : theme.white,
              flexShrink: 0
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <Paper
                shadow="none"
                radius="md"
                p="xs"
                styles={(theme) => ({
                  root: {
                    border: `1px solid ${theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                    backgroundColor: theme.colorScheme === 'dark' ? '#2C2E33' : theme.white,
                    position: 'relative',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px',
                    '& textarea': {
                      backgroundColor: theme.colorScheme === 'dark' ? '#2C2E33' : theme.white
                    }
                  }
                })}
              >
                <Tooltip 
                  label="New chat" 
                  position="right"
                  styles={(theme) => ({
                    tooltip: {
                      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[9] : '#1A1B1E',
                      color: 'white',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '14px'
                    }
                  })}
                >
                  <ActionIcon
                    variant="outline"
                    color="gray"
                    size="md"
                    onClick={() => {
                      createNewConversation();
                      setInput('');
                    }}
                    styles={(theme) => ({
                      root: {
                        padding: '6px',
                        borderRadius: '50%',
                        border: `1px solid ${theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
                        backgroundColor: theme.colorScheme === 'dark' ? '#2C2E33' : theme.white,
                        '&:hover': {
                          backgroundColor: theme.colorScheme === 'dark' ? '#353940' : theme.colors.gray[0]
                        }
                      }
                    })}
                  >
                    "+"
                  </ActionIcon>
                </Tooltip>

                <Textarea
                  placeholder="Ask about your portfolio..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isProcessing}
                  autosize
                  minRows={1}
                  maxRows={3}
                  style={{ flex: 1 }}
                  styles={(theme) => ({
                    input: {
                      border: 'none',
                      backgroundColor: theme.colorScheme === 'dark' ? '#2C2E33' : theme.white,
                      padding: '6px 12px',
                      fontSize: '15px',
                      color: theme.colorScheme === 'dark' ? theme.colors.gray[0] : theme.black,
                      '&:focus': {
                        border: 'none',
                        outline: 'none'
                      },
                      '&::placeholder': {
                        color: theme.colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.gray[6]
                      },
                      borderRadius: '12px'
                    },
                    wrapper: {
                      width: '100%',
                      borderRadius: '12px',
                      backgroundColor: theme.colorScheme === 'dark' ? '#2C2E33' : theme.white
                    }
                  })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />

                <ActionIcon
                  variant="filled"
                  color="blue"
                  onClick={handleSend}
                  size="lg"
                  radius="xl"
                  disabled={isProcessing || !input.trim()}
                  style={{ alignSelf: 'flex-end' }}
                >
                  {isProcessing ? <Loader size="xs" color="white" /> : "→"}
                </ActionIcon>
              </Paper>
            </form>
          </div>
        </div>
      </Stack>
    </div>
  );
}

export default ChatInterface;