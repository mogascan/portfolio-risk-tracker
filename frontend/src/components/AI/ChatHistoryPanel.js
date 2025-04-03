import React, { useState } from 'react';
import { Drawer, Title, TextInput, Stack, Text, Group, ActionIcon, ScrollArea, Button, Modal, Box } from '@mantine/core';
import { IconSearch, IconTrash, IconX } from '@tabler/icons-react';
import { useAI } from '../../contexts/AIContext';
import { format } from 'date-fns';

function ChatHistoryPanel({ opened, onClose }) {
  const { conversations, activeConversationId, setActiveConversation, deleteConversation, searchQuery, searchConversations, clearChatHistory } = useAI();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  // Filter conversations by search query
  const filteredConversations = searchQuery 
    ? conversations.filter(conv => 
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.messages.some(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : conversations;

  const handleDeleteConversation = (event, conversationId) => {
    event.stopPropagation();
    setConversationToDelete(conversationId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteConversation(conversationToDelete);
    setIsDeleteModalOpen(false);
  };

  const confirmClearAll = () => {
    clearChatHistory();
    setIsClearAllModalOpen(false);
  };

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        title="Chat History"
        padding="md"
        position="left"
        size="md"
      >
        <Stack spacing="xs">
          <TextInput
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => searchConversations(e.target.value)}
            icon={<IconSearch size={14} />}
            rightSection={
              searchQuery ? (
                <ActionIcon onClick={() => searchConversations('')}>
                  <IconX size={14} />
                </ActionIcon>
              ) : null
            }
          />
          
          <Button 
            color="red" 
            variant="outline"
            leftIcon={<IconTrash size={16} />}
            onClick={() => setIsClearAllModalOpen(true)}
            style={{ marginTop: '10px' }}
          >
            Clear All Conversations
          </Button>

          <Text size="xs" color="dimmed" mt="md">
            {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
          </Text>

          <ScrollArea style={{ height: 'calc(100vh - 200px)' }}>
            <Stack spacing="xs">
              {filteredConversations.map((conversation) => (
                <Box
                  key={conversation.id}
                  sx={(theme) => ({
                    padding: '10px 15px',
                    borderRadius: '4px',
                    backgroundColor: conversation.id === activeConversationId ? theme.colors.blue[0] : 'white',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: conversation.id === activeConversationId ? 
                      theme.colorScheme === 'dark' ? 'rgba(66, 99, 235, 0.3)' : theme.colors.blue[3] 
                      : theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      backgroundColor: conversation.id === activeConversationId ? theme.colors.blue[1] : theme.colors.gray[0],
                    }
                  })}
                  onClick={() => {
                    setActiveConversation(conversation.id);
                    onClose();
                  }}
                >
                  <Group position="apart" align="flex-start" noWrap>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <Text weight={500} lineClamp={1} size="sm">
                        {conversation.title}
                      </Text>
                      <Text size="xs" color="dimmed">
                        {conversation.messages.length} messages • {
                          (() => {
                            try {
                              // Use updatedAt if available, otherwise createdAt, with a fallback to current date
                              const dateToFormat = conversation.updatedAt || conversation.createdAt;
                              if (dateToFormat && dateToFormat !== 'Invalid Date') {
                                return format(new Date(dateToFormat), 'MMM d, yyyy');
                              } else {
                                return 'Recently';
                              }
                            } catch (err) {
                              console.warn('Invalid date in conversation:', conversation.id);
                              return 'Recently';
                            }
                          })()
                        }
                      </Text>
                    </div>
                    <ActionIcon 
                      color="red" 
                      variant="subtle"
                      onClick={(e) => handleDeleteConversation(e, conversation.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Box>
              ))}
              
              {filteredConversations.length === 0 && (
                <Text color="dimmed" align="center" mt="xl">
                  {searchQuery ? 'No conversations match your search.' : 'No conversations yet.'}
                </Text>
              )}
            </Stack>
          </ScrollArea>
        </Stack>
      </Drawer>
      
      {/* Delete confirmation modal */}
      <Modal
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Conversation"
        size="sm"
      >
        <Text size="sm">Are you sure you want to delete this conversation? This action cannot be undone.</Text>
        <Group position="right" mt="md">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
          <Button color="red" onClick={confirmDelete}>Delete</Button>
        </Group>
      </Modal>
      
      {/* Clear all confirmation modal */}
      <Modal
        opened={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        title="Clear All Conversations"
        size="sm"
      >
        <Text size="sm">Are you sure you want to delete all conversations? This action cannot be undone.</Text>
        <Group position="right" mt="md">
          <Button variant="outline" onClick={() => setIsClearAllModalOpen(false)}>Cancel</Button>
          <Button color="red" onClick={confirmClearAll}>Clear All</Button>
        </Group>
      </Modal>
    </>
  );
}

export default ChatHistoryPanel; 