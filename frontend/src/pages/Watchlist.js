import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Container, 
  Title, 
  Table, 
  Group, 
  Text, 
  Paper,
  Loader,
  Image,
  Box,
  TextInput,
  Button,
  ActionIcon,
  Tooltip,
  UnstyledButton,
  Center,
  Pagination,
  Select,
  Badge,
  Collapse,
  Divider,
  Grid,
  ThemeIcon,
  Progress
} from '@mantine/core';
import { IconSearch, IconPlus, IconTrash, IconStar, IconStarFilled, IconChevronUp, IconChevronDown, IconSelector, IconChevronRight, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useMarket } from '../contexts/MarketContext';
import axios from 'axios';

function Watchlist() {
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { topCoins, loading, error, lastUpdate, fetchTopCoins } = useMarket();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [sortBy, setSortBy] = useState('market_cap_rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedRowsStable, setExpandedRowsStable] = useState({});
  const [detailedTokenData, setDetailedTokenData] = useState({});
  const [tokenDataLoading, setTokenDataLoading] = useState({});

  // Load persisted token data from localStorage on mount
  useEffect(() => {
    try {
      const savedTokenData = localStorage.getItem('detailedTokenData');
      if (savedTokenData) {
        const parsedData = JSON.parse(savedTokenData);
        console.log('[Watchlist] Loaded detailed token data from localStorage');
        setDetailedTokenData(parsedData);
      }
    } catch (error) {
      console.error('Error loading token data from localStorage:', error);
    }
  }, []);

  // Save detailed token data to localStorage when it changes
  useEffect(() => {
    if (Object.keys(detailedTokenData).length > 0) {
      try {
        // Clean up data before saving (maintain max 50 tokens to prevent storage limits)
        const cleanedData = cleanTokenDataCache(detailedTokenData);
        localStorage.setItem('detailedTokenData', JSON.stringify(cleanedData));
        console.log('[Watchlist] Saved detailed token data to localStorage');
      } catch (error) {
        console.error('Error saving token data to localStorage:', error);
      }
    }
  }, [detailedTokenData]);

  // Function to clean up token data cache (keep only most recent 50 tokens)
  const cleanTokenDataCache = (data) => {
    const MAX_CACHED_TOKENS = 50;
    const tokens = Object.entries(data);
    
    // If we're under the limit, return the original data
    if (tokens.length <= MAX_CACHED_TOKENS) {
      return data;
    }
    
    // Sort by lastUpdated (newest first)
    tokens.sort((a, b) => {
      const timeA = a[1].lastUpdated || 0;
      const timeB = b[1].lastUpdated || 0;
      return timeB - timeA;
    });
    
    // Keep only the newest MAX_CACHED_TOKENS
    const keptTokens = tokens.slice(0, MAX_CACHED_TOKENS);
    
    // Convert back to object
    const result = {};
    keptTokens.forEach(([id, tokenData]) => {
      result[id] = tokenData;
    });
    
    console.log(`[Watchlist] Cleaned token cache from ${tokens.length} to ${keptTokens.length} tokens`);
    return result;
  };

  // Debug logging for Watchlist component
  useEffect(() => {
    console.log('[Watchlist] watchlist IDs:', watchlist);
    console.log('[Watchlist] topCoins count:', topCoins.length);
    console.log('[Watchlist] topCoins example:', topCoins.slice(0, 3));
  }, [watchlist, topCoins]);

  // Column width definitions for consistent layout
  const columnStyles = {
    rank: { width: '5%', textAlign: 'left' },
    name: { width: '18%', textAlign: 'left' },
    price: { width: '10%', textAlign: 'left' },
    change24h: { width: '7%', textAlign: 'left' },
    change7d: { width: '7%', textAlign: 'left' },
    change30d: { width: '7%', textAlign: 'left' },
    change1y: { width: '7%', textAlign: 'left' },
    marketCap: { width: '12%', textAlign: 'left' },
    volume: { width: '10%', textAlign: 'left' },
    float: { width: '8%', textAlign: 'center' },
    actions: { width: '4%', textAlign: 'center' },
    expand: { width: '5%', textAlign: 'center' }
  };

  // Table style for adding padding
  const tableStyle = {
    tableLayout: 'fixed',
    width: '100%'
  };

  // Table header style
  const thStyle = {
    padding: '12px 8px',
    verticalAlign: 'middle',
    height: '50px'
  };

  // Format price with appropriate rounding and currency symbol
  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  };

  // Format number with commas for readability
  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0
    }).format(num);
  };

  // In watchlist rows, use priceUsd from API instead of current_price
  // This is needed because the backend API uses priceUsd field while frontend expects current_price
  // For backward compatibility, try both fields
  const getPrice = (coin) => {
    if (coin.current_price !== undefined && coin.current_price !== null) {
      return coin.current_price;
    }
    if (coin.priceUsd !== undefined && coin.priceUsd !== null) {
      return coin.priceUsd;
    }
    return null;
  };

  const formatMarketCap = (marketCap) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toFixed(2)}`;
  };

  // Helper to get market cap from either field name
  const getMarketCap = (coin) => {
    if (coin.market_cap !== undefined && coin.market_cap !== null) {
      return coin.market_cap;
    }
    if (coin.marketCap !== undefined && coin.marketCap !== null) {
      return coin.marketCap;
    }
    return null;
  };
  
  // Helper to get volume from either field name
  const getVolume = (coin) => {
    if (coin.total_volume !== undefined && coin.total_volume !== null) {
      return coin.total_volume;
    }
    if (coin.volume24h !== undefined && coin.volume24h !== null) {
      return coin.volume24h;
    }
    return null;
  };

  const formatPercentage = (percentage) => {
    if (percentage === undefined || percentage === null || isNaN(percentage)) return 'N/A';
    const value = parseFloat(percentage).toFixed(2);
    const color = parseFloat(percentage) >= 0 ? 'green' : 'red';
    return (
      <Text c={color} fw={500} style={{ width: '100%' }}>
        {value}%
      </Text>
    );
  };

  // Search for coins
  const handleSearch = () => {
    setShowSearchResults(true);
  };

  // Filter coins based on search query
  const filteredCoins = topCoins.filter(coin => 
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting handler
  const handleSort = (field) => {
    if (sortBy === field) {
      // If already sorting by this field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New sort field, default to ascending
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Sort columns mapping
  const sortColumns = {
    rank: 'market_cap_rank',
    name: 'name',
    price: 'current_price',
    change24h: 'price_change_percentage_24h',
    change7d: 'price_change_percentage_7d_in_currency',
    change30d: 'price_change_percentage_30d_in_currency',
    change1y: 'price_change_percentage_1y_in_currency',
    marketCap: 'market_cap',
    volume: 'total_volume'
  };

  // Create sortable header
  const SortableHeader = ({ column, label }) => {
    const isActive = sortBy === sortColumns[column];
    const iconContainerStyle = {
      width: 20,
      height: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };
    
    return (
      <UnstyledButton 
        onClick={() => handleSort(sortColumns[column])} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-start', 
          width: '100%',
          height: '100%',
          padding: '8px 0'
        }}
      >
        <Group position="left" spacing={5} style={{ flexWrap: 'nowrap' }}>
          <Text size="sm" fw={500}>{label}</Text>
          <div style={iconContainerStyle}>
            {isActive ? (
              sortDirection === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
            ) : (
              <IconSelector size={14} opacity={0.3} />
            )}
          </div>
        </Group>
      </UnstyledButton>
    );
  };

  // Get watchlist data from top coins
  const watchlistCoins = topCoins.filter(coin => watchlist.includes(coin.id));
  
  // Debug logs for watchlistCoins
  useEffect(() => {
    console.log('[Watchlist] watchlistCoins count:', watchlistCoins.length);
    console.log('[Watchlist] watchlistCoins data:', watchlistCoins);
  }, [watchlistCoins]);

  // Sort market data
  const sortedCoins = [...watchlistCoins].sort((a, b) => {
    // Handle missing values
    if (a[sortBy] === undefined || a[sortBy] === null) return 1;
    if (b[sortBy] === undefined || b[sortBy] === null) return -1;
    
    // For strings, use localeCompare
    if (typeof a[sortBy] === 'string') {
      return sortDirection === 'asc' 
        ? a[sortBy].localeCompare(b[sortBy])
        : b[sortBy].localeCompare(a[sortBy]);
    }
    
    // For numbers
    return sortDirection === 'asc'
      ? a[sortBy] - b[sortBy]
      : b[sortBy] - a[sortBy];
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedCoins.length / pageSize);
  const paginatedCoins = sortedCoins.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  // Handle rows per page change
  const handlePageSizeChange = (value) => {
    setPageSize(parseInt(value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Toggle expanded row state and fetch detailed data with better stability
  const toggleRowExpanded = useCallback((coinId) => {
    // First, update UI state to prevent jumps
    setExpandedRows(prev => {
      const newState = {
        ...prev,
        [coinId]: !prev[coinId]
      };
      
      // If we're expanding, also mark it as stably expanded to prevent collapse during loading
      if (!prev[coinId]) {
        setExpandedRowsStable(prevStable => ({
          ...prevStable,
          [coinId]: true
        }));
        
        // If we don't have data yet and aren't already loading, fetch it after a small delay
        if (!detailedTokenData[coinId] && !tokenDataLoading[coinId]) {
          // Set loading state immediately to prevent multiple requests
          setTokenDataLoading(prevLoading => ({
            ...prevLoading,
            [coinId]: true
          }));
          
          setTimeout(() => {
            fetchDetailedTokenData(coinId);
          }, 100);
        }
      } else {
        // If we're collapsing, wait a bit before removing from stable expanded state
        setTimeout(() => {
          setExpandedRowsStable(prevStable => {
            const newStableState = { ...prevStable };
            delete newStableState[coinId];
            return newStableState;
          });
        }, 300);
      }
      
      return newState;
    });
  }, [expandedRows, detailedTokenData, tokenDataLoading]);

  // Fetch detailed token data from CoinGecko API directly
  const fetchDetailedTokenData = useCallback(async (coinId) => {
    if (tokenDataLoading[coinId]) return;
    
    // Check if we already have data and it's recent (less than 24 hours old)
    const existingData = detailedTokenData[coinId];
    const currentTime = new Date().getTime();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    
    if (existingData && existingData.lastUpdated && 
        (currentTime - existingData.lastUpdated < ONE_DAY_MS)) {
      console.log(`[Watchlist] Using cached detailed data for ${coinId} (< 24h old)`);
      setTimeout(() => {
        setTokenDataLoading(prev => ({
          ...prev,
          [coinId]: false
        }));
      }, 200); // Small delay to prevent flicker
      return;
    }
    
    setTokenDataLoading(prev => ({ ...prev, [coinId]: true }));
    
    try {
      console.log(`[Watchlist] Fetching detailed data for ${coinId}`);
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
      
      if (response.data && response.data.market_data) {
        console.log(`[Watchlist] Received detailed data for ${coinId}:`, response.data.market_data);
        setDetailedTokenData(prev => ({
          ...prev,
          [coinId]: {
            ...response.data,
            lastUpdated: currentTime // Add timestamp for cache invalidation
          }
        }));
        
        // Small delay before removing loading state to ensure smooth transition
        setTimeout(() => {
          setTokenDataLoading(prev => ({
            ...prev,
            [coinId]: false
          }));
        }, 200);
      }
    } catch (error) {
      console.error(`Error fetching detailed data for ${coinId}:`, error);
      setTokenDataLoading(prev => ({ ...prev, [coinId]: false }));
    }
  }, [detailedTokenData, tokenDataLoading]);

  // Determine float classification based on percentage
  const getFloatClassification = (circulating, total) => {
    // Return unknown status if either value is missing or zero
    if (!circulating || !total || circulating === 0 || total === 0) {
      return { type: 'unknown', label: 'Unknown', color: 'gray' };
    }
    
    // Calculate float percentage
    const floatPercentage = (circulating / total) * 100;
    
    // Classify based on percentage - Updated thresholds
    if (floatPercentage >= 50) {
      return { type: 'high', label: 'High Float', color: 'green', percentage: floatPercentage };
    } else if (floatPercentage >= 20) {
      return { type: 'medium', label: 'Medium Float', color: 'orange', percentage: floatPercentage };
    } else {
      return { type: 'low', label: 'Low Float', color: 'red', percentage: floatPercentage };
    }
  };

  // Get MC to FDV ratio classification
  const getMcToFdvClassification = (marketCap, fdv) => {
    // Return unknown if either value is missing or zero
    if (!marketCap || !fdv || marketCap === 0 || fdv === 0) {
      return { type: 'unknown', label: 'Unknown', color: 'gray' };
    }
    
    // Calculate MC to FDV percentage
    const mcToFdvPercentage = (marketCap / fdv) * 100;
    
    // Classify based on percentage
    if (mcToFdvPercentage >= 75) {
      return { type: 'low', label: 'Low Overhang', color: 'green', percentage: mcToFdvPercentage };
    } else if (mcToFdvPercentage >= 30) {
      return { type: 'moderate', label: 'Moderate', color: 'orange', percentage: mcToFdvPercentage };
    } else {
      return { type: 'high', label: 'High Overhang', color: 'red', percentage: mcToFdvPercentage };
    }
  };

  // Get Volume to MC ratio classification
  const getVolumeToMcClassification = (volume, marketCap) => {
    // Return unknown if either value is missing or zero
    if (!volume || !marketCap || volume === 0 || marketCap === 0) {
      return { type: 'unknown', label: 'Unknown', color: 'gray' };
    }
    
    // Calculate Volume to MC percentage
    const volumeToMcPercentage = (volume / marketCap) * 100;
    
    // Classify based on percentage
    if (volumeToMcPercentage >= 50) {
      return { type: 'veryHigh', label: 'Very High', color: 'teal', percentage: volumeToMcPercentage };
    } else if (volumeToMcPercentage >= 20) {
      return { type: 'healthy', label: 'Healthy', color: 'green', percentage: volumeToMcPercentage };
    } else if (volumeToMcPercentage >= 10) {
      return { type: 'moderate', label: 'Moderate', color: 'yellow', percentage: volumeToMcPercentage };
    } else {
      return { type: 'low', label: 'Low', color: 'red', percentage: volumeToMcPercentage };
    }
  };

  // Get Volume to FDV ratio classification
  const getVolumeToFdvClassification = (volume, fdv) => {
    // Return unknown if either value is missing or zero
    if (!volume || !fdv || volume === 0 || fdv === 0) {
      return { type: 'unknown', label: 'Unknown', color: 'gray' };
    }
    
    // Calculate Volume to FDV percentage
    const volumeToFdvPercentage = (volume / fdv) * 100;
    
    // Classify based on percentage
    if (volumeToFdvPercentage >= 30) {
      return { type: 'veryStrong', label: 'Very Strong', color: 'teal', percentage: volumeToFdvPercentage };
    } else if (volumeToFdvPercentage >= 10) {
      return { type: 'healthy', label: 'Healthy', color: 'green', percentage: volumeToFdvPercentage };
    } else if (volumeToFdvPercentage >= 5) {
      return { type: 'low', label: 'Low', color: 'yellow', percentage: volumeToFdvPercentage };
    } else {
      return { type: 'veryLow', label: 'Very Low', color: 'red', percentage: volumeToFdvPercentage };
    }
  };

  // Get composite risk assessment based on all metrics
  const getCompositeRiskAssessment = (
    floatData, 
    mcToFdvData, 
    volumeToMcData, 
    volumeToFdvData
  ) => {
    // Count high risk factors
    let highRiskFactors = 0;
    let lowRiskFactors = 0;
    let factors = [];
    
    // Check float risk
    if (floatData.type === 'low') {
      highRiskFactors++;
      factors.push('low float (<20%)');
    } else if (floatData.type === 'high') {
      lowRiskFactors++;
    }
    
    // Check MC to FDV risk
    if (mcToFdvData.type === 'high') {
      highRiskFactors++;
      factors.push('high token overhang');
    } else if (mcToFdvData.type === 'low') {
      lowRiskFactors++;
    }
    
    // Check Volume to MC risk
    if (volumeToMcData.type === 'low') {
      highRiskFactors++;
      factors.push('low liquidity');
    } else if (volumeToMcData.type === 'healthy' || volumeToMcData.type === 'veryHigh') {
      lowRiskFactors++;
    }
    
    // Check Volume to FDV risk
    if (volumeToFdvData.type === 'veryLow') {
      highRiskFactors++;
      factors.push('disconnect between trading & future value');
    } else if (volumeToFdvData.type === 'healthy' || volumeToFdvData.type === 'veryStrong') {
      lowRiskFactors++;
    }
    
    // Classify overall risk
    if (highRiskFactors >= 2) {
      return { level: 'High Risk', color: 'red', factors: factors };
    } else if (lowRiskFactors >= 3) {
      return { level: 'Low Risk', color: 'green', factors: ['well-balanced tokenomics'] };
    } else {
      return { level: 'Moderate Risk', color: 'orange', factors: factors.length > 0 ? factors : ['mixed tokenomics indicators'] };
    }
  };

  // Memoize the ExpandedContent component to prevent unnecessary re-renders
  const MemoizedExpandedContent = useMemo(() => React.memo(({ coin }) => {
    // Get detailed data if available
    const detailedData = detailedTokenData[coin.id]?.market_data;
    
    // Calculate values using detailed data if available, otherwise fallback to coin data
    const circulatingSupply = detailedData?.circulating_supply || coin.circulating_supply || 0;
    const totalSupply = detailedData?.total_supply || coin.total_supply || 0;
    const maxSupply = detailedData?.max_supply || coin.max_supply || totalSupply || 0;
    const fullyDilutedVal = detailedData?.fully_diluted_valuation?.usd || coin.fully_diluted_valuation || 0;
    const marketCap = detailedData?.market_cap?.usd || getMarketCap(coin) || 0;
    const volume = detailedData?.total_volume?.usd || getVolume(coin) || 0;
    
    // Use the larger of totalSupply or maxSupply for float calculations
    const supplyForCalculation = Math.max(totalSupply || 0, maxSupply || 0);
    
    // Calculate float percentage only if we have valid numbers
    const floatPercentage = supplyForCalculation > 0 ? (circulatingSupply / supplyForCalculation) * 100 : null;
    
    // Get all tokenomics classifications
    const floatData = getFloatClassification(circulatingSupply, supplyForCalculation);
    const mcToFdvData = getMcToFdvClassification(marketCap, fullyDilutedVal);
    const volumeToMcData = getVolumeToMcClassification(volume, marketCap);
    const volumeToFdvData = getVolumeToFdvClassification(volume, fullyDilutedVal);
    
    // Get composite risk assessment
    const riskData = getCompositeRiskAssessment(floatData, mcToFdvData, volumeToMcData, volumeToFdvData);
    
    const contentStyles = {
      minHeight: '280px',
      transition: 'all 0.2s ease-in-out',
      opacity: tokenDataLoading[coin.id] ? 0.7 : 1
    };
    
    // Loading indicator if we're fetching data
    if (tokenDataLoading[coin.id]) {
      return (
        <Box p="md" bg="rgba(0,0,0,0.03)" style={contentStyles}>
          <Center style={{ height: '260px' }}>
            <Group spacing="xs">
              <Loader size="sm" />
              <Text>Loading detailed token data...</Text>
            </Group>
          </Center>
        </Box>
      );
    }
    
    // Helper to render a progress bar with gradient color
    const ProgressBar = ({ value, color }) => {
      return (
        <Progress 
          value={value} 
          size="sm" 
          color={color}
          style={{ marginTop: 4, marginBottom: 8 }}
        />
      )
    };
    
    // Helper to render a metric row
    const MetricRow = ({ label, value, percentage, classification, description }) => {
      return (
        <Box mb="xs">
          <Group position="apart" mb={2}>
            <Text size="sm" weight={500}>{label}:</Text>
            <Badge color={classification.color} size="sm">
              {classification.label}
            </Badge>
          </Group>
          <Group position="apart" spacing={5} mb={2}>
            <Text size="xs" color="dimmed">{description}</Text>
            <Text size="xs" weight={500}>{value}{percentage ? ` (${percentage.toFixed(2)}%)` : ''}</Text>
          </Group>
          <ProgressBar value={percentage} color={classification.color} />
        </Box>
      );
    };
    
    return (
      <Box p="md" bg="rgba(0,0,0,0.03)" style={contentStyles}>
        <Grid>
          <Grid.Col span={7}>
            <Text weight={600} mb="md">Tokenomics Analysis:</Text>
            
            {/* Float vs Max Supply */}
            <MetricRow 
              label="Float vs Max Supply" 
              value={`${formatNumber(circulatingSupply)} / ${formatNumber(supplyForCalculation)}`}
              percentage={floatData.percentage}
              classification={floatData}
              description="Circulating / Max Supply"
            />
            
            {/* Market Cap to FDV Ratio */}
            <MetricRow 
              label="Market Cap to FDV Ratio" 
              value={`${formatMarketCap(marketCap)} / ${formatMarketCap(fullyDilutedVal)}`}
              percentage={mcToFdvData.percentage}
              classification={mcToFdvData}
              description="Realized Value / Full Value"
            />
            
            {/* Volume to Market Cap Ratio */}
            <MetricRow 
              label="Volume/Market Cap Ratio" 
              value={`${formatMarketCap(volume)} / ${formatMarketCap(marketCap)}`}
              percentage={volumeToMcData.percentage}
              classification={volumeToMcData}
              description="Trading Volume / Market Cap"
            />
            
            {/* Volume to FDV Ratio */}
            <MetricRow 
              label="Volume/FDV Ratio" 
              value={`${formatMarketCap(volume)} / ${formatMarketCap(fullyDilutedVal)}`}
              percentage={volumeToFdvData.percentage}
              classification={volumeToFdvData}
              description="Trading Volume / Fully Diluted Valuation"
            />
          </Grid.Col>
          
          <Grid.Col span={5}>
            <Box p="md" sx={theme => ({ 
              backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0], 
              borderRadius: theme.radius.md,
              height: '100%'
            })}>
              <Group mb="md">
                <ThemeIcon color={riskData.color} variant="light" size="lg" radius="md">
                  <IconAlertTriangle size="1.5rem" />
                </ThemeIcon>
                <div>
                  <Text weight={700} size="lg">Risk Assessment</Text>
                  <Badge color={riskData.color} size="lg" mt={5}>{riskData.level}</Badge>
                </div>
              </Group>
              
              <Divider mb="md" />
              
              <Box>
                <Text weight={600} mb="xs">Key Metrics:</Text>
                <Group spacing="xs" mb={8}>
                  <Text size="sm">Max Supply:</Text>
                  <Text size="sm" weight={500}>{formatNumber(maxSupply) || 'Unknown'}</Text>
                </Group>
                <Group spacing="xs" mb={8}>
                  <Text size="sm">Circulating Supply:</Text>
                  <Text size="sm" weight={500}>{formatNumber(circulatingSupply) || 'Unknown'}</Text>
                </Group>
                <Group spacing="xs" mb={8}>
                  <Text size="sm">Market Cap:</Text>
                  <Text size="sm" weight={500}>{formatMarketCap(marketCap)}</Text>
                </Group>
                <Group spacing="xs" mb={8}>
                  <Text size="sm">FDV:</Text>
                  <Text size="sm" weight={500}>{formatMarketCap(fullyDilutedVal)}</Text>
                </Group>
                <Group spacing="xs" mb={8}>
                  <Text size="sm">24h Volume:</Text>
                  <Text size="sm" weight={500}>{formatMarketCap(volume)}</Text>
                </Group>
              </Box>
              
              <Divider my="md" />
              
              <Box>
                <Text weight={600} mb="xs">Risk Factors:</Text>
                {riskData.factors.length > 0 ? (
                  riskData.factors.map((factor, index) => (
                    <Group key={index} spacing="xs" mb={4}>
                      <ThemeIcon color={riskData.color} variant="light" size="sm" radius="xl">
                        <IconInfoCircle size="0.8rem" />
                      </ThemeIcon>
                      <Text size="sm" color="dimmed">{factor}</Text>
                    </Group>
                  ))
                ) : (
                  <Text size="sm" color="dimmed">No significant risk factors identified</Text>
                )}
              </Box>
            </Box>
          </Grid.Col>
        </Grid>
      </Box>
    );
  }), [detailedTokenData, tokenDataLoading]);

  // Pre-fetch data for popular tokens that might be expanded
  useEffect(() => {
    // List of popular tokens that are likely to be expanded
    const popularTokens = ['bitcoin', 'ethereum', 'pepe', 'dogecoin', 'shiba-inu', 'bonk'];
    
    // Check if any of these are in the watchlist and pre-fetch their data
    const tokensToPreload = watchlistCoins
      .filter(coin => popularTokens.includes(coin.id) && !detailedTokenData[coin.id] && !tokenDataLoading[coin.id])
      .slice(0, 3); // Limit to 3 tokens at a time to avoid rate limiting
      
    if (tokensToPreload.length > 0) {
      console.log(`[Watchlist] Pre-fetching data for popular tokens:`, tokensToPreload.map(c => c.id));
      tokensToPreload.forEach((coin, index) => {
        setTimeout(() => {
          fetchDetailedTokenData(coin.id);
        }, index * 700); // Larger delay between requests
      });
    }
  }, [watchlistCoins, detailedTokenData, tokenDataLoading, fetchDetailedTokenData]);

  if (loading) {
    return (
      <Container size="xl">
        <Group position="center" mt="xl">
          <Loader size="lg" />
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl">
        <Paper p="md" withBorder>
          <Text color="red">{error}</Text>
        </Paper>
      </Container>
    );
  }

  if (watchlistCoins.length === 0) {
    return (
      <Container size="xl">
        <Title order={1} mb="md">Watchlist</Title>
        <Group mb="md">
          <TextInput
            placeholder="Search coins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
            rightSection={
              <ActionIcon onClick={handleSearch}>
                <IconSearch size={16} />
              </ActionIcon>
            }
          />
        </Group>
        
        {showSearchResults && searchQuery && (
          <Paper withBorder p="xs" mb="md">
            <Title order={3} mb="xs">Search Results</Title>
            <Box pr="md" pl="md">
              <Table striped highlightOnHover style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{...columnStyles.rank, ...thStyle, paddingLeft: '10px'}}><SortableHeader column="rank" label="#" /></th>
                    <th style={{...columnStyles.name, ...thStyle}}><SortableHeader column="name" label="Name" /></th>
                    <th style={{...columnStyles.price, ...thStyle}}><SortableHeader column="price" label="Price" /></th>
                    <th style={{...columnStyles.change24h, ...thStyle}}><SortableHeader column="change24h" label="24h %" /></th>
                    <th style={{...columnStyles.change7d, ...thStyle}}><SortableHeader column="change7d" label="7d %" /></th>
                    <th style={{...columnStyles.change30d, ...thStyle}}><SortableHeader column="change30d" label="30d %" /></th>
                    <th style={{...columnStyles.change1y, ...thStyle}}><SortableHeader column="change1y" label="1y %" /></th>
                    <th style={{...columnStyles.float, ...thStyle}}>
                      <Text size="sm" fw={500} style={{ textAlign: 'center' }}>Float Status</Text>
                    </th>
                    <th style={{...columnStyles.actions, ...thStyle}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoins.slice(0, 5).map((coin) => (
                    <tr key={coin.id}>
                      <td style={{...columnStyles.rank, paddingLeft: '10px'}}>{coin.market_cap_rank || 'N/A'}</td>
                      <td style={columnStyles.name}>
                        <Group spacing="sm">
                          {coin.image && (
                            <Image
                              src={coin.image}
                              width={24}
                              height={24}
                              alt={coin.name}
                            />
                          )}
                          <div>
                            <Tooltip label={coin.name} disabled={coin.name.length < 20}>
                              <Text fw={500} style={{ 
                                maxWidth: '170px', 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis'
                              }}>
                                {coin.name}
                              </Text>
                            </Tooltip>
                            <Text size="xs" color="dimmed">
                              {coin.symbol?.toUpperCase()}
                            </Text>
                          </div>
                        </Group>
                      </td>
                      <td style={columnStyles.price}>{formatPrice(getPrice(coin))}</td>
                      <td style={columnStyles.change24h}>{formatPercentage(coin.price_change_percentage_24h_in_currency)}</td>
                      <td style={columnStyles.change7d}>{formatPercentage(coin.price_change_percentage_7d_in_currency)}</td>
                      <td style={columnStyles.change30d}>{formatPercentage(coin.price_change_percentage_30d_in_currency)}</td>
                      <td style={columnStyles.change1y}>{formatPercentage(coin.price_change_percentage_1y_in_currency)}</td>
                      <td style={{...columnStyles.float, textAlign: 'center'}}>
                        {(() => {
                          const detailedData = detailedTokenData[coin.id]?.market_data;
                          
                          // Use detailed data if available, otherwise fall back to coin data
                          const circulatingSupply = detailedData?.circulating_supply || coin.circulating_supply || 0;
                          const totalSupply = detailedData?.total_supply || coin.total_supply || 0;
                          const maxSupply = detailedData?.max_supply || coin.max_supply || 0;
                          
                          // Use the larger of totalSupply or maxSupply for float calculations
                          const supplyForCalculation = Math.max(totalSupply || 0, maxSupply || 0);
                            
                          const floatData = getFloatClassification(
                            circulatingSupply,
                            supplyForCalculation
                          );
                          return floatData.type !== 'unknown' ? (
                            <Badge color={floatData.color}>{floatData.label}</Badge>
                          ) : (
                            <Text size="xs" color="dimmed">Unknown</Text>
                          );
                        })()}
                      </td>
                      <td style={columnStyles.actions}>
                        <Tooltip label={isInWatchlist(coin.id) ? "Remove from watchlist" : "Add to watchlist"}>
                          <ActionIcon 
                            color={isInWatchlist(coin.id) ? "yellow" : "gray"} 
                            onClick={() => isInWatchlist(coin.id) ? removeFromWatchlist(coin.id) : addToWatchlist(coin.id)}
                          >
                            {isInWatchlist(coin.id) ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                          </ActionIcon>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                  {filteredCoins.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                        No coins found matching your search
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Box>
          </Paper>
        )}
        
        <Paper p="md" withBorder>
          <Text color="dimmed" align="center" mb="md">Your watchlist is empty. Use the search above or visit the Markets page to add coins.</Text>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" style={{ maxWidth: '1400px' }}>
      <Group position="apart" mb="md">
        <Title order={1}>Watchlist</Title>
        <Group>
          <Text size="sm" color="dimmed">
            Last updated: {lastUpdate?.toLocaleTimeString()}
          </Text>
          <Text size="sm" color="blue">
            Watching {sortedCoins.length} cryptocurrencies
          </Text>
        </Group>
      </Group>

      <Group mb="md">
        <TextInput
          placeholder="Search coins..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1 }}
          rightSection={
            <ActionIcon onClick={handleSearch}>
              <IconSearch size={16} />
            </ActionIcon>
          }
        />
      </Group>

      {showSearchResults && searchQuery && (
        <Paper withBorder p="xs" mb="md">
          <Title order={3} mb="xs">Search Results</Title>
          <Box pr="md" pl="md">
            <Table striped highlightOnHover style={tableStyle}>
              <thead>
                <tr>
                  <th style={{...columnStyles.rank, ...thStyle, paddingLeft: '10px'}}><SortableHeader column="rank" label="#" /></th>
                  <th style={{...columnStyles.name, ...thStyle}}><SortableHeader column="name" label="Name" /></th>
                  <th style={{...columnStyles.price, ...thStyle}}><SortableHeader column="price" label="Price" /></th>
                  <th style={{...columnStyles.change24h, ...thStyle}}><SortableHeader column="change24h" label="24h %" /></th>
                  <th style={{...columnStyles.change7d, ...thStyle}}><SortableHeader column="change7d" label="7d %" /></th>
                  <th style={{...columnStyles.change30d, ...thStyle}}><SortableHeader column="change30d" label="30d %" /></th>
                  <th style={{...columnStyles.change1y, ...thStyle}}><SortableHeader column="change1y" label="1y %" /></th>
                  <th style={{...columnStyles.float, ...thStyle}}>
                    <Text size="sm" fw={500} style={{ textAlign: 'center' }}>Float Status</Text>
                  </th>
                  <th style={{...columnStyles.actions, ...thStyle}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoins.slice(0, 5).map((coin) => (
                  <tr key={coin.id}>
                    <td style={{...columnStyles.rank, paddingLeft: '10px'}}>{coin.market_cap_rank || 'N/A'}</td>
                    <td style={columnStyles.name}>
                      <Group spacing="sm">
                        {coin.image && (
                          <Image
                            src={coin.image}
                            width={24}
                            height={24}
                            alt={coin.name}
                          />
                        )}
                        <div>
                          <Tooltip label={coin.name} disabled={coin.name.length < 20}>
                            <Text fw={500} style={{ 
                              maxWidth: '170px', 
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis'
                            }}>
                              {coin.name}
                            </Text>
                          </Tooltip>
                          <Text size="xs" color="dimmed">
                            {coin.symbol?.toUpperCase()}
                          </Text>
                        </div>
                      </Group>
                    </td>
                    <td style={columnStyles.price}>{formatPrice(getPrice(coin))}</td>
                    <td style={columnStyles.change24h}>{formatPercentage(coin.price_change_percentage_24h_in_currency)}</td>
                    <td style={columnStyles.change7d}>{formatPercentage(coin.price_change_percentage_7d_in_currency)}</td>
                    <td style={columnStyles.change30d}>{formatPercentage(coin.price_change_percentage_30d_in_currency)}</td>
                    <td style={columnStyles.change1y}>{formatPercentage(coin.price_change_percentage_1y_in_currency)}</td>
                    <td style={{...columnStyles.float, textAlign: 'center'}}>
                      {(() => {
                        const detailedData = detailedTokenData[coin.id]?.market_data;
                        
                        // Use detailed data if available, otherwise fall back to coin data
                        const circulatingSupply = detailedData?.circulating_supply || coin.circulating_supply || 0;
                        const totalSupply = detailedData?.total_supply || coin.total_supply || 0;
                        const maxSupply = detailedData?.max_supply || coin.max_supply || 0;
                        
                        // Use the larger of totalSupply or maxSupply for float calculations
                        const supplyForCalculation = Math.max(totalSupply || 0, maxSupply || 0);
                          
                        const floatData = getFloatClassification(
                          circulatingSupply,
                          supplyForCalculation
                        );
                        return floatData.type !== 'unknown' ? (
                          <Badge color={floatData.color}>{floatData.label}</Badge>
                        ) : (
                          <Text size="xs" color="dimmed">Unknown</Text>
                        );
                      })()}
                    </td>
                    <td style={columnStyles.actions}>
                      <Tooltip label={isInWatchlist(coin.id) ? "Remove from watchlist" : "Add to watchlist"}>
                        <ActionIcon 
                          color={isInWatchlist(coin.id) ? "yellow" : "gray"} 
                          onClick={() => isInWatchlist(coin.id) ? removeFromWatchlist(coin.id) : addToWatchlist(coin.id)}
                        >
                          {isInWatchlist(coin.id) ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                        </ActionIcon>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
                {filteredCoins.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                      No coins found matching your search
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Box>
        </Paper>
      )}

      <Paper withBorder p="xs" mb="md">
        <Group position="right" spacing="xs">
          <Text size="sm">Rows per page:</Text>
          <Select
            value={pageSize.toString()}
            onChange={handlePageSizeChange}
            data={['10', '20', '50', '100']}
            style={{ width: 70 }}
          />
        </Group>
      </Paper>

      <Paper withBorder p="xs">
        <Box pr="md" pl="md">
          <Table striped highlightOnHover style={tableStyle}>
            <thead>
              <tr>
                <th style={{...columnStyles.rank, ...thStyle, paddingLeft: '10px'}}><SortableHeader column="rank" label="#" /></th>
                <th style={{...columnStyles.name, ...thStyle}}><SortableHeader column="name" label="Name" /></th>
                <th style={{...columnStyles.price, ...thStyle}}><SortableHeader column="price" label="Price" /></th>
                <th style={{...columnStyles.change24h, ...thStyle}}><SortableHeader column="change24h" label="24h %" /></th>
                <th style={{...columnStyles.change7d, ...thStyle}}><SortableHeader column="change7d" label="7d %" /></th>
                <th style={{...columnStyles.change30d, ...thStyle}}><SortableHeader column="change30d" label="30d %" /></th>
                <th style={{...columnStyles.change1y, ...thStyle}}><SortableHeader column="change1y" label="1y %" /></th>
                <th style={{...columnStyles.marketCap, ...thStyle}}><SortableHeader column="marketCap" label="Market Cap" /></th>
                <th style={{...columnStyles.volume, ...thStyle}}><SortableHeader column="volume" label="Volume (24h)" /></th>
                <th style={{...columnStyles.float, ...thStyle}}>
                  <Text size="sm" fw={500} style={{ textAlign: 'center' }}>Float Status</Text>
                </th>
                <th style={{...columnStyles.actions, ...thStyle}}>
                  <Text size="sm" fw={500} style={{ textAlign: 'center' }}>Action</Text>
                </th>
                <th style={{...columnStyles.expand, ...thStyle}}>
                  <Text size="sm" fw={500} style={{ textAlign: 'center' }}>Details</Text>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCoins.map((coin) => {
                const detailedData = detailedTokenData[coin.id]?.market_data;
                
                // Use detailed data if available, otherwise fall back to coin data
                const circulatingSupply = detailedData?.circulating_supply || coin.circulating_supply || 0;
                const totalSupply = detailedData?.total_supply || coin.total_supply || 0;
                const maxSupply = detailedData?.max_supply || coin.max_supply || 0;
                
                // Use the larger of totalSupply or maxSupply for float calculations
                const supplyForCalculation = Math.max(totalSupply || 0, maxSupply || 0);
                  
                const floatData = getFloatClassification(
                  circulatingSupply,
                  supplyForCalculation
                );
                
                // Determine if we should show the expanded row
                const isExpanded = expandedRows[coin.id] || expandedRowsStable[coin.id];
                
                return (
                  <React.Fragment key={coin.id}>
                    <tr>
                      <td style={{...columnStyles.rank, paddingLeft: '10px'}}>{coin.market_cap_rank || 'N/A'}</td>
                      <td style={columnStyles.name}>
                        <Group spacing="sm">
                          {coin.image && (
                            <Image
                              src={coin.image}
                              width={24}
                              height={24}
                              alt={coin.name || 'Crypto'}
                            />
                          )}
                          <div>
                            <Tooltip label={coin.name || coin.id} disabled={(coin.name || '').length < 20}>
                              <Text fw={500} style={{ 
                                maxWidth: '170px', 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis'
                              }}>
                                {coin.name || coin.id}
                              </Text>
                            </Tooltip>
                            <Text size="xs" color="dimmed">
                              {(coin.symbol || '').toUpperCase()}
                            </Text>
                          </div>
                        </Group>
                      </td>
                      <td style={columnStyles.price}>{formatPrice(getPrice(coin))}</td>
                      <td style={columnStyles.change24h}>{formatPercentage(coin.price_change_percentage_24h_in_currency)}</td>
                      <td style={columnStyles.change7d}>{formatPercentage(coin.price_change_percentage_7d_in_currency)}</td>
                      <td style={columnStyles.change30d}>{formatPercentage(coin.price_change_percentage_30d_in_currency)}</td>
                      <td style={columnStyles.change1y}>{formatPercentage(coin.price_change_percentage_1y_in_currency)}</td>
                      <td style={columnStyles.marketCap}>{formatMarketCap(getMarketCap(coin))}</td>
                      <td style={columnStyles.volume}>{formatMarketCap(getVolume(coin))}</td>
                      <td style={{...columnStyles.float, textAlign: 'center'}}>
                        {floatData.type !== 'unknown' ? (
                          <Badge color={floatData.color}>{floatData.label}</Badge>
                        ) : (
                          <Text size="xs" color="dimmed">Unknown</Text>
                        )}
                      </td>
                      <td style={{...columnStyles.actions, textAlign: 'center'}}>
                        <Tooltip label="Remove from watchlist">
                          <ActionIcon color="red" onClick={() => removeFromWatchlist(coin.id)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </td>
                      <td style={{...columnStyles.expand, textAlign: 'center'}}>
                        <ActionIcon 
                          onClick={() => toggleRowExpanded(coin.id)}
                          variant="subtle"
                        >
                          {expandedRows[coin.id] ? (
                            <IconChevronUp size={16} />
                          ) : (
                            <IconChevronDown size={16} />
                          )}
                        </ActionIcon>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={12} style={{ padding: 0 }}>
                          <div style={{ 
                            height: expandedRows[coin.id] ? 'auto' : 0,
                            overflow: 'hidden',
                            transition: 'height 0.2s ease-out'
                          }}>
                            <MemoizedExpandedContent coin={coin} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
          
          {/* Only show pagination if we have more than one page */}
          {totalPages > 1 && (
            <Group position="center" mt="md">
              <Pagination
                total={totalPages}
                value={currentPage}
                onChange={handlePageChange}
                withEdges
                siblings={2}
                boundaries={1}
              />
            </Group>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default Watchlist; 