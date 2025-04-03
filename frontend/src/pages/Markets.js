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
  ActionIcon,
  Tooltip,
  UnstyledButton,
  Pagination,
  Select,
  NumberInput,
  Stack
} from '@mantine/core';
import { IconStar, IconStarFilled, IconChevronUp, IconChevronDown, IconSelector, IconSearch } from '@tabler/icons-react';
import { useMarket } from '../contexts/MarketContext';
import { useWatchlist } from '../contexts/WatchlistContext';
import StickyTableHeader from '../components/Markets/StickyTableHeader';

function Markets() {
  const { topCoins, loading, error, lastUpdate, coinLimit, updateCoinLimit } = useMarket();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [sortBy, setSortBy] = useState('market_cap_rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [jumpToRank, setJumpToRank] = useState('');
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100);  // Fixed at 100 coins per page

  // Set default coin limit to 500 on first load
  useEffect(() => {
    if (coinLimit !== 500) {
      console.log("Setting default coin limit to 500");
      updateCoinLimit(500);
    }
  }, []);  // Empty dependency array ensures this only runs once on mount

  // Handle coin limit change
  const handleCoinsLimitChange = (value) => {
    console.log(`Changing coin limit from ${coinLimit} to ${value}`);
    updateCoinLimit(parseInt(value));
  };

  // Debug logging
  useEffect(() => {
    console.log("Markets component mounted");
    console.log("topCoins:", topCoins.length);
    console.log("loading:", loading);
    console.log("error:", error);
    console.log("coinLimit:", coinLimit);
  }, [topCoins, loading, error, coinLimit]);

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) {
      return (
        <Text style={{ textAlign: 'left', width: '100%' }}>
          N/A
        </Text>
      );
    }
    
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2
    }).format(price);
    
    return (
      <Text style={{ textAlign: 'left', width: '100%' }}>
        {formattedPrice}
      </Text>
    );
  };

  const formatMarketCap = (marketCap) => {
    // Check for undefined, null, or NaN values
    if (marketCap === undefined || marketCap === null || isNaN(marketCap)) {
      return (
        <Text style={{ textAlign: 'left', width: '100%' }}>
          N/A
        </Text>
      );
    }
    
    let formatted;
    if (marketCap >= 1e12) formatted = `$${(marketCap / 1e12).toFixed(2)}T`;
    else if (marketCap >= 1e9) formatted = `$${(marketCap / 1e9).toFixed(2)}B`;
    else if (marketCap >= 1e6) formatted = `$${(marketCap / 1e6).toFixed(2)}M`;
    else formatted = `$${marketCap.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    
    return (
      <Text style={{ textAlign: 'left', width: '100%' }}>
        {formatted}
      </Text>
    );
  };

  const formatPercentage = (percentage) => {
    // Check for undefined, null, or NaN values
    if (percentage === undefined || percentage === null || isNaN(percentage)) {
      return (
        <Text style={{ textAlign: 'left', width: '100%' }}>
          N/A
        </Text>
      );
    }
    
    const value = percentage.toFixed(2);
    const color = percentage >= 0 ? 'green' : 'red';
    return (
      <Text c={color} fw={500} style={{ width: '100%', textAlign: 'left' }}>
        {value}%
      </Text>
    );
  };

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
    rank: 'rank',
    name: 'name',
    price: 'priceUsd',
    change24h: 'change24h',
    change7d: 'change7d',
    change30d: 'change30d',
    marketCap: 'marketCap',
    volume: 'volume24h'
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

  // Sort market data
  // Add rank to each coin based on array index if not already present
  const rankedCoins = topCoins.map((coin, index) => ({
    ...coin,
    rank: coin.market_cap_rank || index + 1
  }));

  const sortedCoins = [...rankedCoins].sort((a, b) => {
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

  // Handle jump to rank
  const handleJumpToRank = () => {
    const rank = parseInt(jumpToRank);
    if (isNaN(rank) || rank < 1 || rank > sortedCoins.length) {
      return;
    }

    // Find the coin with the requested rank
    const coinIndex = sortedCoins.findIndex(coin => coin.rank === rank);
    if (coinIndex >= 0) {
      // Scroll to the coin
      const element = document.getElementById(`coin-${sortedCoins[coinIndex].id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setJumpToRank('');
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  // Add scroll detection for the sticky header
  useEffect(() => {
    const handleScroll = () => {
      // Get the table header
      const tableHeader = document.querySelector('.markets-table-header');
      
      // If the element doesn't exist, don't show the sticky header
      if (!tableHeader) {
        setShowStickyHeader(false);
        return;
      }
      
      // Get the position of the table header
      const rect = tableHeader.getBoundingClientRect();
      
      // When the header scrolls past the main app header (60px height), show the sticky header
      if (rect.top < 60 && rect.bottom < 60) {
        setShowStickyHeader(true);
      } else {
        setShowStickyHeader(false);
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
  }, []);

  // Column widths for consistent display
  const columnStyles = {
    rank: { width: '60px', textAlign: 'center', paddingLeft: '16px' },
    name: { width: '180px', textAlign: 'left' },
    price: { width: '120px', textAlign: 'left' },
    change24h: { width: '90px', textAlign: 'left' },
    change7d: { width: '90px', textAlign: 'left' },
    change30d: { width: '90px', textAlign: 'left' },
    marketCap: { width: '120px', textAlign: 'left' },
    volume: { width: '120px', textAlign: 'left' },
    actions: { width: '80px', textAlign: 'left' }
  };

  // Table cell style
  const thStyle = {
    position: 'sticky',
    top: 0,
    backgroundColor: '#f8f9fa',
    zIndex: 1,
    padding: '10px 4px',
    textAlign: 'left'
  };

  // Function to render table headers (used by both main table and sticky header)
  const renderTableHeaders = ({ columnStyles, stickyThStyle = thStyle, SortableHeader }) => {
    return (
      <>
        <th style={{...columnStyles.rank, ...stickyThStyle, textAlign: 'center'}}><SortableHeader column="rank" label="#" /></th>
        <th style={{...columnStyles.name, ...stickyThStyle}}><SortableHeader column="name" label="Name" /></th>
        <th style={{...columnStyles.price, ...stickyThStyle}}><SortableHeader column="price" label="Price" /></th>
        <th style={{...columnStyles.change24h, ...stickyThStyle}}><SortableHeader column="change24h" label="24h %" /></th>
        <th style={{...columnStyles.change7d, ...stickyThStyle}}><SortableHeader column="change7d" label="7d %" /></th>
        <th style={{...columnStyles.change30d, ...stickyThStyle}}><SortableHeader column="change30d" label="30d %" /></th>
        <th style={{...columnStyles.marketCap, ...stickyThStyle}}><SortableHeader column="marketCap" label="Market Cap" /></th>
        <th style={{...columnStyles.volume, ...stickyThStyle}}><SortableHeader column="volume" label="Volume (24h)" /></th>
        <th style={{...columnStyles.actions, ...stickyThStyle}}>
          <Text size="sm" fw={500} style={{ textAlign: 'left' }}>Watchlist</Text>
        </th>
      </>
    );
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
          <Text color="red" align="center">Error loading market data: {error}</Text>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group position="apart" align="center" mb="xl">
        <Title order={2} style={{ textAlign: 'center' }}>Markets</Title>
        
        <Group spacing="lg" align="center" position="center">
          <Select
            value={coinLimit.toString()}
            onChange={handleCoinsLimitChange}
            data={[
              { value: '100', label: '100 coins' },
              { value: '250', label: '250 coins' },
              { value: '500', label: '500 coins' }
            ]}
            style={{ width: 130, textAlign: 'center' }}
            styles={{ input: { textAlign: 'center' } }}
          />
          
          <Group spacing="xs" align="center" position="center">
            <NumberInput
              placeholder="Rank"
              value={jumpToRank}
              onChange={setJumpToRank}
              min={1}
              max={topCoins.length}
              step={1}
              width={80}
              styles={{
                wrapper: { width: 80 },
                input: { textAlign: 'center' }
              }}
            />
            <ActionIcon 
              variant="filled" 
              onClick={handleJumpToRank}
              size="md"
              disabled={!jumpToRank}
            >
              <IconSearch size={16} />
            </ActionIcon>
          </Group>
          
          <Stack spacing={0}>
            <Text size="xs" color="dimmed" style={{ textAlign: 'center' }}>
              Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
            </Text>
            <Text size="xs" color={topCoins.length < coinLimit ? "orange" : "green"} style={{ textAlign: 'center' }}>
              Showing {topCoins.length} of {coinLimit} requested coins
            </Text>
          </Stack>
        </Group>
      </Group>

      {showStickyHeader && (
        <StickyTableHeader
          visible={showStickyHeader}
          columnStyles={columnStyles}
          thStyle={thStyle}
          SortableHeader={SortableHeader}
          headerContent={renderTableHeaders}
        />
      )}

      <Paper withBorder shadow="xs" p={0}>
        <Table striped highlightOnHover>
          <thead className="markets-table-header">
            <tr>
              {renderTableHeaders({ columnStyles, SortableHeader })}
            </tr>
          </thead>
          <tbody>
            {paginatedCoins.map((coin) => (
              <tr key={coin.id} id={`coin-${coin.id}`}>
                <td style={{ ...columnStyles.rank, textAlign: 'center' }}>{coin.rank || 'N/A'}</td>
                <td style={columnStyles.name}>
                  <Group spacing="sm" noWrap>
                    <Image src={coin.image} width={24} height={24} radius="xs" />
                    <div>
                      <Tooltip label={coin.name} disabled={coin.name.length < 15}>
                        <Text fw={500} style={{ 
                          maxWidth: '140px', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {coin.name}
                        </Text>
                      </Tooltip>
                      <Text size="xs" color="dimmed">{coin.symbol?.toUpperCase()}</Text>
                    </div>
                  </Group>
                </td>
                <td style={{ ...columnStyles.price, paddingLeft: '8px' }}>{formatPrice(coin.priceUsd)}</td>
                <td style={{ ...columnStyles.change24h, paddingLeft: '8px' }}>{formatPercentage(coin.change24h)}</td>
                <td style={{ ...columnStyles.change7d, paddingLeft: '8px' }}>{formatPercentage(coin.change7d)}</td>
                <td style={{ ...columnStyles.change30d, paddingLeft: '8px' }}>{formatPercentage(coin.change30d)}</td>
                <td style={{ ...columnStyles.marketCap, paddingLeft: '8px' }}>{formatMarketCap(coin.marketCap)}</td>
                <td style={{ ...columnStyles.volume, paddingLeft: '8px' }}>{formatMarketCap(coin.volume24h)}</td>
                <td style={{ ...columnStyles.actions, paddingLeft: '8px' }}>
                  <Tooltip label={isInWatchlist(coin.id) ? "Remove from watchlist" : "Add to watchlist"}>
                    <ActionIcon
                      onClick={() => isInWatchlist(coin.id) 
                        ? removeFromWatchlist(coin.id) 
                        : addToWatchlist(coin)
                      }
                      color="yellow"
                      variant={isInWatchlist(coin.id) ? "filled" : "subtle"}
                    >
                      {isInWatchlist(coin.id) ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                    </ActionIcon>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Paper>

      <Group position="center" mt="md">
        <Pagination total={totalPages} value={currentPage} onChange={handlePageChange} />
      </Group>
    </Container>
  );
}

export default Markets; 