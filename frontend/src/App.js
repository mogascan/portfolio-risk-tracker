// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import './App.css';

// Layout components
import AppLayout from './components/Layout/AppLayout';

// Context providers
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { AuthProvider } from './contexts/AuthContext';
import { AIProvider } from './contexts/AIContext';
import { MarketProvider } from './contexts/MarketContext';
import { WatchlistProvider } from './contexts/WatchlistContext';
import { BookmarkProvider } from './contexts/BookmarkContext';
import { CalendarProvider } from './contexts/CalendarContext';

// Page components
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Settings from './pages/Settings';
import WalletManager from './pages/WalletManager';
import Login from './pages/Login';
import Markets from './pages/Markets';
import Watchlist from './pages/Watchlist';
import Bookmarks from './pages/Bookmarks';
import Calendar from './pages/Calendar';
import RiskAssessmentDashboard from './pages/RiskAssessment';
import CryptoPortfolioMetrics from './pages/RiskAssessment2';
import AssetEvaluation from './pages/AssetEvaluation';
import News from './pages/News';

// Create a base theme 
const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Roboto\', \'Oxygen\', \'Ubuntu\', \'Cantarell\', \'Fira Sans\', \'Droid Sans\', \'Helvetica Neue\', sans-serif',
  // Customize breakpoints - default 'sm' is 768px
  breakpoints: {
    xs: '30em',     // 480px
    sm: '64em',     // 768px - you can change this value, e.g. to '40em' (640px)
    md: '64em',     // 1024px
    lg: '74em',     // 1184px
    xl: '90em',     // 1440px
  },
  colors: {
    // Define custom colors if needed
    dark: [
      '#C1C2C5', // 0
      '#A6A7AB', // 1
      '#909296', // 2
      '#5C5F66', // 3
      '#373A40', // 4
      '#2C2E33', // 5
      '#25262B', // 6
      '#1A1B1E', // 7
      '#141517', // 8
      '#101113', // 9
    ],
  },
  components: {
    Paper: {
      defaultProps: {
        p: 'md'
      },
      styles: (theme) => ({
        root: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
          color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
          transition: 'background-color 0.3s ease, color 0.3s ease'
        }
      })
    },
    AppShell: {
      styles: (theme) => ({
        main: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.white,
          transition: 'background-color 0.3s ease'
        }
      })
    },
    Card: {
      styles: (theme) => ({
        root: {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
          color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
          transition: 'background-color 0.3s ease, color 0.3s ease'
        }
      })
    },
    Table: {
      styles: (theme) => ({
        root: {
          '& thead tr th': {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
            color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
            transition: 'background-color 0.3s ease, color 0.3s ease'
          },
          '& tbody tr td': {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
            color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
            borderColor: theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3],
            transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease'
          },
          '& tbody tr:hover td': {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0]
          }
        }
      })
    },
    NavLink: {
      styles: (theme) => ({
        root: {
          '&[data-active]': {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.blue[0]
          },
          '&:hover': {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.blue[6] : theme.colors.blue[0],
            color: theme.colorScheme === 'dark' ? theme.black : theme.black,
            '& svg': {
              color: theme.colorScheme === 'dark' ? theme.black : theme.black
            }
          }
        }
      })
    },
    Tabs: {
      styles: (theme) => ({
        tab: {
          '&:hover': {
            backgroundColor: '#1c7ed6',
            color: theme.colorScheme === 'dark' ? '#000000' : '#ffffff',
            transition: 'background-color 0.2s ease'
          }
        },
        tabsList: {
          borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[3]}`
        },
        panel: {
          padding: theme.spacing.md
        }
      })
    },
    // Add global styles for Mantine tabs (this ensures the styles are applied)
    MantineProvider: {
      styles: (theme) => ({
        root: {
          '.mantine-Tabs-tab:hover': {
            backgroundColor: '#1c7ed6 !important',
            color: theme.colorScheme === 'dark' ? '#000000 !important' : '#ffffff !important'
          },
          '.mantine-Tabs-tabActive': {
            borderBottomColor: `${theme.colors.blue[5]} !important`
          }
        }
      })
    }
  }
});

// App wrapper that has access to config context
function AppWithTheme() {
  const { theme: colorScheme } = useConfig();
  
  return (
    <MantineProvider 
      theme={{ 
        ...theme, 
        colorScheme,
        primaryColor: 'blue',
        fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Roboto\', \'Oxygen\', \'Ubuntu\', \'Cantarell\', \'Fira Sans\', \'Droid Sans\', \'Helvetica Neue\', sans-serif',
        white: colorScheme === 'dark' ? '#25262b' : '#ffffff',
        black: colorScheme === 'dark' ? '#c1c2c5' : '#1A1B1E',
        colors: {
          ...theme.colors,
          // Make sure dark colors are properly defined
          dark: [
            '#C1C2C5', // 0
            '#A6A7AB', // 1
            '#909296', // 2
            '#5C5F66', // 3
            '#373A40', // 4
            '#2C2E33', // 5
            '#25262B', // 6
            '#1A1B1E', // 7
            '#141517', // 8
            '#101113', // 9
          ],
        },
      }}
    >
      <Notifications />
      <Router>
        <AuthProvider>
          <MarketProvider>
            <PortfolioProvider>
              <WatchlistProvider>
                <AIProvider>
                  <BookmarkProvider>
                    <CalendarProvider>
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<AppLayout />}>
                          <Route index element={<Dashboard />} />
                          <Route path="portfolio" element={<Portfolio />} />
                          <Route path="markets" element={<Markets />} />
                          <Route path="watchlist" element={<Watchlist />} />
                          <Route path="calendar" element={<Calendar />} />
                          <Route path="wallets" element={<WalletManager />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="bookmarks" element={<Bookmarks />} />
                          <Route path="risk" element={<RiskAssessmentDashboard />} />
                          <Route path="risk2" element={<CryptoPortfolioMetrics />} />
                          <Route path="asset-evaluation" element={<AssetEvaluation />} />
                          <Route path="news" element={<News />} />
                        </Route>
                      </Routes>
                    </CalendarProvider>
                  </BookmarkProvider>
                </AIProvider>
              </WatchlistProvider>
            </PortfolioProvider>
          </MarketProvider>
        </AuthProvider>
      </Router>
    </MantineProvider>
  );
}

function App() {
  return (
    <ConfigProvider>
      <AppWithTheme />
    </ConfigProvider>
  );
}

export default App;