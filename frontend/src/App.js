// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MantineProvider, createTheme, localStorageColorSchemeManager } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import './App.css';

// Layout components
import AppLayout from './components/Layout/AppLayout';

// Context providers
import { ConfigProvider } from './contexts/ConfigContext';
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
import TokenUnlockAnalyzer from './pages/TokenUnlockAnalyzer';
import FloatEvaluation from './pages/FloatEvaluation';
import classes from './App.module.css';

const colorSchemeManager = localStorageColorSchemeManager({ key: 'theme' });

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
      classNames: {
        root: classes.paperRoot
      }
    },
    AppShell: {
      classNames: {
        main: classes.appShellMain
      }
    },
    Card: {
      classNames: {
        root: classes.cardRoot
      }
    },
    Table: {
      classNames: {
        tr: classes.tableTr,
        th: classes.tableTh,
        td: classes.tableTd
      }
    },
    NavLink: {
      classNames: {
        root: classes.navLinkRoot
      }
    },
    Tabs: {
      classNames: {
        tab: classes.tabsTab,
        list: classes.tabsList,
        panel: classes.tabsPanel
      }
    }
  }
});

// App wrapper that has access to config context
function AppWithTheme() {
  return (
    <>
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
                          <Route path="token-unlock" element={<TokenUnlockAnalyzer />} />
                          <Route path="float-evaluation" element={<FloatEvaluation />} />
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
    </>
  );
}

function App() {
  return (
    <MantineProvider
      theme={theme}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="auto"
    >
      <ConfigProvider>
        <AppWithTheme />
      </ConfigProvider>
    </MantineProvider>
  );
}

export default App;
