// frontend/src/components/Layout/AppLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Burger, Group, NavLink, rem, Box, Drawer, ActionIcon, Tooltip, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { IconDashboard, IconWallet, IconSettings, IconChartBar, IconChartCandle, IconStar, IconBookmark, IconCalendar, IconSun, IconMoon, IconAlertTriangle, IconFlask, IconBook, IconFileAnalytics, IconChartLine, IconNews } from '@tabler/icons-react';
import ThemeToggle from '../ThemeToggle';
import DataRefresh from '../DataRefresh';
import StickyTotalValue from '../StickyTotalValue';
import { useConfig } from '../../contexts/ConfigContext';

function AppLayout() {
  const [opened, setOpened] = useState(false);
  const [showTotalValue, setShowTotalValue] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || 'dashboard';
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const { theme: configTheme, toggleTheme } = useConfig();
  const isDark = configTheme === 'dark';
  const isDashboard = currentPath === 'dashboard';
  const isPortfolio = currentPath === 'portfolio';
  const shouldShowStickyValue = isDashboard || isPortfolio;

  // Scroll event handler to detect when to show the total value
  useEffect(() => {
    const handleScroll = () => {
      // Only activate this feature on the dashboard or portfolio pages
      if (!shouldShowStickyValue) {
        setShowTotalValue(false);
        return;
      }

      // Get the total value element on the current page
      const totalValueElement = document.querySelector('.portfolio-card .total-value-element');
      
      // If the element doesn't exist, don't show the sticky value
      if (!totalValueElement) {
        setShowTotalValue(false);
        return;
      }
      
      // Get the position of the total value element
      const rect = totalValueElement.getBoundingClientRect();
      
      // When the element scrolls past the header (60px height), show the sticky value
      if (rect.top < 60 && rect.bottom < 60) {
        setShowTotalValue(true);
      } else {
        setShowTotalValue(false);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Trigger once to check initial state
    handleScroll();
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [shouldShowStickyValue]);

  // Navigation menu items configuration for reuse
  const navItems = [
    { 
      label: "Dashboard", 
      icon: <IconDashboard style={{ width: rem(16), height: rem(16) }} />, 
      path: "/", 
      active: currentPath === 'dashboard' 
    },
    { 
      label: "Portfolio", 
      icon: <IconChartBar style={{ width: rem(16), height: rem(16) }} />, 
      path: "/portfolio", 
      active: currentPath === 'portfolio' 
    },
    { 
      label: "Markets", 
      icon: <IconChartCandle style={{ width: rem(16), height: rem(16) }} />, 
      path: "/markets", 
      active: currentPath === 'markets' 
    },
    { 
      label: "News", 
      icon: <IconNews style={{ width: rem(16), height: rem(16) }} />, 
      path: "/news", 
      active: currentPath === 'news' 
    },
    { 
      label: "Calendar", 
      icon: <IconCalendar style={{ width: rem(16), height: rem(16) }} />, 
      path: "/calendar", 
      active: currentPath === 'calendar' 
    },
    { 
      label: "Wallets", 
      icon: <IconWallet style={{ width: rem(16), height: rem(16) }} />, 
      path: "/wallets", 
      active: currentPath === 'wallets' 
    },
    { 
      label: "Risk", 
      icon: <IconAlertTriangle style={{ width: rem(16), height: rem(16) }} />, 
      path: "/risk", 
      active: currentPath === 'risk' 
    },
    { 
      label: "Risk2", 
      icon: <IconAlertTriangle style={{ width: rem(16), height: rem(16) }} />, 
      path: "/risk2", 
      active: currentPath === 'risk2' 
    },
    {
      label: "Research",
      icon: <IconFlask style={{ width: rem(16), height: rem(16) }} />,
      type: "section"
    },
    { 
      label: "Watchlist", 
      icon: <IconStar style={{ width: rem(16), height: rem(16) }} />, 
      path: "/watchlist", 
      active: currentPath === 'watchlist',
      indent: true
    },
    { 
      label: "Bookmarks", 
      icon: <IconBookmark style={{ width: rem(16), height: rem(16) }} />, 
      path: "/bookmarks", 
      active: currentPath === 'bookmarks',
      indent: true
    },
    { 
      label: "Almanac", 
      icon: <IconBook style={{ width: rem(16), height: rem(16) }} />, 
      type: "subsection",
      indent: true
    },
    { 
      label: "Asset Evaluation", 
      icon: <IconFileAnalytics style={{ width: rem(16), height: rem(16) }} />, 
      path: "/asset-evaluation", 
      active: currentPath === 'asset-evaluation',
      indent: true,
      subIndent: true
    },
    { 
      label: "Settings", 
      icon: <IconSettings style={{ width: rem(16), height: rem(16) }} />, 
      path: "/settings", 
      active: currentPath === 'settings' 
    }
  ];

  // Define a reusable tooltip style to ensure consistency
  const tooltipStyles = {
    tooltip: {
      fontSize: '12px',
      padding: '8px 12px',
      backgroundColor: isDark ? theme.colors.dark[7] : theme.colors.dark[9],
      color: 'white',
      border: isDark ? `1px solid ${theme.colors.dark[5]}` : 'none'
    }
  };

  // Navigation component that can be used in both drawer and navbar
  const NavigationLinks = () => (
    <>
      {navItems.map((item) => (
        item.type === "section" ? (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={item.icon}
            variant="filled"
            disabled
            styles={(theme) => ({
              root: {
                marginTop: '10px',
                color: item.label === "Research" ? "#1c7ed6" : (isDark ? theme.colors.blue[4] : theme.colors.blue[6]),
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'transparent'
                }
              },
              leftSection: {
                color: item.label === "Research" ? "#1c7ed6" : (isDark ? theme.colors.blue[4] : theme.colors.blue[6])
              }
            })}
          />
        ) : item.type === "subsection" ? (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={item.icon}
            disabled
            pl={item.indent ? 'lg' : 'md'}
            styles={(theme) => ({
              root: {
                color: isDark ? theme.colors.blue[3] : theme.colors.blue[7],
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'transparent'
                }
              },
              leftSection: {
                color: isDark ? theme.colors.blue[4] : theme.colors.blue[6]
              }
            })}
          />
        ) : (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={item.icon}
            active={item.active}
            onClick={() => {
              navigate(item.path);
              setOpened(false); // Close drawer after navigation
            }}
            pl={item.subIndent ? 'xl' : (item.indent ? 'lg' : 'md')}
            styles={() => ({
              leftSection: {
                transition: 'color 0.3s ease'
              }
            })}
          />
        )
      ))}
    </>
  );

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group justify="flex-start">
            <Burger
              opened={opened}
              onClick={() => setOpened(!opened)}
              size="sm"
            />
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative', minWidth: '280px', height: '100%' }}>
              <h2 
                onClick={() => navigate('/')} 
                style={{ 
                  cursor: 'pointer',
                  margin: 0,
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                  opacity: showTotalValue ? 0 : 1,
                  transform: showTotalValue ? 'translateY(-20px)' : 'translateY(0)',
                  position: showTotalValue ? 'absolute' : 'relative',
                  pointerEvents: showTotalValue ? 'none' : 'auto'
                }}
              >
                Project Skittles
              </h2>
              <StickyTotalValue visible={showTotalValue} />
            </div>
          </Group>
          <Group justify="flex-end">
            <DataRefresh size="lg" />
            <ThemeToggle size="lg" />
            <Tooltip 
              label="Settings"
              withArrow
              position="bottom"
              color={isDark ? 'dark.7' : 'dark.9'}
              styles={tooltipStyles}
            >
              <ActionIcon 
                size="lg" 
                variant="subtle" 
                onClick={() => navigate('/settings')}
                aria-label="Settings"
              >
                <IconSettings style={{ width: rem(20), height: rem(20) }} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Drawer for the slide-out menu */}
      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        title="Menu"
        padding="md"
        size="xs"
        position="left"
        overlayProps={{ opacity: 0.3, blur: 2 }}
        transitionProps={{
          transition: 'slide-right',
          duration: 250,
        }}
      >
        <NavigationLinks />
      </Drawer>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default AppLayout;