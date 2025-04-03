import React from 'react';
import { ActionIcon, Tooltip, useMantineTheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useConfig } from '../contexts/ConfigContext';

function ThemeToggle({ size = 'md' }) {
  const { theme, toggleTheme } = useConfig();
  const mantineTheme = useMantineTheme();
  const isDark = theme === 'dark';

  return (
    <Tooltip 
      label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      withArrow
      position="bottom"
      color={isDark ? 'dark.9' : 'dark.9'}
      styles={{
        tooltip: {
          fontSize: '12px',
          padding: '8px 12px',
          color: 'white'
        }
      }}
    >
      <ActionIcon
        variant="transparent"
        color={isDark ? 'yellow' : 'blue'}
        onClick={toggleTheme}
        size={size}
      >
        {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}

export default ThemeToggle; 