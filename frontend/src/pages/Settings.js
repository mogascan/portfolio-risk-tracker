// frontend/src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { Container, Paper, Title, Switch, Select, Checkbox, Button, Group, Text, Stack, Divider, Slider, NumberInput, Box, Tooltip, SimpleGrid } from '@mantine/core';
import { format } from 'date-fns';
import ThemeToggle from '../components/ThemeToggle';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme, maxLossPercentage, updateMaxLossPercentage, takeProfit, updateTakeProfitSettings, apiBaseUrl } = useConfig();
  const { portfolio } = usePortfolio();
  const { totalValue, totalCost, absoluteProfit } = portfolio;
  
  const [settings, setSettings] = useState({
    notifications: {
      priceAlerts: true,
      portfolioUpdates: true,
      newsAlerts: false
    },
    display: {
      theme: 'light',
      currency: 'USD',
      hideSmallBalances: true,
      decimalsDisplay: 2
    },
    privacy: {
      anonymizedData: true,
      storeDataLocally: true
    },
    tax: {
      country: 'US',
      taxMethod: 'FIFO'
    },
    risk: {
      maxLossPercentage: maxLossPercentage || 8.0,
      takeProfitValue: takeProfit?.targetValue || 0,
      takeProfitPercentage: takeProfit?.targetPercentage || 20.0
    }
  });
  
  // Update local settings when theme or config changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      display: {
        ...prev.display,
        theme
      },
      risk: {
        ...prev.risk,
        maxLossPercentage,
        takeProfitValue: takeProfit?.targetValue || 0,
        takeProfitPercentage: takeProfit?.targetPercentage || 20.0
      }
    }));
  }, [theme, maxLossPercentage, takeProfit]);
  
  const [savedMessage, setSavedMessage] = useState(null);
  
  // Handle checkbox change
  const handleCheckboxChange = (section, setting) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [setting]: !prev[section][setting]
      }
    }));
  };
  
  // Handle select change
  const handleSelectChange = (e, section, setting) => {
    const { value } = e.target;
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [setting]: value
      }
    }));
  };
  
  // Handle theme change
  const handleThemeChange = (value) => {
    if (value !== theme) {
      toggleTheme();
    }
  };

  // Handle max loss percentage change
  const handleMaxLossChange = (value) => {
    // Update the max loss percentage
    setSettings(prev => ({
      ...prev,
      risk: { ...prev.risk, maxLossPercentage: value }
    }));
    
    // Immediately save to context and localStorage to persist the setting
    updateMaxLossPercentage(value);
    
    // If this is the first time setting it or entry value isn't set yet,
    // use the current portfolio value as the entry point
    if (!takeProfit.entryValue) {
      updateTakeProfitSettings({
        ...takeProfit,
        entryValue: totalValue,
        entryDate: new Date().toISOString()
      });
    }
  };

  // Handle take profit value change
  const handleTakeProfitValueChange = (value) => {
    // Calculate percentage based on current entry value
    const entryValue = takeProfit.entryValue || totalValue;
    const percentage = entryValue > 0 ? ((value - entryValue) / entryValue) * 100 : 0;
    
    // Update the local state
    setSettings(prev => ({
      ...prev,
      risk: {
        ...prev.risk,
        takeProfitValue: value,
        takeProfitPercentage: percentage
      }
    }));
    
    // Immediately save to context
    updateTakeProfitSettings({
      targetValue: value,
      targetPercentage: percentage,
      entryValue: takeProfit.entryValue || totalValue,
      entryDate: takeProfit.entryDate || new Date().toISOString()
    });
  };
  
  // Handle take profit percentage change
  const handleTakeProfitPercentageChange = (value) => {
    // Calculate value based on current entry value
    const entryValue = takeProfit.entryValue || totalValue;
    const targetValue = entryValue * (1 + (value / 100));
    
    // Update the local state
    setSettings(prev => ({
      ...prev,
      risk: {
        ...prev.risk,
        takeProfitValue: targetValue,
        takeProfitPercentage: value
      }
    }));
    
    // Immediately save to context
    updateTakeProfitSettings({
      targetValue: targetValue,
      targetPercentage: value,
      entryValue: takeProfit.entryValue || totalValue,
      entryDate: takeProfit.entryDate || new Date().toISOString()
    });
  };

  // Calculate stop loss value based on entry value and max loss setting
  const calculateStopLossValue = () => {
    // Use the entry value or current total value as the baseline if entry value isn't set
    const baselineValue = takeProfit.entryValue || totalValue;
    const stopLossPercentage = (100 - settings.risk.maxLossPercentage) / 100;
    return baselineValue * stopLossPercentage;
  };
  
  // Calculate protected value - this is the amount that would be preserved at stop loss
  const calculateProtectedValue = () => {
    const baselineValue = takeProfit.entryValue || totalValue;
    return baselineValue - (baselineValue * settings.risk.maxLossPercentage / 100);
  };

  // Format the entry date for display
  const formatEntryDate = () => {
    if (!takeProfit.entryDate) return 'Not set';
    try {
      return format(new Date(takeProfit.entryDate), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Handle settings save
  const handleSaveSettings = () => {
    // Don't need to save max loss percentage here anymore since it's saved immediately when changed
    
    // In a real app, this would call an API to save settings
    console.log('Saving settings:', settings);
    
    // Show saved message
    setSavedMessage('Settings saved successfully!');
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setSavedMessage(null);
    }, 3000);
  };
  
  // Define a safe formatValue function at the top of the Settings component
  const formatValue = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00';
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Add this new function to reset the entry point
  const resetEntryPoint = () => {
    updateTakeProfitSettings({
      ...takeProfit,
      entryValue: totalValue,
      entryDate: new Date().toISOString()
    });
    
    // Update the local state to reflect the changes immediately
    setSettings(prev => ({
      ...prev,
      risk: {
        ...prev.risk,
        takeProfitValue: totalValue * (1 + (prev.risk.takeProfitPercentage / 100))
      }
    }));
    
    // Show confirmation message
    setSavedMessage('Entry point reset to current portfolio value!');
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setSavedMessage(null);
    }, 3000);
  };
  
  // Add this function to handle the reset to defaults action
  const handleResetToDefaults = () => {
    // Reset max loss percentage to default
    updateMaxLossPercentage(8.0);
    
    // Reset take profit settings to default with current portfolio value as entry point
    updateTakeProfitSettings({
      targetValue: totalValue * 1.2, // 20% profit target
      targetPercentage: 20.0,
      entryValue: totalValue,
      entryDate: new Date().toISOString()
    });
    
    // Reset local state
    setSettings({
      display: {
        currency: 'USD',
        theme: theme,
        hideSmallBalances: false,
        decimalsDisplay: 2
      },
      risk: {
        maxLossPercentage: 8.0,
        takeProfitValue: totalValue * 1.2,
        takeProfitPercentage: 20.0
      },
      notifications: {
        priceAlerts: false,
        portfolioUpdates: false,
        newsAlerts: false
      },
      tax: {
        country: 'US',
        taxMethod: 'FIFO'
      }
    });
    
    // Show confirmation message
    setSavedMessage('Settings reset to defaults!');
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setSavedMessage(null);
    }, 3000);
  };
  
  return (
    <Container size="xl" mb="xl">
      <Title order={1} mb="md">Settings</Title>
      
      <Paper mb="xl">
        <Title order={2} size="h3" mb="md">API Connection Test</Title>
        <Box mb="xl">
          <Button 
            onClick={async () => {
              try {
                const response = await fetch(`${apiBaseUrl}/api/v1/market/topcoins?limit=1`);
                const data = await response.json();
                alert(`API Connection Success! Got ${data.length} coins.`);
                console.log("API test data:", data);
              } catch (error) {
                alert(`API Connection Error: ${error.message}`);
                console.error("API test error:", error);
              }
            }} 
            color="blue"
          >
            Test API Connection
          </Button>
        </Box>
      </Paper>
      
      <Paper mb="xl">
        <Title order={2} size="h3" mb="md">Theme Settings</Title>
        <SimpleGrid cols={1}>
          <Paper withBorder p="md" mb="md">
            <Title order={2} mb="md">Appearance</Title>
            <Stack spacing="md">
              <Group justify="space-between">
                <Text>Theme</Text>
                <Group>
                  <Text size="sm" color="dimmed">{theme === 'dark' ? 'Dark' : 'Light'} Mode</Text>
                  <ThemeToggle size="lg" />
                </Group>
              </Group>
              
              <Divider />
              
              <Group justify="space-between">
                <Text>Currency</Text>
                <Select
                  value={settings.display.currency}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    display: { ...prev.display, currency: value }
                  }))}
                  data={[
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'GBP', label: 'GBP (£)' },
                    { value: 'JPY', label: 'JPY (¥)' },
                    { value: 'BTC', label: 'BTC (₿)' },
                    { value: 'ETH', label: 'ETH (Ξ)' }
                  ]}
                  style={{ width: 150 }}
                />
              </Group>
              
              <Group justify="space-between">
                <Text>Hide Small Balances</Text>
                <Switch
                  checked={settings.display.hideSmallBalances}
                  onChange={() => handleCheckboxChange('display', 'hideSmallBalances')}
                />
              </Group>
              
              <Group justify="space-between">
                <Text>Decimal Places</Text>
                <Select
                  value={settings.display.decimalsDisplay.toString()}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    display: { ...prev.display, decimalsDisplay: parseInt(value) }
                  }))}
                  data={[
                    { value: '2', label: '2 places' },
                    { value: '3', label: '3 places' },
                    { value: '4', label: '4 places' },
                    { value: '6', label: '6 places' },
                    { value: '8', label: '8 places' }
                  ]}
                  style={{ width: 150 }}
                />
              </Group>
            </Stack>
          </Paper>
          
          <Paper withBorder p="md" mb="md">
            <Title order={2} mb="md">Risk Management</Title>
            <Stack spacing="md">
              <div>
                <Title order={4} mb="xs">Stop Loss</Title>
                <Group position="apart" mb="xs">
                  <div>
                    <Text>Maximum Loss Percentage</Text>
                    <Text size="sm" color="dimmed">Set the maximum percentage loss you're willing to accept (Stop Loss)</Text>
                  </div>
                  <NumberInput
                    value={settings.risk.maxLossPercentage}
                    onChange={handleMaxLossChange}
                    min={1}
                    max={20}
                    step={0.5}
                    precision={1}
                    rightSection="%"
                    styles={{
                      input: { textAlign: 'right', paddingRight: '30px', width: '65px' },
                      root: { width: '65px' }
                    }}
                  />
                </Group>
                <Slider
                  value={settings.risk.maxLossPercentage}
                  onChange={handleMaxLossChange}
                  min={1}
                  max={20}
                  step={0.5}
                  label={value => `${value}%`}
                  marks={[
                    { value: 5, label: '5%' },
                    { value: 10, label: '10%' },
                    { value: 15, label: '15%' },
                    { value: 20, label: '20%' }
                  ]}
                  styles={(theme) => ({
                    track: { backgroundColor: theme.colors.red[1] },
                    bar: { backgroundColor: theme.colors.red[6] },
                    mark: { backgroundColor: theme.colors.red[3] },
                    markLabel: { fontSize: theme.fontSizes.xs }
                  })}
                />
                <Box mt={20}>
                  <Group position="apart">
                    <Text size="sm" color="dimmed">
                      Stop loss will trigger at {(100 - settings.risk.maxLossPercentage).toFixed(1)}% of total value
                    </Text>
                    <Text size="sm" fw={600} c="red">
                      ${formatValue(calculateStopLossValue())}
                    </Text>
                  </Group>
                  <Group position="apart" mt={4}>
                    <Text size="sm" color="dimmed">Protected value:</Text>
                    <Text size="sm" fw={600} c="teal">
                      ${formatValue(calculateProtectedValue())}
                    </Text>
                  </Group>
                </Box>
              </div>
              
              <Divider my="md" />
              
              <div>
                <Title order={4} mb="xs">Take Profit</Title>
                <Group position="apart" mb="xs">
                  <div>
                    <Text>Take Profit Target</Text>
                    <Text size="sm" color="dimmed">Set the portfolio value at which you want to take profits</Text>
                  </div>
                  <NumberInput
                    value={settings.risk.takeProfitValue}
                    onChange={handleTakeProfitValueChange}
                    min={totalValue > 0 ? totalValue : 0}
                    step={100}
                    precision={2}
                    leftSection="$"
                    styles={{
                      input: { textAlign: 'right', width: '130px' },
                      root: { width: '130px' }
                    }}
                  />
                </Group>
                <Group position="apart" mb="xs">
                  <div>
                    <Text>Target Percentage</Text>
                    <Text size="sm" color="dimmed">Profit percentage target</Text>
                  </div>
                  <NumberInput
                    value={settings.risk.takeProfitPercentage}
                    onChange={handleTakeProfitPercentageChange}
                    min={1}
                    max={100}
                    step={1}
                    precision={1}
                    rightSection="%"
                    styles={{
                      input: { textAlign: 'right', paddingRight: '30px', width: '63px' },
                      root: { width: '63px' }
                    }}
                  />
                </Group>
                <Slider
                  value={settings.risk.takeProfitPercentage}
                  onChange={handleTakeProfitPercentageChange}
                  min={5}
                  max={50}
                  step={1}
                  label={value => `+${value}%`}
                  marks={[
                    { value: 10, label: '10%' },
                    { value: 20, label: '20%' },
                    { value: 30, label: '30%' },
                    { value: 40, label: '40%' },
                    { value: 50, label: '50%' }
                  ]}
                  styles={(theme) => ({
                    track: { backgroundColor: theme.colors.green[1] },
                    bar: { backgroundColor: theme.colors.green[6] },
                    mark: { backgroundColor: theme.colors.green[3] },
                    markLabel: { fontSize: theme.fontSizes.xs }
                  })}
                />
                <Box mt={20}>
                  <Group position="apart">
                    <Tooltip 
                      label={`Portfolio value when take profit was set`}
                      withArrow
                      position="top"
                      color={theme === 'dark' ? 'dark' : 'gray'}
                    >
                      <Text size="sm" color="dimmed" style={{ textDecoration: 'underline dotted' }}>
                        Entry value:
                      </Text>
                    </Tooltip>
                    <Text size="sm" fw={600} c="blue">
                      ${formatValue(takeProfit.entryValue || 0)}
                    </Text>
                  </Group>
                  <Group position="apart" mt={4}>
                    <Tooltip 
                      label={`Date when take profit was set`}
                      withArrow
                      position="top"
                      color={theme === 'dark' ? 'dark' : 'gray'}
                    >
                      <Text size="sm" color="dimmed" style={{ textDecoration: 'underline dotted' }}>
                        Entry date:
                      </Text>
                    </Tooltip>
                    <Text size="sm" fw={600} c="dimmed">
                      {formatEntryDate()}
                    </Text>
                  </Group>
                  <Group position="right" mt={12}>
                    <Button 
                      variant="outline" 
                      size="xs" 
                      color="blue"
                      onClick={resetEntryPoint}
                    >
                      Reset Entry Point
                    </Button>
                  </Group>
                  <Group position="apart" mt={8}>
                    <Text size="sm" color="dimmed">Take profit target:</Text>
                    <Text size="sm" fw={600} c="green">
                      ${formatValue(settings.risk.takeProfitValue)}
                    </Text>
                  </Group>
                  <Group position="apart" mt={4}>
                    <Text size="sm" color="dimmed">Target percentage:</Text>
                    <Text size="sm" fw={600} c="green">
                      +{Number(settings.risk.takeProfitPercentage).toFixed(1)}%
                    </Text>
                  </Group>
                </Box>
              </div>
              
              <Divider my="md" />
              
              <div>
                <Title order={4} mb="xs">Portfolio Summary</Title>
                <Box>
                  <Group position="apart" mt={8}>
                    <Text size="sm" color="dimmed">Total cost (purchase value):</Text>
                    <Text size="sm" fw={600} c="gray">
                      ${formatValue(totalCost)}
                    </Text>
                  </Group>
                  <Group position="apart" mt={8}>
                    <Text size="sm" color="dimmed">Current portfolio value:</Text>
                    <Text size="sm" fw={600} c="blue">
                      ${formatValue(totalValue)}
                    </Text>
                  </Group>
                  <Group position="apart" mt={8}>
                    <Text size="sm" color="dimmed">Total profit/loss:</Text>
                    <Text size="sm" fw={600} c={absoluteProfit > 0 ? "teal" : "red"}>
                      ${formatValue(absoluteProfit)}
                    </Text>
                  </Group>
                </Box>
              </div>
            </Stack>
          </Paper>
          
          <Paper withBorder p="md" mb="md">
            <Title order={2} mb="md">Notifications</Title>
            <Stack spacing="md">
              <Group justify="space-between">
                <div>
                  <Text>Price Alerts</Text>
                  <Text size="sm" color="dimmed">Receive alerts when prices change significantly</Text>
                </div>
                <Switch
                  checked={settings.notifications.priceAlerts}
                  onChange={() => handleCheckboxChange('notifications', 'priceAlerts')}
                />
              </Group>
              
              <Group justify="space-between">
                <div>
                  <Text>Portfolio Updates</Text>
                  <Text size="sm" color="dimmed">Receive daily or weekly portfolio summaries</Text>
                </div>
                <Switch
                  checked={settings.notifications.portfolioUpdates}
                  onChange={() => handleCheckboxChange('notifications', 'portfolioUpdates')}
                />
              </Group>
              
              <Group justify="space-between">
                <div>
                  <Text>News Alerts</Text>
                  <Text size="sm" color="dimmed">Receive alerts about important news related to your holdings</Text>
                </div>
                <Switch
                  checked={settings.notifications.newsAlerts}
                  onChange={() => handleCheckboxChange('notifications', 'newsAlerts')}
                />
              </Group>
            </Stack>
          </Paper>
          
          {/* Privacy section commented out
          <Paper withBorder p="md" mb="md">
            <Title order={2} mb="md">Privacy</Title>
            <Stack spacing="md">
              <Group justify="space-between">
                <div>
                  <Text>Share Anonymized Data</Text>
                  <Text size="sm" color="dimmed">Help improve the app by sharing anonymized usage data</Text>
                </div>
                <Switch
                  checked={settings.privacy.anonymizedData}
                  onChange={() => handleCheckboxChange('privacy', 'anonymizedData')}
                />
              </Group>
              
              <Group justify="space-between">
                <div>
                  <Text>Store Data Locally</Text>
                  <Text size="sm" color="dimmed">Store portfolio data locally for privacy</Text>
                </div>
                <Switch
                  checked={settings.privacy.storeDataLocally}
                  onChange={() => handleCheckboxChange('privacy', 'storeDataLocally')}
                />
              </Group>
            </Stack>
          </Paper>
          */}
          
          <Paper withBorder p="md" mb="md">
            <Title order={2} mb="md">Tax Settings</Title>
            <Stack spacing="md">
              <Group justify="space-between">
                <Text>Country</Text>
                <Select
                  value={settings.tax.country}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    tax: { ...prev.tax, country: value }
                  }))}
                  data={[
                    { value: 'US', label: 'United States' },
                    { value: 'CA', label: 'Canada' },
                    { value: 'UK', label: 'United Kingdom' },
                    { value: 'AU', label: 'Australia' },
                    { value: 'DE', label: 'Germany' },
                    { value: 'FR', label: 'France' },
                    { value: 'JP', label: 'Japan' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  style={{ width: 200 }}
                />
              </Group>
              
              <Group justify="space-between">
                <div>
                  <Text>Tax Calculation Method</Text>
                  <Text size="sm" color="dimmed">Method for calculating capital gains/losses</Text>
                </div>
                <Select
                  value={settings.tax.taxMethod}
                  onChange={(value) => setSettings(prev => ({
                    ...prev,
                    tax: { ...prev.tax, taxMethod: value }
                  }))}
                  data={[
                    { value: 'FIFO', label: 'First In, First Out (FIFO)' },
                    { value: 'LIFO', label: 'Last In, First Out (LIFO)' },
                    { value: 'HIFO', label: 'Highest In, First Out (HIFO)' },
                    { value: 'AVG', label: 'Average Cost' }
                  ]}
                  style={{ width: 250 }}
                />
              </Group>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Paper>
      
      {savedMessage && (
        <Paper p="sm" mb="md" withBorder style={{ backgroundColor: 'var(--mantine-color-green-light)' }}>
          <Text>{savedMessage}</Text>
        </Paper>
      )}
      
      <Group justify="flex-end" gap="md" mt="xl">
        <Button variant="outline" color="gray" onClick={handleResetToDefaults}>Reset to Defaults</Button>
        <Button onClick={handleSaveSettings}>Save Settings</Button>
      </Group>
      
      <Text mt="xl" size="sm" color="dimmed">
        <strong>Account:</strong> {user ? user.email : 'Not logged in'}
      </Text>
    </Container>
  );
};

export default Settings;