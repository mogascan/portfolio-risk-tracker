import React, { memo } from 'react';
import { Table, useMantineTheme, useMantineColorScheme, Container } from '@mantine/core';

const StickyTableHeader = ({ 
  visible, 
  columnStyles, 
  thStyle, 
  SortableHeader, 
  headerContent 
}) => {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Clone the thStyle to make it suitable for the sticky header
  const stickyThStyle = {
    ...thStyle,
    backgroundColor: isDark ? theme.colors.dark[7] : theme.white,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    zIndex: 1000
  };

  if (!visible) return null;

  return (
    <div style={{ 
        position: 'fixed', 
        top: 60, // Below the main header
        left: 0,
        right: 0,
        zIndex: 200,
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : -20}px)`,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: visible ? 'auto' : 'none',
        width: '100%',
        backgroundColor: isDark ? theme.colors.dark[7] : theme.white
      }}
    >
      <Container size="xl" style={{ padding: 0 }}>
        <Table striped={false} highlightOnHover={false} style={{ width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {headerContent({ columnStyles, stickyThStyle, SortableHeader })}
            </tr>
          </thead>
        </Table>
      </Container>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(StickyTableHeader); 