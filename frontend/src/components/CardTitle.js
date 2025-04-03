// CardTitle to control the title of the cards globally
import React from 'react';
import { Text, useMantineColorScheme, useMantineTheme } from '@mantine/core';

function CardTitle({ children, ...props }) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';
  
  // Get theme color if not provided
  const defaultColor = isDark ? theme.white : theme.black;
  
  return (
    <Text 
      size="md" 
      weight={700}  
      style={{ 
        lineHeight: 1.1,
        marginBottom: '4px',
        color: 'blue',  // Add a distinctive color to test
        ...props.style
      }}
      color={props.color || defaultColor}
      {...props}
    >
      {children}
    </Text>
  );
}

export default CardTitle;