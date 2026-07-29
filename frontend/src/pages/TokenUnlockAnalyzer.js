import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Container, Title, Paper, TextInput, Group, Button, Select, Text, Progress, Stack, SimpleGrid, Box, NumberInput, Badge, Alert, Loader, Divider } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle, IconAlertTriangle, IconCoin, IconChartLine } from '@tabler/icons-react';
import axios from 'axios';
import { useWatchlist } from '../contexts/WatchlistContext';
import './TokenUnlockAnalyzer.css';

// Vesting schedule options
const vestingOptions = [
  { value: 'none', label: 'No vesting (fully unlocked)' },
  { value: 'linear', label: 'Linear vesting' },
  { value: 'cliff', label: 'Cliff + Linear vesting' }
];

// Default allocation data
const defaultAllocations = [
  { id: 1, name: 'Investors & Advisors', percentage: 32.5, amount: 325000000, vestingType: 'linear', vestingDuration: 24, cliffDuration: 0 },
  { id: 2, name: 'Team', percentage: 23.26, amount: 232600000, vestingType: 'linear', vestingDuration: 36, cliffDuration: 0 },
  { id: 3, name: 'DAO Treasury', percentage: 27.24, amount: 272400000, vestingType: 'none', vestingDuration: 0, cliffDuration: 0 },
  { id: 4, name: 'Airdrop', percentage: 11, amount: 110000000, vestingType: 'none', vestingDuration: 0, cliffDuration: 0 },
  { id: 5, name: 'Binance Launchpool', percentage: 2, amount: 20000000, vestingType: 'none', vestingDuration: 0, cliffDuration: 0 },
  { id: 6, name: 'Liquidity', percentage: 3, amount: 30000000, vestingType: 'none', vestingDuration: 0, cliffDuration: 0 },
  { id: 7, name: 'Protocol Guild', percentage: 1, amount: 10000000, vestingType: 'none', vestingDuration: 0, cliffDuration: 0 }
];

// Generate random colors for chart
const generateColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const TokenUnlockAnalyzer = () => {
  // States
  const [totalSupply, setTotalSupply] = useState(1000000000);
  const [allocations, setAllocations] = useState(defaultAllocations);
  const [currentDate] = useState(new Date());
  const [launchDate, setLaunchDate] = useState(new Date());
  const [chartData, setChartData] = useState([]);
  const [circulatingSupply, setCirculatingSupply] = useState(0);
  const [floatPercentage, setFloatPercentage] = useState(0);
  const [allocationColors, setAllocationColors] = useState({});
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [floatClassification, setFloatClassification] = useState('');
  
  // New states for watchlist integration
  const { watchlist } = useWatchlist();
  const [selectedToken, setSelectedToken] = useState(null);
  const [tokenOptions, setTokenOptions] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [loadingMarketData, setLoadingMarketData] = useState(false);

  // Helper function to validate and fix allocations
  const validateAllocations = (allocs) => {
    return allocs.map(alloc => {
      // Create a copy we can validate
      const validAlloc = { ...alloc };
      
      // Ensure ID is present
      if (!validAlloc.id) {
        validAlloc.id = Math.random().toString(36).substr(2, 9);
      }
      
      // Ensure vestingType is valid
      if (!validAlloc.vestingType || !['none', 'linear', 'cliff'].includes(validAlloc.vestingType)) {
        validAlloc.vestingType = 'none';
      }
      
      // Ensure durations make sense
      if (validAlloc.vestingType === 'none') {
        validAlloc.vestingDuration = 0;
        validAlloc.cliffDuration = 0;
      } else if (validAlloc.vestingType === 'linear') {
        validAlloc.vestingDuration = validAlloc.vestingDuration || 12;
        validAlloc.cliffDuration = 0;
      } else if (validAlloc.vestingType === 'cliff') {
        validAlloc.vestingDuration = validAlloc.vestingDuration || 12;
        validAlloc.cliffDuration = validAlloc.cliffDuration || 0;
        
        // Cliff duration must be less than vesting duration
        if (validAlloc.cliffDuration >= validAlloc.vestingDuration) {
          validAlloc.cliffDuration = Math.max(0, validAlloc.vestingDuration - 1);
        }
      }
      
      return validAlloc;
    });
  };

  // Initialize random colors for allocations
  useEffect(() => {
    const newColors = {};
    allocations.forEach(allocation => {
      newColors[allocation.id] = generateColor();
    });
    setAllocationColors(newColors);
  }, []);
  
  // Validate allocations on initial load
  useEffect(() => {
    setAllocations(validateAllocations(defaultAllocations));
  }, []);

  // Calculate token metrics when data changes
  useEffect(() => {
    calculateTokenMetrics();
  }, [allocations, totalSupply, currentDate, launchDate]);

  // Format token options for selector
  useEffect(() => {
    if (watchlist && watchlist.length > 0) {
      const options = watchlist
        .filter(token => token) // Filter out any null or undefined tokens
        .map((token, index) => {
          // Ensure we have a valid value, using fallbacks
          const value = token.id || token.symbol || `token-${index}`;
          return {
            value, // Must have a value property
            label: `${token.name || 'Unknown'} (${(token.symbol || '').toUpperCase()})`,
            token: token
          };
        });
      setTokenOptions(options);
    }
  }, [watchlist]);
  
  // Fetch market data when token is selected
  useEffect(() => {
    if (selectedToken) {
      fetchTokenMarketData(selectedToken);
    }
  }, [selectedToken]);

  // Add new allocation
  const addAllocation = () => {
    const newId = allocations.length > 0 ? Math.max(...allocations.map(a => a.id)) + 1 : 1;
    const newAllocation = {
      id: newId,
      name: `Allocation ${newId}`,
      percentage: 0,
      amount: 0,
      vestingType: 'none',
      vestingDuration: 0,
      cliffDuration: 0
    };
    setAllocations([...allocations, newAllocation]);
    setAllocationColors({
      ...allocationColors,
      [newId]: generateColor()
    });
    
    notifications.show({
      title: 'Allocation Added',
      message: 'New token allocation has been added',
      color: 'blue',
    });
  };

  // Remove allocation
  const removeAllocation = (id) => {
    setAllocations(allocations.filter(allocation => allocation.id !== id));
    
    notifications.show({
      title: 'Allocation Removed',
      message: 'Token allocation has been removed',
      color: 'red',
    });
  };

  // Update allocation
  const updateAllocation = (id, field, value) => {
    const updatedAllocations = allocations.map(allocation => {
      if (allocation.id === id) {
        const updatedAllocation = { ...allocation, [field]: value };
        
        // If percentage is updated, update amount and vice versa
        if (field === 'percentage') {
          updatedAllocation.amount = (value / 100) * totalSupply;
        } else if (field === 'amount') {
          updatedAllocation.percentage = (value / totalSupply) * 100;
        }
        
        // Ensure vestingType is always valid
        if (field === 'vestingType') {
          updatedAllocation.vestingType = value || 'none';
          
          // Reset cliff duration if changing from cliff vesting to another type
          if (value !== 'cliff') {
            updatedAllocation.cliffDuration = 0;
          }
          
          // Reset vesting duration if switching to none
          if (value === 'none') {
            updatedAllocation.vestingDuration = 0;
          } else if (!updatedAllocation.vestingDuration) {
            // Set a default duration if none exists
            updatedAllocation.vestingDuration = 12;
          }
        }
        
        return updatedAllocation;
      }
      return allocation;
    });
    
    setAllocations(updatedAllocations);
  };

  // Calculate unlocked tokens at a given timestamp for an allocation
  const calculateUnlockedTokens = (allocation, timestamp) => {
    const launchTimestamp = launchDate.getTime();
    const timeSinceLaunch = Math.max(0, timestamp - launchTimestamp);
    const monthsSinceLaunch = timeSinceLaunch / (30 * 24 * 60 * 60 * 1000);
    
    // No vesting
    if (allocation.vestingType === 'none') {
      return allocation.amount;
    }
    
    // Cliff vesting
    if (allocation.vestingType === 'cliff') {
      // Before cliff
      if (monthsSinceLaunch < allocation.cliffDuration) {
        return 0;
      }
      
      // After cliff, linear vesting
      const vestingProgress = Math.min(1, (monthsSinceLaunch - allocation.cliffDuration) / (allocation.vestingDuration - allocation.cliffDuration));
      return allocation.amount * vestingProgress;
    }
    
    // Linear vesting
    if (allocation.vestingType === 'linear') {
      const vestingProgress = Math.min(1, monthsSinceLaunch / allocation.vestingDuration);
      return allocation.amount * vestingProgress;
    }
    
    return 0;
  };

  // Calculate token metrics and chart data
  const calculateTokenMetrics = () => {
    // Calculate current circulating supply
    const currentTimestamp = currentDate.getTime();
    let currentCirculating = 0;
    
    allocations.forEach(allocation => {
      currentCirculating += calculateUnlockedTokens(allocation, currentTimestamp);
    });
    
    setCirculatingSupply(currentCirculating);
    const floatPercent = (currentCirculating / totalSupply) * 100;
    setFloatPercentage(floatPercent);
    
    // Determine float classification
    if (floatPercent < 15) {
      setFloatClassification('low');
    } else if (floatPercent < 40) {
      setFloatClassification('medium');
    } else {
      setFloatClassification('high');
    }
    
    // Generate chart data for the next 36 months
    const chartDataPoints = [];
    const launchTimestamp = launchDate.getTime();
    
    for (let month = 0; month <= 36; month++) {
      const timestamp = launchTimestamp + (month * 30 * 24 * 60 * 60 * 1000);
      const dataPoint = { month };
      
      let totalUnlocked = 0;
      
      allocations.forEach(allocation => {
        const unlocked = calculateUnlockedTokens(allocation, timestamp);
        dataPoint[allocation.name] = unlocked;
        totalUnlocked += unlocked;
      });
      
      dataPoint.totalUnlocked = totalUnlocked;
      dataPoint.percentage = (totalUnlocked / totalSupply) * 100;
      
      chartDataPoints.push(dataPoint);
    }
    
    setChartData(chartDataPoints);
    generateAIAnalysis(currentCirculating, floatPercent, chartDataPoints);
  };

  // Generate AI analysis based on token metrics
  const generateAIAnalysis = (circulating, floatPercent, chartData) => {
    // Validate we have enough data to generate analysis
    if (!chartData || chartData.length < 2) {
      setAiAnalysis("Insufficient data to generate analysis. Please ensure you have token data and allocations configured.");
      return;
    }

    const nextMonthData = chartData[1];
    const sixMonthData = chartData[6] || chartData[chartData.length - 1];
    const oneYearData = chartData[12] || chartData[chartData.length - 1];
    
    const nextMonthInflation = nextMonthData && circulating > 0 ? 
      ((nextMonthData.totalUnlocked - circulating) / circulating * 100) : 0;
    
    const sixMonthInflation = sixMonthData && circulating > 0 ? 
      ((sixMonthData.totalUnlocked - circulating) / circulating * 100) : 0;
    
    const oneYearInflation = oneYearData && circulating > 0 ? 
      ((oneYearData.totalUnlocked - circulating) / circulating * 100) : 0;
    
    // Count allocations by vesting type
    const vestingTypes = {
      none: allocations.filter(a => a.vestingType === 'none').length,
      linear: allocations.filter(a => a.vestingType === 'linear').length,
      cliff: allocations.filter(a => a.vestingType === 'cliff').length
    };

    // Find longest vesting duration
    const longestVesting = allocations.length > 0 ? 
      Math.max(...allocations.map(a => a.vestingDuration || 0)) : 0;
    
    // Generate analysis
    let analysis = `**Token Float Analysis**\n\n`;
    
    // Add market data insights if available
    if (marketData) {
      analysis += `Currently trading at ${formatPrice(marketData.price || marketData.current_price)} with a market cap of ${formatMarketValue(marketData.market_cap)} and a fully diluted valuation of ${formatMarketValue(marketData.fully_diluted_valuation)}.\n\n`;
    }
    
    // Float classification
    if (floatPercent < 15) {
      analysis += `This token currently has a **low float** (${floatPercent.toFixed(2)}% circulating), which typically indicates higher potential price volatility due to limited supply in circulation. Low float tokens often experience sharper price movements on lower trading volumes compared to higher float tokens.\n`;
    } else if (floatPercent < 40) {
      analysis += `This token currently has a **medium float** (${floatPercent.toFixed(2)}% circulating), which represents a moderate amount of supply in circulation. Medium float tokens typically have more balanced price dynamics compared to low float tokens.\n`;
    } else {
      analysis += `This token currently has a **high float** (${floatPercent.toFixed(2)}% circulating), with a significant portion of the total supply already in circulation. High float tokens tend to have more stable price action but may have limited upside potential compared to lower float tokens.\n`;
    }
    
    // Supply and inflation
    analysis += `\n\n**Supply Dynamics**\n`;
    
    if (nextMonthInflation > 5) {
      analysis += `• **High short-term inflation risk**: ${nextMonthInflation.toFixed(2)}% increase in circulating supply expected over the next month.\n`;
    }
    
    if (sixMonthInflation > 50) {
      analysis += `• **Significant supply increase**: +${sixMonthInflation.toFixed(2)}% circulating supply in the next 6 months, which may create selling pressure.\n`;
    } else if (sixMonthInflation > 20) {
      analysis += `• **Moderate supply increase**: +${sixMonthInflation.toFixed(2)}% circulating supply in the next 6 months.\n`;
    } else {
      analysis += `• **Low supply expansion**: Only +${sixMonthInflation.toFixed(2)}% increase in circulating supply over the next 6 months.\n`;
    }

    analysis += `• **One-year projection**: Circulating supply estimated to reach ${(floatPercent + oneYearInflation).toFixed(2)}% of total supply in 12 months.\n`;
    
    // Add market impact based on market data
    if (marketData) {
      const currentMarketCap = marketData.market_cap;
      const currentPrice = marketData.price || marketData.current_price;
      
      // Calculate potential dilution impact
      const projectedMarketCap = currentMarketCap * (1 + (oneYearInflation / 100));
      
      analysis += `• At current market cap of ${formatMarketValue(currentMarketCap)}, the projected 1-year supply increase would dilute to a theoretical market cap of ${formatMarketValue(projectedMarketCap)} (without price change).\n`;
      
      // Calculate price impact if market cap stays constant
      const dilutedPrice = currentPrice / (1 + (oneYearInflation / 100));
      
      if (oneYearInflation > 20) {
        analysis += `• **Price impact**: If market cap remains constant, the increased supply in 12 months could theoretically reduce price from ${formatPrice(currentPrice)} to ${formatPrice(dilutedPrice)} due to dilution.\n`;
      }
      
      // Add valuation context
      const fdvToMcapRatio = marketData.fully_diluted_valuation / marketData.market_cap;
      
      if (fdvToMcapRatio > 3) {
        analysis += `• **High FDV/MCap ratio**: Current FDV is ${fdvToMcapRatio.toFixed(2)}x the market cap, suggesting significant future dilution is priced in.\n`;
      }
    }
    
    // Vesting analysis
    analysis += `\n\n**Vesting Structure**\n`;
    
    if (vestingTypes.none > 0) {
      const unvestedPercent = allocations
        .filter(a => a.vestingType === 'none')
        .reduce((sum, a) => sum + a.percentage, 0);
      
      if (unvestedPercent > 30) {
        analysis += `• **Warning**: ${unvestedPercent.toFixed(2)}% of tokens have no vesting, which can lead to high sell pressure.\n`;
      } else {
        analysis += `• ${unvestedPercent.toFixed(2)}% of tokens have no vesting schedule.\n`;
      }
    }
    
    if (vestingTypes.linear > 0 || vestingTypes.cliff > 0) {
      analysis += `• ${vestingTypes.linear + vestingTypes.cliff} allocations have vesting periods, with the longest being ${longestVesting} months.\n`;
    }
    
    if (longestVesting >= 24) {
      analysis += `• The extended vesting periods (${longestVesting} months) suggest a long-term alignment of key stakeholders.\n`;
    }
    
    // Supply concentration
    const largestAllocation = allocations.sort((a, b) => b.percentage - a.percentage)[0];
    
    if (largestAllocation.percentage > 30) {
      analysis += `\n\n**Supply Concentration**\n• The largest allocation (${largestAllocation.name}) holds ${largestAllocation.percentage.toFixed(2)}% of the total supply, which could represent centralization risk.\n`;
    }
    
    // Token unlocks timing
    analysis += `\n\n**Unlock Schedule Insights**\n`;
    
    // Find significant unlock months (>5% increase)
    const significantUnlocks = chartData
      .filter((data, index, array) => {
        if (index === 0) return false;
        const prevMonth = array[index - 1];
        return ((data.totalUnlocked - prevMonth.totalUnlocked) / totalSupply * 100) > 5;
      })
      .slice(0, 3); // Limit to top 3 significant unlocks
    
    if (significantUnlocks.length > 0) {
      analysis += `• **Key unlock events**:\n`;
      significantUnlocks.forEach(data => {
        const date = new Date(launchDate);
        date.setMonth(date.getMonth() + data.month);
        const prevMonth = chartData[data.month - 1];
        const unlockAmount = data.totalUnlocked - prevMonth.totalUnlocked;
        const unlockPercent = (unlockAmount / totalSupply * 100).toFixed(2);
        
        analysis += `  - Month ${data.month} (${date.toLocaleDateString()}): ${unlockPercent}% of total supply unlocked (${formatNumber(unlockAmount)} tokens)\n`;
      });
    } else {
      analysis += `• The token release schedule appears to be gradual without major unlock cliffs.\n`;
    }

    // Market impact assessment
    analysis += `\n\n**Market Impact Assessment**\n`;
    
    if (marketData) {
      // Compare to Bitcoin and Ethereum market caps for context
      const btcMarketCap = 1300000000000; // $1.3T approximate - could fetch real-time value
      const ethMarketCap = 390000000000;  // $390B approximate - could fetch real-time value
      
      const percentOfBtc = (marketData.market_cap / btcMarketCap) * 100;
      const percentOfEth = (marketData.market_cap / ethMarketCap) * 100;
      
      analysis += `• **Market context**: Current market cap represents ${percentOfBtc.toFixed(2)}% of Bitcoin's and ${percentOfEth.toFixed(2)}% of Ethereum's market cap.\n`;
      
      // Calculate potential returns to reach various market cap milestones
      analysis += `• **Milestone targets**:\n`;
      
      const marketCapMultiples = [2, 5, 10, 25];
      marketCapMultiples.forEach(multiple => {
        const targetMarketCap = marketData.market_cap * multiple;
        analysis += `  - ${multiple}x: ${formatMarketValue(targetMarketCap)} market cap would price at ${formatPrice((marketData.price || marketData.current_price) * multiple)}\n`;
      });
    }
    
    if (floatPercent < 15 && nextMonthInflation > 10) {
      analysis += `• **High volatility risk**: The combination of low float (${floatPercent.toFixed(2)}%) and significant upcoming unlocks (${nextMonthInflation.toFixed(2)}% in 1 month) suggests potential for sharp price movements.\n`;
    } else if (floatPercent > 50 && oneYearInflation < 15) {
      analysis += `• **Lower growth potential**: High current float with limited token unlocks suggests the token may experience less dramatic price appreciation compared to lower float tokens.\n`;
    }
    
    if (marketData && marketData.fully_diluted_valuation) {
      const circulatingToFullyDilutedRatio = marketData.market_cap / marketData.fully_diluted_valuation;
      
      if (circulatingToFullyDilutedRatio < 0.3) {
        analysis += `• **Dilution caution**: Current price reflects only ${(circulatingToFullyDilutedRatio * 100).toFixed(2)}% of the fully diluted valuation, suggesting potential future selling pressure as more tokens are released.\n`;
      }
    }
    
    if (vestingTypes.cliff > 0) {
      analysis += `• **Cliff vesting alert**: The presence of cliff vesting schedules could lead to sudden supply increases when cliff periods end.\n`;
    }
    
    setAiAnalysis(analysis);
  };

  // Calculate total percentage of all allocations
  const totalPercentage = allocations.reduce((sum, allocation) => sum + allocation.percentage, 0);

  // Format number with commas
  const formatNumber = (num) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  // Get float classification badge color - update colors to make more intuitive (high float = blue, medium = green, low = orange)
  const getFloatBadgeColor = () => {
    switch (floatClassification) {
      case 'low': return 'orange';  // Changed from red to orange for low float
      case 'medium': return 'green'; // Changed from yellow to green
      case 'high': return 'blue';   // Changed from green to blue for high float
      default: return 'gray';
    }
  };

  // Get a summary risk assessment for the token
  const getTokenRiskLevel = () => {
    // Default response for when data is not ready
    if (!chartData.length || !allocations.length) {
      return { level: 'Analyzing...', color: 'gray', factors: [] };
    }

    // Check for high-risk factors
    const highRiskFactors = [];
    
    // Check for low float with upcoming unlocks
    if (floatPercentage < 15 && chartData.length > 1) {
      const nextMonthUnlocks = chartData[1].totalUnlocked - chartData[0].totalUnlocked;
      if (chartData[0].totalUnlocked > 0 && (nextMonthUnlocks / chartData[0].totalUnlocked) * 100 > 10) {
        highRiskFactors.push('low float with significant upcoming unlocks');
      }
    }
    
    // Check for high concentration
    if (allocations.length > 0) {
      // Create a copy to avoid mutation of the original array during sort
      const sortedAllocations = [...allocations].sort((a, b) => b.percentage - a.percentage);
      const largestAllocation = sortedAllocations[0];
      if (largestAllocation && largestAllocation.percentage > 40) {
        highRiskFactors.push('high concentration in a single allocation');
      }
    }
    
    // Check for high percentage with no vesting
    if (allocations.length > 0) {
      const unvestedPercent = allocations
        .filter(a => a.vestingType === 'none')
        .reduce((sum, a) => sum + a.percentage, 0);
      
      if (unvestedPercent > 30) {
        highRiskFactors.push('significant tokens without vesting');
      }
    }
    
    if (highRiskFactors.length >= 2) {
      return { level: 'High Risk', color: 'red', factors: highRiskFactors };
    } else if (highRiskFactors.length === 1) {
      return { level: 'Medium Risk', color: 'yellow', factors: highRiskFactors };
    } else {
      return { level: 'Lower Risk', color: 'green', factors: [] };
    }
  };

  // Function to fetch token market data
  const fetchTokenMarketData = async (tokenId) => {
    setLoadingMarketData(true);
    try {
      // Find token in watchlist
      const token = watchlist.find(t => t.id === tokenId || t.symbol === tokenId);
      
      if (!token) {
        throw new Error('Token not found in watchlist');
      }
      
      // Fetch additional data if needed
      let tokenData = { ...token };
      
      // If we need to fetch more data that's not in watchlist
      if (!token.totalSupply || !token.circulatingSupply) {
        try {
          // Use CoinGecko or your existing API setup
          const response = await axios.get(`/api/token/${tokenId}`);
          if (response.data) {
            tokenData = { ...tokenData, ...response.data };
          }
        } catch (apiError) {
          console.error('API fetch error:', apiError);
          // Continue with the data we have
        }
      }
      
      // Ensure required properties exist to prevent errors
      tokenData.totalSupply = tokenData.totalSupply || totalSupply;
      tokenData.circulatingSupply = tokenData.circulatingSupply || (totalSupply * 0.2); // Default to 20% if not available
      tokenData.price = tokenData.price || tokenData.current_price || 0;
      tokenData.market_cap = tokenData.market_cap || (tokenData.circulatingSupply * tokenData.price);
      tokenData.fully_diluted_valuation = tokenData.fully_diluted_valuation || (tokenData.totalSupply * tokenData.price);
      
      setMarketData(tokenData);
      
      // Update token supply and circulating supply if available
      if (tokenData.totalSupply) {
        setTotalSupply(Number(tokenData.totalSupply));
      }
      
      if (tokenData.circulatingSupply) {
        // Update existing allocations to match the new total supply
        const ratio = Number(tokenData.totalSupply) / totalSupply;
        const updatedAllocations = allocations.map(allocation => ({
          ...allocation,
          amount: allocation.amount * ratio
        }));
        
        // Validate the updated allocations to ensure all properties are valid
        const validatedAllocations = validateAllocations(updatedAllocations);
        setAllocations(validatedAllocations);
      }
      
      notifications.show({
        title: 'Token Data Loaded',
        message: `Market data for ${tokenData.name || 'selected token'} has been loaded`,
        color: 'green',
      });
      
    } catch (error) {
      console.error('Error fetching token data:', error);
      notifications.show({
        title: 'Error Loading Token Data',
        message: error.message || 'Failed to load token market data',
        color: 'red',
      });
    } finally {
      setLoadingMarketData(false);
    }
  };

  // Create formatted price string with appropriate decimals
  const formatPrice = (price) => {
    if (!price) return '$0';
    
    // Format based on price magnitude
    if (price < 0.0001) {
      return `$${price.toFixed(8)}`;
    } else if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else if (price < 1000) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
  };
  
  // Format market cap and FDV values
  const formatMarketValue = (value) => {
    if (!value) return '$0';
    
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  return (
    <Container size="xl" pt="md" pb="xl">
      <Title order={1} mb="lg">Token Float & Unlock Schedule Analyzer</Title>
      
      {/* Watchlist Token Selector */}
      <Paper shadow="sm" p="md" mb="md" withBorder>
        <Title order={3} mb="md">Select Token from Watchlist</Title>
        <Group position="apart" align="flex-end">
          <Select
            label="Token"
            placeholder="Select a token from your watchlist"
            data={tokenOptions}
            value={selectedToken}
            onChange={setSelectedToken}
            searchable
            clearable
            icon={<IconCoin size="1rem" />}
            style={{ flex: 1 }}
          />
          {loadingMarketData ? (
            <Loader size="sm" />
          ) : (
            <Button 
              leftIcon={<IconChartLine size="1rem" />}
              onClick={() => selectedToken && fetchTokenMarketData(selectedToken)}
              disabled={!selectedToken}
            >
              Refresh Market Data
            </Button>
          )}
        </Group>
        
        {marketData && (
          <Box mt="md">
            <SimpleGrid cols={4}>
              <Paper p="xs" withBorder>
                <Text size="sm" color="dimmed">Price</Text>
                <Text weight={700} size="lg">{formatPrice(marketData.price || marketData.current_price)}</Text>
              </Paper>
              
              <Paper p="xs" withBorder>
                <Text size="sm" color="dimmed">Market Cap</Text>
                <Text weight={700} size="lg">{formatMarketValue(marketData.market_cap)}</Text>
              </Paper>
              
              <Paper p="xs" withBorder>
                <Text size="sm" color="dimmed">FDV</Text>
                <Text weight={700} size="lg">{formatMarketValue(marketData.fully_diluted_valuation)}</Text>
              </Paper>
              
              <Paper p="xs" withBorder>
                <Text size="sm" color="dimmed">24h Change</Text>
                <Text 
                  weight={700} 
                  size="lg" 
                  color={(marketData.price_change_percentage_24h || 0) >= 0 ? 'green' : 'red'}
                >
                  {(marketData.price_change_percentage_24h || 0).toFixed(2)}%
                </Text>
              </Paper>
            </SimpleGrid>
          </Box>
        )}
      </Paper>
      
      {/* Token Supply */}
      <Paper shadow="sm" p="md" mb="md" withBorder>
        <Title order={3} mb="md">Token Supply</Title>
        <NumberInput
          label="Total Supply"
          description="Enter the total token supply"
          value={totalSupply}
          min={1}
          onChange={(value) => setTotalSupply(Number(value))}
          mb="sm"
          w="50%"
        />
        <DateInput
          label="Token Launch Date"
          placeholder="Select launch date"
          value={launchDate}
          onChange={setLaunchDate}
          w="50%"
        />
      </Paper>
      
      {/* AI Analysis */}
      <Paper shadow="sm" p="md" mb="md" withBorder>
        <Group position="apart" mb="md">
          <Title order={3}>AI Analysis</Title>
          <Group>
            <Badge size="lg" color={getFloatBadgeColor()} variant="filled">
              {floatClassification ? (floatClassification === 'low' ? 'Low Float' : 
               floatClassification === 'medium' ? 'Medium Float' : 'High Float') : 'Analyzing...'}
            </Badge>
            {chartData.length > 0 && (
              <Badge size="lg" color={getTokenRiskLevel().color} variant="filled">
                {getTokenRiskLevel().level}
              </Badge>
            )}
          </Group>
        </Group>
        <Alert 
          icon={<IconInfoCircle size="1rem" />} 
          title="Token Analysis" 
          color="blue"
          mb="md"
        >
          This analysis is based on the current token metrics and vesting schedule data.
          {getTokenRiskLevel().factors.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong>Risk factors:</strong> {getTokenRiskLevel().factors.join(', ')}
            </div>
          )}
        </Alert>
        <Box className="analysis-text">
          {aiAnalysis.split('\n').map((line, index) => (
            line.startsWith('**') ? (
              <Text key={index} weight={700} size="md" mb="xs" mt={index > 0 ? "sm" : 0}>
                {line.replace(/\*\*/g, '')}
              </Text>
            ) : line.startsWith('• ') ? (
              <Text key={index} size="sm" mb="xs">
                {line.startsWith('• **Warning') || line.startsWith('• **High') ? (
                  <span style={{ color: 'var(--mantine-color-red-6)' }}>{line}</span>
                ) : (
                  line
                )}
              </Text>
            ) : line.startsWith('  - ') ? (
              <Text key={index} size="sm" ml={20} mb="xs">
                {line}
              </Text>
            ) : (
              <Text key={index} size="sm" mb="md">
                {line}
              </Text>
            )
          ))}
        </Box>
      </Paper>
      
      {/* Token Metrics with Market Data */}
      <Paper shadow="sm" p="md" mb="md" withBorder>
        <Title order={3} mb="md">Current Token Metrics</Title>
        
        {marketData && (
          <>
            <SimpleGrid cols={3} mb="lg">
              <Box p="md">
                <Text weight={500} size="lg">Market Price</Text>
                <Title order={3}>{formatPrice(marketData.price || marketData.current_price)}</Title>
                <Text size="sm" color={marketData.price_change_percentage_24h >= 0 ? 'green' : 'red'}>
                  {marketData.price_change_percentage_24h?.toFixed(2)}% (24h)
                </Text>
              </Box>
              
              <Box p="md">
                <Text weight={500} size="lg">Market Cap</Text>
                <Title order={3}>{formatMarketValue(marketData.market_cap)}</Title>
                <Text size="sm" color="dimmed">
                  FDV: {formatMarketValue(marketData.fully_diluted_valuation)}
                </Text>
              </Box>
              
              <Box p="md">
                <Text weight={500} size="lg">Market Float</Text>
                <Group position="apart">
                  <Title order={3}>{((marketData.circulatingSupply / marketData.totalSupply) * 100).toFixed(2)}%</Title>
                  <Badge size="lg" color={getFloatBadgeColor()}>
                    {floatClassification ? floatClassification.toUpperCase() : ''} FLOAT
                  </Badge>
                </Group>
                <Progress 
                  value={(marketData.circulatingSupply / marketData.totalSupply) * 100} 
                  mt="sm" 
                  size="md" 
                  color={getFloatBadgeColor()} 
                />
              </Box>
            </SimpleGrid>
            
            {/* Price Targets Section */}
            <Paper p="md" mb="lg" withBorder>
              <Title order={4} mb="md">Market Cap Milestones</Title>
              <Text size="sm" mb="md" color="dimmed">
                Theoretical price points based on different market cap milestones and current circulating supply.
              </Text>
              <SimpleGrid cols={4}>
                {[2, 5, 10, 25].map(multiplier => {
                  const targetMarketCap = marketData.market_cap * multiplier;
                  const targetPrice = (marketData.price || marketData.current_price) * multiplier;
                  return (
                    <Paper key={multiplier} p="xs" withBorder>
                      <Text size="sm" weight={500}>{multiplier}x Current Market Cap</Text>
                      <Group position="apart">
                        <Text size="sm" color="dimmed">Market Cap:</Text>
                        <Text>{formatMarketValue(targetMarketCap)}</Text>
                      </Group>
                      <Group position="apart">
                        <Text size="sm" color="dimmed">Price:</Text>
                        <Text weight={700} color="blue">{formatPrice(targetPrice)}</Text>
                      </Group>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            </Paper>
            
            <Divider mb="lg" />
          </>
        )}
        
        <SimpleGrid cols={3}>
          <Box p="md">
            <Text weight={500} size="lg">Circulating Supply</Text>
            <Title order={3}>{formatNumber(circulatingSupply)}</Title>
            <Group position="apart">
              <Text size="sm" color="dimmed">{floatPercentage.toFixed(2)}% of Total Supply</Text>
              <Badge color={getFloatBadgeColor()}>
                {floatClassification ? floatClassification.toUpperCase() : ''} FLOAT
              </Badge>
            </Group>
            <Progress value={floatPercentage} mt="sm" size="md" color={getFloatBadgeColor()} />
          </Box>
          
          <Box p="md">
            <Text weight={500} size="lg">Locked Supply</Text>
            <Title order={3}>{formatNumber(totalSupply - circulatingSupply)}</Title>
            <Text size="sm" color="dimmed">{(100 - floatPercentage).toFixed(2)}% of Total Supply</Text>
            <Progress value={100 - floatPercentage} mt="sm" size="md" color="violet" />
          </Box>
          
          <Box p="md">
            <Text weight={500} size="lg">Total Allocation</Text>
            <Title order={3}>{totalPercentage.toFixed(2)}%</Title>
            <Text 
              size="sm" 
              className={totalPercentage === 100 ? "text-success" : totalPercentage > 100 ? "text-danger" : "text-warning"}
            >
              {totalPercentage === 100 
                ? "Allocations complete" 
                : totalPercentage > 100 
                  ? "Over-allocated!" 
                  : "Under-allocated"}
            </Text>
            <Progress 
              value={Math.min(totalPercentage, 100)} 
              mt="sm" 
              size="md" 
              color={totalPercentage === 100 ? "green" : totalPercentage > 100 ? "red" : "yellow"} 
            />
          </Box>
        </SimpleGrid>
      </Paper>
      
      {/* Token Allocations */}
      <Paper shadow="sm" p="md" mb="md" withBorder>
        <Group position="apart" mb="md">
          <Title order={3}>Token Allocations</Title>
          <Button onClick={addAllocation}>+ Add Allocation</Button>
        </Group>
        
        {allocations.map((allocation) => (
          <Paper key={allocation.id} p="md" mb="sm" withBorder>
            <Group position="apart" mb="xs">
              <TextInput
                label="Name"
                value={allocation.name}
                onChange={(e) => updateAllocation(allocation.id, 'name', e.target.value)}
                style={{ flex: 2 }}
              />
              <NumberInput
                label="Percentage (%)"
                value={allocation.percentage}
                precision={2}
                min={0}
                max={100}
                step={0.1}
                onChange={(value) => updateAllocation(allocation.id, 'percentage', value)}
                style={{ flex: 1 }}
              />
              <NumberInput
                label="Amount"
                value={allocation.amount}
                min={0}
                onChange={(value) => updateAllocation(allocation.id, 'amount', value)}
                style={{ flex: 1 }}
              />
              <Box pt={20}>
                <Button color="red" onClick={() => removeAllocation(allocation.id)}>Remove</Button>
              </Box>
            </Group>
            
            <Group grow mb="xs" align="flex-start">
              <Select
                label="Vesting Type"
                data={vestingOptions}
                value={allocation.vestingType || 'none'} 
                onChange={(value) => updateAllocation(allocation.id, 'vestingType', value || 'none')}
                required
              />
              
              {allocation.vestingType !== 'none' && (
                <NumberInput
                  label="Vesting Duration (months)"
                  value={allocation.vestingDuration}
                  min={1}
                  onChange={(value) => updateAllocation(allocation.id, 'vestingDuration', value)}
                />
              )}
              
              {allocation.vestingType === 'cliff' && (
                <NumberInput
                  label="Cliff Duration (months)"
                  value={allocation.cliffDuration}
                  min={0}
                  max={allocation.vestingDuration - 1}
                  onChange={(value) => updateAllocation(allocation.id, 'cliffDuration', value)}
                />
              )}
            </Group>
            
            <Box mt="sm">
              <span className="token-color-badge" style={{ backgroundColor: allocationColors[allocation.id] }}>
                {allocation.percentage.toFixed(2)}% ({formatNumber(allocation.amount)} tokens)
              </span>
            </Box>
          </Paper>
        ))}
      </Paper>
      
      {/* Charts */}
      <Paper shadow="sm" p="md" mb="md" withBorder>
        <Title order={3} mb="lg">Token Unlock Schedule</Title>
        
        <Title order={4} mb="md">Circulating Supply Over Time</Title>
        <Box h={350} mb="xl">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                label={{ value: 'Months After Launch', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                label={{ value: 'Token Amount', angle: -90, position: 'insideLeft' }} 
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                formatter={(value) => [`${formatNumber(value)} tokens`, null]} 
                labelFormatter={(month) => `Month ${month}`}
              />
              <Legend />
              {allocations.map((allocation) => (
                <Area 
                  key={allocation.id}
                  type="monotone" 
                  dataKey={allocation.name} 
                  stackId="1"
                  fill={allocationColors[allocation.id]} 
                  stroke={allocationColors[allocation.id]}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </Box>
        
        <Title order={4} mb="md">Percentage of Total Supply in Circulation</Title>
        <Box h={350} mb="md">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                label={{ value: 'Months After Launch', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} 
                domain={[0, 100]} 
              />
              <Tooltip 
                formatter={(value) => [`${value.toFixed(2)}%`, null]} 
                labelFormatter={(month) => `Month ${month}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="percentage" 
                stroke="#0088FE" 
                name="Circulating Supply %" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
      
      {/* Unlock Table */}
      <Paper shadow="sm" p="md" withBorder>
        <Title order={3} mb="md">Token Unlock Schedule Table</Title>
        <Box style={{ overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Date</th>
                <th>Circulating Supply</th>
                <th>% of Total</th>
                <th>Monthly Inflation</th>
                <th>New Tokens</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((data, index) => {
                const prevCirculating = index > 0 ? chartData[index - 1].totalUnlocked : 0;
                const newTokens = data.totalUnlocked - prevCirculating;
                const inflation = prevCirculating > 0 ? (newTokens / prevCirculating) * 100 : 0;
                const date = new Date(launchDate);
                date.setMonth(date.getMonth() + data.month);
                
                return (
                  <tr key={index}>
                    <td>{data.month}</td>
                    <td>{date.toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(data.totalUnlocked)}</td>
                    <td style={{ textAlign: 'right' }}>{data.percentage.toFixed(2)}%</td>
                    <td style={{ textAlign: 'right' }}>{inflation.toFixed(2)}%</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(newTokens)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      </Paper>
    </Container>
  );
};

export default TokenUnlockAnalyzer; 