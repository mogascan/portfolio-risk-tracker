import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { 
  AppShell, 
  Navbar, 
  Header, 
  Text, 
  Group, 
  MediaQuery, 
  Burger, 
  ActionIcon, 
  useMantineTheme, 
  useMantineColorScheme,
  Box,
  NavLink as MantineNavLink,
  ScrollArea,
  Flex,
  rem
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconHome, 
  IconChartLine, 
  IconDeviceAnalytics, 
  IconNews, 
  IconSettings, 
  IconMoonStars, 
  IconSun,
  IconChartCandle
} from '@tabler/icons-react';
import ThemeToggle from './ThemeToggle';
import DataRefresh from './DataRefresh';

export default function AppLayout() {
  const theme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure(false);
  const location = useLocation();
  
  const navItems = [
    { label: 'Dashboard', icon: <IconHome />, link: '/' },
    { label: 'Markets', icon: <IconChartLine />, link: '/markets' },
    { label: 'Portfolio', icon: <IconDeviceAnalytics />, link: '/portfolio' },
    { label: 'News', icon: <IconNews />, link: '/news' }
  ];
  
  const NavLinks = () => {
    return navItems.map((item) => (
      <MantineNavLink
        key={item.label}
        label={item.label}
        leftSection={item.icon}
        component={NavLink}
        to={item.link}
        active={location.pathname === item.link}
        variant="filled"
      />
    ));
  };

  return (
    <AppShell
      padding="md"
      header={{ height: 60 }}
      navbar={{ 
        width: 280, 
        breakpoint: 'sm', 
        collapsed: { mobile: !opened } 
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" position="apart">
          <Group>
            <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={toggle}
                size="sm"
                color={theme.colors.gray[6]}
              />
            </MediaQuery>
            <Text size="lg" weight={700}>Crypto Portfolio Tracker</Text>
          </Group>
          
          <Group>
            <DataRefresh />
            <ThemeToggle />
          </Group>
        </Group>
      </AppShell.Header>
      
      <AppShell.Navbar p="xs">
        <ScrollArea>
          <NavLinks />
        </ScrollArea>
      </AppShell.Navbar>
      
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
} 