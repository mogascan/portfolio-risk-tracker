import React, { useState, useEffect } from 'react';
import { Card, Text, Group, Button, TextInput, NumberInput, Table, Badge, Tooltip, Divider, ScrollArea, Select, Loader, Box } from '@mantine/core';
import { IconPlus, IconTrash, IconAlertTriangle, IconInfoCircle, IconCheck, IconArrowsUpDown, IconSearch } from '@tabler/icons-react';
import axios from 'axios';
import coinGeckoService from '../api/coinGeckoService';

// Define default tokens as a constant
const DEFAULT_TOKENS = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    price: 69420,
    circulatingSupply: 19570000,
    totalSupply: 19570000,
    maxSupply: 21000000,
    marketCap: 1358397400000,
    fdv: 1457820000000,
    volume24h: 75304358000,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    price: 3550,
    circulatingSupply: 120000000,
    totalSupply: 120000000,
    maxSupply: null,
    marketCap: 426000000000,
    fdv: 426000000000,
    volume24h: 15624500000,
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    price: 156,
    circulatingSupply: 440000000,
    totalSupply: 571000000,
    maxSupply: 571000000,
    marketCap: 68640000000,
    fdv: 89076000000,
    volume24h: 4830000000,
  }
];

export default function FloatEvaluation() {
  // Token state with localStorage persistence
  const [tokens, setTokens] = useState(() => {
    try {
      // Try to load tokens from localStorage
      const savedTokens = localStorage.getItem('floatEvaluationTokens');
      console.log('Initial load - savedTokens from localStorage:', savedTokens);
      
      if (savedTokens) {
        try {
          const parsedTokens = JSON.parse(savedTokens);
          if (Array.isArray(parsedTokens)) {
            console.log('Loaded tokens from localStorage:', parsedTokens.length, 'tokens');
            return parsedTokens;
          }
        } catch (parseError) {
          console.error('Error parsing saved tokens:', parseError);
        }
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
    
    // Return default tokens if nothing is saved or there was an error
    console.log('Using default tokens');
    return DEFAULT_TOKENS;
  });
  
  // Improved function to update tokens and localStorage in a single operation
  const updateTokens = (newTokens) => {
    try {
      // Update state
      setTokens(newTokens);
      
      // Immediately update localStorage
      const tokensJson = JSON.stringify(newTokens);
      localStorage.setItem('floatEvaluationTokens', tokensJson);
      
      console.log('Tokens updated and saved:', newTokens.length, 'tokens');
      console.log('Saved to localStorage:', tokensJson.substring(0, 100) + (tokensJson.length > 100 ? '...' : ''));
      
      // Update cleared flag
      if (newTokens.length === 0) {
        localStorage.setItem('floatEvaluation_allCleared', 'true');
      } else {
        localStorage.removeItem('floatEvaluation_allCleared');
      }
    } catch (error) {
      console.error('Error updating tokens:', error);
    }
  };

  // Save tokens to localStorage whenever they change
  useEffect(() => {
    try {
      const tokensJson = JSON.stringify(tokens);
      localStorage.setItem('floatEvaluationTokens', tokensJson);
      console.log('Tokens saved to localStorage (effect):', tokens.length, 'tokens');
      
      // Log the first part of the JSON to verify
      console.log('JSON saved (preview):', tokensJson.substring(0, 100) + (tokensJson.length > 100 ? '...' : ''));
      
      // If all tokens are removed, set a flag
      if (tokens.length === 0) {
        localStorage.setItem('floatEvaluation_allCleared', 'true');
      } else {
        localStorage.removeItem('floatEvaluation_allCleared');
      }
    } catch (error) {
      console.error('Error saving tokens to localStorage:', error);
    }
  }, [tokens]);

  // Add listener for page navigation/unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        // Force sync localStorage update before navigating away
        const tokensJson = JSON.stringify(tokens);
        localStorage.setItem('floatEvaluationTokens', tokensJson);
        console.log('Tokens saved before navigation:', tokens.length, 'tokens');
      } catch (error) {
        console.error('Error saving tokens before navigation:', error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      // Save one last time when component unmounts
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [tokens]);

  const [newToken, setNewToken] = useState({
    name: "",
    price: "",
    circulatingSupply: "",
    totalSupply: "",
    maxSupply: "",
    marketCap: "",
    fdv: "",
    volume24h: "",
  });
  
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trendingTokens, setTrendingTokens] = useState([]);

  // Fetch trending tokens on component mount
  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        const trending = await coinGeckoService.getTrendingTokens();
        setTrendingTokens(trending || []);
      } catch (error) {
        console.error('Failed to fetch trending tokens:', error);
        setTrendingTokens([]);
      }
    };
    
    fetchTrendingTokens();
  }, []);

  // Function to search for tokens
  const searchTokens = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const results = await coinGeckoService.searchTokens(query);
      setSearchResults(results?.slice(0, 10) || []); // Ensure we have an array, limit to top 10 results
    } catch (error) {
      console.error('Error searching tokens:', error);
      setSearchResults([]); // Reset to empty array on error
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery) {
        searchTokens(searchQuery);
      }
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Function to fetch token data from CoinGecko API
  const fetchTokenData = async (tokenId) => {
    if (!tokenId) {
      setError('Please enter a valid token ID');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenData = await coinGeckoService.getTokenById(tokenId);
      
      if (!tokenData) {
        throw new Error('No data returned from API');
      }
      
      // Validate and normalize token data to prevent calculation errors
      const normalizedToken = {
        id: tokenData.id || tokenId,
        name: tokenData.name || "Unknown",
        symbol: tokenData.symbol || "",
        price: parseFloat(tokenData.price) || 0,
        circulatingSupply: parseFloat(tokenData.circulatingSupply) || 0,
        totalSupply: parseFloat(tokenData.totalSupply) || parseFloat(tokenData.circulatingSupply) || 0,
        maxSupply: parseFloat(tokenData.maxSupply) || parseFloat(tokenData.totalSupply) || parseFloat(tokenData.circulatingSupply) || 0,
        marketCap: parseFloat(tokenData.marketCap) || 0,
        fdv: parseFloat(tokenData.fdv) || 0,
        volume24h: parseFloat(tokenData.volume24h) || 0,
      };
      
      // Check if token already exists, update it if it does
      const existingTokenIndex = tokens.findIndex(t => 
        t.id === normalizedToken.id || 
        (t.name && t.name.toLowerCase() === normalizedToken.name.toLowerCase())
      );
      
      let updatedTokens;
      if (existingTokenIndex >= 0) {
        // Update existing token
        console.log(`Updating token at index ${existingTokenIndex}:`, normalizedToken);
        updatedTokens = [...tokens];
        updatedTokens[existingTokenIndex] = normalizedToken;
      } else {
        // Add new token
        console.log('Adding new token:', normalizedToken);
        updatedTokens = [...tokens, normalizedToken];
      }
      
      // Use updateTokens function to update both state and localStorage
      updateTokens(updatedTokens);
      
      setSelectedTokenId('');
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error fetching token data:', error);
      setError(
        error.response?.status === 429 
          ? 'Rate limit exceeded. Please try again later.' 
          : `Failed to fetch token data for "${tokenId}". Please check if the token ID is correct and try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate risk metrics for each token
  const calculateRiskMetrics = (token) => {
    try {
      // Ensure we have valid numeric values to prevent NaN in calculations
      const circulatingSupply = parseFloat(token.circulatingSupply) || 0;
      const maxSupply = parseFloat(token.maxSupply) || parseFloat(token.totalSupply) || circulatingSupply || 0;
      const marketCap = parseFloat(token.marketCap) || 0;
      const fdv = parseFloat(token.fdv) || marketCap || 0;
      const volume24h = parseFloat(token.volume24h) || 0;
      
      // Float vs Max (%)
      let floatVsMax = maxSupply ? (circulatingSupply / maxSupply) * 100 : 100;
      
      // MC/FDV (%)
      let mcToFdv = fdv ? (marketCap / fdv) * 100 : 100;
      
      // Volume/MC (%)
      let volumeToMc = marketCap ? (volume24h / marketCap) * 100 : 0;
      
      // Volume/FDV (%)
      let volumeToFdv = fdv ? (volume24h / fdv) * 100 : 0;
      
      // Float Category
      let floatCategory;
      if (floatVsMax >= 50) floatCategory = "High";
      else if (floatVsMax >= 20) floatCategory = "Medium";
      else floatCategory = "Low";
      
      // FDV Overhang
      let fdvOverhang;
      if (mcToFdv > 75) fdvOverhang = "Low";
      else if (mcToFdv >= 30) fdvOverhang = "Moderate";
      else fdvOverhang = "High";
      
      // Liquidity Strength (MC)
      let liquidityMc;
      if (volumeToMc >= 20) liquidityMc = "Strong";
      else if (volumeToMc >= 10) liquidityMc = "Moderate";
      else liquidityMc = "Weak";
      
      // Liquidity Strength (FDV)
      let liquidityFdv;
      if (volumeToFdv >= 10) liquidityFdv = "Strong";
      else if (volumeToFdv >= 5) liquidityFdv = "Moderate";
      else liquidityFdv = "Weak";
      
      // Overall Risk
      let riskFactors = 0;
      if (floatVsMax < 20) riskFactors++;
      if (mcToFdv < 30) riskFactors++;
      if (volumeToMc < 10) riskFactors++;
      if (volumeToFdv < 5) riskFactors++;
      
      let lowRiskFactors = 0;
      if (floatVsMax >= 50) lowRiskFactors++;
      if (mcToFdv >= 75) lowRiskFactors++;
      if (volumeToMc >= 20) lowRiskFactors++;
      if (volumeToFdv >= 10) lowRiskFactors++;
      
      let overallRisk;
      if (riskFactors >= 2) overallRisk = "High";
      else if (lowRiskFactors >= 3) overallRisk = "Low";
      else overallRisk = "Medium";
      
      return {
        floatVsMax: isNaN(floatVsMax) ? "0.00" : floatVsMax.toFixed(2),
        mcToFdv: isNaN(mcToFdv) ? "0.00" : mcToFdv.toFixed(2),
        volumeToMc: isNaN(volumeToMc) ? "0.00" : volumeToMc.toFixed(2),
        volumeToFdv: isNaN(volumeToFdv) ? "0.00" : volumeToFdv.toFixed(2),
        floatCategory,
        fdvOverhang,
        liquidityMc,
        liquidityFdv,
        overallRisk,
      };
    } catch (error) {
      console.error('Error calculating metrics for token:', token, error);
      // Return safe defaults if calculation fails
      return {
        floatVsMax: "0.00",
        mcToFdv: "0.00",
        volumeToMc: "0.00",
        volumeToFdv: "0.00",
        floatCategory: "Low",
        fdvOverhang: "High",
        liquidityMc: "Weak",
        liquidityFdv: "Weak",
        overallRisk: "High",
      };
    }
  };
  
  const handleInputChange = (value, name) => {
    setNewToken({
      ...newToken,
      [name]: value
    });
  };
  
  const addToken = () => {
    if (newToken.name === "" || newToken.price === "" || newToken.circulatingSupply === "") {
      setError("Please fill in at least the token name, price, and circulating supply.");
      return;
    }
    
    // Auto-calculate market cap if not provided
    let updatedToken = {...newToken};
    if (!updatedToken.marketCap && updatedToken.price && updatedToken.circulatingSupply) {
      updatedToken.marketCap = updatedToken.price * updatedToken.circulatingSupply;
    }
    
    // Auto-calculate FDV if not provided
    if (!updatedToken.fdv && updatedToken.price && updatedToken.totalSupply) {
      updatedToken.fdv = updatedToken.price * updatedToken.totalSupply;
    }
    
    // Add a unique ID and timestamp
    updatedToken.id = `manual-${Date.now()}`;
    updatedToken.added = new Date().toISOString();
    
    // Use updateTokens function to update both state and localStorage
    updateTokens([...tokens, updatedToken]);
    
    setNewToken({
      name: "",
      price: "",
      circulatingSupply: "",
      totalSupply: "",
      maxSupply: "",
      marketCap: "",
      fdv: "",
      volume24h: "",
    });
    setError(null);
  };
  
  // Remove a token - completely rewritten to be more reliable
  const removeToken = (tokenIdOrIndex) => {
    try {
      console.log('Removing token:', tokenIdOrIndex);
      
      // Create a copy of the tokens array to work with
      const currentTokens = [...tokens];
      
      if (currentTokens.length === 0) {
        console.warn('No tokens to remove');
        return;
      }
      
      let updatedTokens;
      
      if (typeof tokenIdOrIndex === 'string' && tokenIdOrIndex) {
        // Remove by ID
        console.log(`Attempting to remove token by ID: ${tokenIdOrIndex}`);
        updatedTokens = currentTokens.filter(token => 
          token.id !== tokenIdOrIndex
        );
        
        if (updatedTokens.length === currentTokens.length) {
          console.warn(`No token found with ID: ${tokenIdOrIndex}`);
          // Try removing by index as fallback
          const index = currentTokens.findIndex(t => t.id === tokenIdOrIndex);
          if (index >= 0) {
            updatedTokens = [...currentTokens];
            updatedTokens.splice(index, 1);
          }
        }
      } else if (typeof tokenIdOrIndex === 'number' && tokenIdOrIndex >= 0 && tokenIdOrIndex < currentTokens.length) {
        // Remove by index
        console.log(`Removing token at index: ${tokenIdOrIndex}`);
        updatedTokens = [...currentTokens];
        updatedTokens.splice(tokenIdOrIndex, 1);
      } else {
        console.error('Invalid token identifier:', tokenIdOrIndex);
        return;
      }
      
      console.log('Tokens before removal:', currentTokens.length);
      console.log('Tokens after removal:', updatedTokens.length);
      
      // Only update if we actually removed something
      if (updatedTokens.length < currentTokens.length) {
        // Use updateTokens function to update both state and localStorage
        updateTokens(updatedTokens);
      } else {
        console.warn('No tokens were removed');
      }
    } catch (error) {
      console.error('Error removing token:', error);
    }
  };
  
  const handleSort = (key) => {
    let direction = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };
  
  const getSortedTokens = () => {
    if (!sortConfig.key) return tokens;
    
    const sortableTokens = [...tokens];
    
    return sortableTokens.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };
  
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "N/A";
    
    // For very large numbers (billions+)
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(2)}B`;
    }
    // For millions
    else if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
    // For thousands
    else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    // For small decimals
    else if (num < 0.01 && num > 0) {
      return num.toExponential(2);
    }
    // For regular numbers
    else {
      return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
  };
  
  // Get risk badge color
  const getRiskBadgeColor = (category, value) => {
    switch (category) {
      case 'floatCategory':
        return value === "High" ? "green" : value === "Medium" ? "yellow" : "red";
      case 'fdvOverhang':
        return value === "Low" ? "green" : value === "Moderate" ? "yellow" : "red";
      case 'liquidityMc':
      case 'liquidityFdv':
        return value === "Strong" ? "green" : value === "Moderate" ? "yellow" : "red";
      case 'overallRisk':
        return value === "Low" ? "green" : value === "Medium" ? "yellow" : "red";
      default:
        return "gray";
    }
  };
  
  const sortedTokens = getSortedTokens();

  // Reset tokens to default
  const resetTokens = () => {
    console.log('Resetting tokens to defaults');
    updateTokens(DEFAULT_TOKENS);
    localStorage.removeItem('floatEvaluation_allCleared');
  };

  // Clear all tokens
  const clearAllTokens = () => {
    console.log('Clearing all tokens');
    updateTokens([]);
  };

  return (
    <div className="container mx-auto">
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
        <Card.Section withBorder inheritPadding py="xs">
          <Group justify="space-between">
            <Text fw={700} size="xl">Crypto Token Float Evaluation</Text>
            <Group gap="xs">
              <Button 
                size="xs" 
                color="red" 
                variant="subtle"
                onClick={clearAllTokens}
                title="Remove all tokens"
              >
                Clear All
              </Button>
              <Button 
                size="xs" 
                color="gray" 
                variant="subtle"
                onClick={resetTokens}
                title="Reset to default tokens"
              >
                Reset to Defaults
              </Button>
            </Group>
          </Group>
        </Card.Section>
        
        {/* Token Input Form from CoinGecko */}
        <Card withBorder radius="md" mb="md" mt="md">
          <Card.Section withBorder inheritPadding py="xs">
            <Text fw={600}>Add Token from CoinGecko</Text>
          </Card.Section>
          <Box p="md">
            <TextInput
              label="Search for a token"
              placeholder="Enter token name (e.g. Bitcoin, Ethereum)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              error={error}
              rightSection={searchLoading ? <Loader size="xs" /> : <IconSearch size={16} />}
              mb="md"
            />
            
            {trendingTokens && trendingTokens.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <Text size="xs" fw={500} mb={5}>Trending tokens:</Text>
                <Group gap={5}>
                  {trendingTokens.map(token => (
                    <Badge 
                      key={token.id}
                      variant="outline"
                      style={{ cursor: 'pointer' }}
                      onClick={() => fetchTokenData(token.id)}
                    >
                      {token.symbol}
                    </Badge>
                  ))}
                </Group>
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div>
                <Text fw={500} size="sm" mb="xs">Search Results:</Text>
                <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '10px', border: '1px solid #eee', borderRadius: '4px' }}>
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        backgroundColor: selectedTokenId === result.id ? '#f0f9ff' : 'transparent',
                        borderBottom: '1px solid #eee'
                      }}
                      onClick={() => setSelectedTokenId(result.id)}
                    >
                      <Text size="sm">{result.name} ({result.symbol})</Text>
                      {result.marketCapRank && (
                        <Text size="xs" color="dimmed">Rank #{result.marketCapRank}</Text>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Group justify="flex-end">
              <Button 
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  if (selectedTokenId) {
                    fetchTokenData(selectedTokenId);
                  } else if (searchQuery && searchQuery.match(/^[a-z0-9-]+$/)) {
                    fetchTokenData(searchQuery);
                  } else {
                    setError('Please select a token from the search results or enter a valid token ID');
                  }
                }}
                variant="filled"
                loading={isLoading}
                disabled={!selectedTokenId && (!searchQuery || !searchQuery.match(/^[a-z0-9-]+$/))}
              >
                Add Token
              </Button>
            </Group>
          </Box>
        </Card>
        
        {/* Manual Token Input Form */}
        <Card withBorder radius="md" mb="md">
          <Card.Section withBorder inheritPadding py="xs">
            <Text fw={600}>Add Token Manually</Text>
          </Card.Section>
          <Group grow p="md">
            <TextInput
              label="Token Name"
              placeholder="Token Name"
              value={newToken.name}
              onChange={(event) => handleInputChange(event.currentTarget.value, 'name')}
              required
            />
            <NumberInput
              label="Price (USD)"
              placeholder="0.00"
              value={newToken.price}
              onChange={(value) => handleInputChange(value, 'price')}
              required
              decimalScale={8}
              min={0}
            />
            <NumberInput
              label="Circulating Supply"
              placeholder="0"
              value={newToken.circulatingSupply}
              onChange={(value) => handleInputChange(value, 'circulatingSupply')}
              required
              min={0}
            />
            <NumberInput
              label="Total Supply"
              placeholder="0"
              value={newToken.totalSupply}
              onChange={(value) => handleInputChange(value, 'totalSupply')}
              min={0}
            />
          </Group>
          <Group grow px="md" pb="md">
            <NumberInput
              label="Max Supply"
              placeholder="0"
              value={newToken.maxSupply}
              onChange={(value) => handleInputChange(value, 'maxSupply')}
              min={0}
            />
            <NumberInput
              label="Market Cap"
              placeholder="Auto-calculated"
              value={newToken.marketCap}
              onChange={(value) => handleInputChange(value, 'marketCap')}
              disabled={!!(newToken.price && newToken.circulatingSupply)}
              min={0}
            />
            <NumberInput
              label="FDV"
              placeholder="Auto-calculated"
              value={newToken.fdv}
              onChange={(value) => handleInputChange(value, 'fdv')}
              disabled={!!(newToken.price && newToken.totalSupply)}
              min={0}
            />
            <NumberInput
              label="24h Volume"
              placeholder="0"
              value={newToken.volume24h}
              onChange={(value) => handleInputChange(value, 'volume24h')}
              min={0}
            />
          </Group>
          <Card.Section withBorder inheritPadding py="xs">
            <Group justify="flex-end">
              <Button 
                leftSection={<IconPlus size={16} />}
                onClick={addToken}
                variant="filled"
              >
                Add Token
              </Button>
            </Group>
          </Card.Section>
        </Card>
        
        {/* Token Risk Assessment Table */}
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{cursor: 'pointer'}} onClick={() => handleSort('name')}>
                  <Group gap={5}>
                    <Text>Token</Text>
                    <IconArrowsUpDown size={14} />
                  </Group>
                </Table.Th>
                <Table.Th style={{cursor: 'pointer'}} onClick={() => handleSort('price')}>
                  <Group gap={5}>
                    <Text>Price (USD)</Text>
                    <IconArrowsUpDown size={14} />
                  </Group>
                </Table.Th>
                <Table.Th>Circulating Supply</Table.Th>
                <Table.Th>Total Supply</Table.Th>
                <Table.Th>Max Supply</Table.Th>
                <Table.Th style={{cursor: 'pointer'}} onClick={() => handleSort('marketCap')}>
                  <Group gap={5}>
                    <Text>Market Cap</Text>
                    <IconArrowsUpDown size={14} />
                  </Group>
                </Table.Th>
                <Table.Th>FDV</Table.Th>
                <Table.Th>24h Volume</Table.Th>
                <Table.Th>Float vs Max (%)</Table.Th>
                <Table.Th>MC/FDV (%)</Table.Th>
                <Table.Th>Volume/MC (%)</Table.Th>
                <Table.Th>Volume/FDV (%)</Table.Th>
                <Table.Th>Float Category</Table.Th>
                <Table.Th>FDV Overhang</Table.Th>
                <Table.Th>Liquidity (MC)</Table.Th>
                <Table.Th>Liquidity (FDV)</Table.Th>
                <Table.Th>Overall Risk</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedTokens && sortedTokens.length > 0 ? (
                sortedTokens.map((token, index) => {
                  try {
                    const metrics = calculateRiskMetrics(token);
                    const tokenId = token.id || `token-${index}`;
                    
                    return (
                      <Table.Tr key={tokenId}>
                        <Table.Td>{token.name || 'Unknown'}</Table.Td>
                        <Table.Td>${formatNumber(token.price)}</Table.Td>
                        <Table.Td>{formatNumber(token.circulatingSupply)}</Table.Td>
                        <Table.Td>{formatNumber(token.totalSupply)}</Table.Td>
                        <Table.Td>{formatNumber(token.maxSupply)}</Table.Td>
                        <Table.Td>${formatNumber(token.marketCap)}</Table.Td>
                        <Table.Td>${formatNumber(token.fdv)}</Table.Td>
                        <Table.Td>${formatNumber(token.volume24h)}</Table.Td>
                        <Table.Td>{metrics.floatVsMax}%</Table.Td>
                        <Table.Td>{metrics.mcToFdv}%</Table.Td>
                        <Table.Td>{metrics.volumeToMc}%</Table.Td>
                        <Table.Td>{metrics.volumeToFdv}%</Table.Td>
                        <Table.Td>
                          <Badge color={getRiskBadgeColor('floatCategory', metrics.floatCategory)} variant="light">
                            {metrics.floatCategory}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getRiskBadgeColor('fdvOverhang', metrics.fdvOverhang)} variant="light">
                            {metrics.fdvOverhang}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getRiskBadgeColor('liquidityMc', metrics.liquidityMc)} variant="light">
                            {metrics.liquidityMc}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getRiskBadgeColor('liquidityFdv', metrics.liquidityFdv)} variant="light">
                            {metrics.liquidityFdv}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getRiskBadgeColor('overallRisk', metrics.overallRisk)} variant="light" fw={500}>
                            {metrics.overallRisk}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Button
                            onClick={() => {
                              console.log(`Removing token: ${token.name} (ID: ${tokenId}, Index: ${index})`);
                              removeToken(index); // Use index for reliability
                            }}
                            color="red"
                            variant="subtle"
                            size="xs"
                            p={4}
                            title="Remove token"
                          >
                            <IconTrash size={16} />
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    );
                  } catch (error) {
                    console.error(`Error rendering token at index ${index}:`, token, error);
                    return null;
                  }
                }).filter(Boolean)
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={18} style={{ textAlign: 'center', padding: '20px' }}>
                    <Text color="dimmed">No tokens added yet. Add tokens using the forms above.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>
      
      {/* Risk Assessment Legend */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section withBorder inheritPadding py="xs">
          <Text fw={700}>Risk Assessment Metrics</Text>
        </Card.Section>
        <Group grow mt="md">
          <div>
            <Text fw={500} mb="xs">Float vs Max Supply (%):</Text>
            <Text size="sm" display="block"><Badge color="green" variant="dot" mr={5}>High (≥50%)</Badge> Majority of tokens circulating; low inflation risk</Text>
            <Text size="sm" display="block"><Badge color="yellow" variant="dot" mr={5}>Medium (20-49.9%)</Badge> Moderate unlock risk</Text>
            <Text size="sm" display="block"><Badge color="red" variant="dot" mr={5}>Low (&lt;20%)</Badge> Large portion unreleased; high dilution risk</Text>
          </div>
          <div>
            <Text fw={500} mb="xs">Market Cap to FDV Ratio (%):</Text>
            <Text size="sm" display="block"><Badge color="green" variant="dot" mr={5}>Low Overhang (&gt;75%)</Badge> Low future dilution</Text>
            <Text size="sm" display="block"><Badge color="yellow" variant="dot" mr={5}>Moderate (30-75%)</Badge> Some inflation potential</Text>
            <Text size="sm" display="block"><Badge color="red" variant="dot" mr={5}>High (&lt;30%)</Badge> Price may be artificially inflated</Text>
          </div>
        </Group>
        <Group grow mt="md">
          <div>
            <Text fw={500} mb="xs">Volume to Market Cap Ratio (%):</Text>
            <Text size="sm" display="block"><Badge color="green" variant="dot" mr={5}>Strong (≥20%)</Badge> Good liquidity; strong price discovery</Text>
            <Text size="sm" display="block"><Badge color="yellow" variant="dot" mr={5}>Moderate (10-19.9%)</Badge> Limited turnover</Text>
            <Text size="sm" display="block"><Badge color="red" variant="dot" mr={5}>Weak (&lt;10%)</Badge> Illiquid; susceptible to manipulation</Text>
          </div>
          <div>
            <Text fw={500} mb="xs">Volume to FDV Ratio (%):</Text>
            <Text size="sm" display="block"><Badge color="green" variant="dot" mr={5}>Strong (≥10%)</Badge> Trading supports projected valuation</Text>
            <Text size="sm" display="block"><Badge color="yellow" variant="dot" mr={5}>Moderate (5-9.9%)</Badge> Demand may not match projected value</Text>
            <Text size="sm" display="block"><Badge color="red" variant="dot" mr={5}>Weak (&lt;5%)</Badge> Disconnect between activity and future value</Text>
          </div>
        </Group>
        
        <Divider my="md" />
        
        <Card.Section withBorder inheritPadding py="xs">
          <Text fw={700}>Overall Risk Assessment</Text>
        </Card.Section>
        <div>
          <Group mb="xs" mt="md">
            <Badge color="red" variant="filled">High Risk</Badge>
            <Text size="sm">If 2 or more of these factors are true:</Text>
          </Group>
          <Group ml="md" mb="md" gap="xl">
            <Text size="sm">• Float &lt; 20%</Text>
            <Text size="sm">• MC/FDV &lt; 30%</Text>
            <Text size="sm">• Volume/MC &lt; 10%</Text>
            <Text size="sm">• Volume/FDV &lt; 5%</Text>
          </Group>
          
          <Group mb="xs">
            <Badge color="green" variant="filled">Low Risk</Badge>
            <Text size="sm">If 3 or more of these factors are true:</Text>
          </Group>
          <Group ml="md" mb="md" gap="xl">
            <Text size="sm">• Float ≥ 50%</Text>
            <Text size="sm">• MC/FDV ≥ 75%</Text>
            <Text size="sm">• Volume/MC ≥ 20%</Text>
            <Text size="sm">• Volume/FDV ≥ 10%</Text>
          </Group>
          
          <Group mb="xs">
            <Badge color="yellow" variant="filled">Medium Risk</Badge>
            <Text size="sm">All other combinations</Text>
          </Group>
        </div>
      </Card>
    </div>
  );
} 