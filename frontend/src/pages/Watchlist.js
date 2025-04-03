import React, { useState, useEffect } from 'react';
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
  Select
} from '@mantine/core';
import { IconSearch, IconPlus, IconTrash, IconStar, IconStarFilled, IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useMarket } from '../contexts/MarketContext';

function Watchlist() {
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { topCoins, loading, error, lastUpdate } = useMarket();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [sortBy, setSortBy] = useState('market_cap_rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debug logging for Watchlist component
  useEffect(() => {
    console.log('[Watchlist] watchlist IDs:', watchlist);
    console.log('[Watchlist] topCoins count:', topCoins.length);
    console.log('[Watchlist] topCoins example:', topCoins.slice(0, 3));
  }, [watchlist, topCoins]);

  // Column width definitions for consistent layout
  const columnStyles = {
    rank: { width: '6%', textAlign: 'left' },
    name: { width: '19%', textAlign: 'left' },
    price: { width: '12%', textAlign: 'left' },
    change24h: { width: '8%', textAlign: 'left' },
    change7d: { width: '8%', textAlign: 'left' },
    change30d: { width: '8%', textAlign: 'left' },
    change1y: { width: '8%', textAlign: 'left' },
    marketCap: { width: '15%', textAlign: 'left' },
    volume: { width: '11%', textAlign: 'left' },
    actions: { width: '5%', textAlign: 'center' }
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

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
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
                <th style={{...columnStyles.actions, ...thStyle}}>
                  <Text size="sm" fw={500} style={{ textAlign: 'center' }}>Actions</Text>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCoins.map((coin) => (
                <tr key={coin.id}>
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
                  <td style={{...columnStyles.actions, textAlign: 'center'}}>
                    <Tooltip label="Remove from watchlist">
                      <ActionIcon color="red" onClick={() => removeFromWatchlist(coin.id)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </td>
                </tr>
              ))}
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