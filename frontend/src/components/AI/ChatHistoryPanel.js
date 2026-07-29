import React, { useState } from 'react';
import { Drawer, TextInput, Stack, Text, Group, ActionIcon, ScrollArea, Button, Modal, Box, useMantineColorScheme } from '@mantine/core';
import { IconSearch, IconTrash, IconX } from '@tabler/icons-react';
import { useAI } from '../../contexts/AIContext';
import { format } from 'date-fns';
import classes from './ChatHistoryPanel.module.css';

function ChatHistoryPanel({ opened, onClose }) {
  const { conversations, activeConversationId, setActiveConversation, deleteConversation, searchQuery, searchConversations, clearChatHistory } = useAI();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
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
        <Stack gap="xs">
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
            <Stack gap="xs">
              {filteredConversations.map((conversation) => (
                <Box
                  key={conversation.id}
                  className={[
                    classes.conversationItem,
                    isDark ? classes.conversationItemDark : '',
                    conversation.id === activeConversationId ? classes.conversationItemActive : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    setActiveConversation(conversation.id);
                    onClose();
                  }}
                >
                  <Group justify="space-between" align="flex-start" noWrap>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <Text fw={500} lineClamp={1} size="sm">
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
                <Text color="dimmed" ta="center" mt="xl">
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
        <Group justify="flex-end" mt="md">
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
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={() => setIsClearAllModalOpen(false)}>Cancel</Button>
          <Button color="red" onClick={confirmClearAll}>Clear All</Button>
        </Group>
      </Modal>
    </>
  );
}

export default ChatHistoryPanel; 
