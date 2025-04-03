import React, { useState, useMemo } from 'react';
import { Modal, Select, NumberInput, Button, Stack, Group, Text, Image } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useMarket } from '../../contexts/MarketContext';
import '@mantine/dates/styles.css';

function AddAssetModal({ opened, onClose }) {
  const { addAsset } = usePortfolio();
  const { topCoins } = useMarket();
  
  const [assetData, setAssetData] = useState({
    symbol: '',
    name: '',
    coinId: '',
    amount: '',
    purchasePrice: '',
    purchaseDate: new Date()
  });

  // Create cryptocurrency options from live CoinGecko data
  const cryptoOptions = useMemo(() => {
    if (!topCoins || topCoins.length === 0) return [];
    
    return topCoins.map(coin => ({
      value: coin.id,
      label: `${coin.name} (${coin.symbol.toUpperCase()})`,
      symbol: coin.symbol.toUpperCase(),
      icon: coin.image,
      price: coin.current_price
    }));
  }, [topCoins]);

  const handleCoinSelect = (coinId) => {
    const selectedCoin = cryptoOptions.find(coin => coin.value === coinId);
    if (selectedCoin) {
      setAssetData({
        ...assetData,
        coinId: selectedCoin.value,
        symbol: selectedCoin.symbol,
        name: selectedCoin.label.split(' (')[0],
        purchasePrice: selectedCoin.price
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addAsset({
      ...assetData,
      amount: parseFloat(assetData.amount),
      purchasePrice: parseFloat(assetData.purchasePrice)
    });
    setAssetData({ 
      symbol: '', 
      name: '',
      coinId: '',
      amount: '', 
      purchasePrice: '', 
      purchaseDate: new Date() 
    });
    onClose();
  };

  const SelectItem = ({ label, icon, ...others }) => (
    <div {...others}>
      <Group>
        {typeof icon === 'string' && icon.startsWith('http') ? (
          <Image src={icon} width={24} height={24} />
        ) : (
          <span style={{ fontFamily: 'monospace', fontSize: '1.2em' }}>{icon}</span>
        )}
        <Text>{label}</Text>
      </Group>
    </div>
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add New Asset"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <Select
            label="Select Cryptocurrency"
            placeholder="Choose a cryptocurrency"
            data={cryptoOptions}
            searchable
            required
            value={assetData.coinId}
            onChange={handleCoinSelect}
            itemComponent={SelectItem}
            maxDropdownHeight={400}
            nothingFound="Loading cryptocurrencies..."
          />
          <NumberInput
            label="Amount"
            placeholder="0.00"
            required
            min={0}
            precision={8}
            value={assetData.amount}
            onChange={(val) => setAssetData({ ...assetData, amount: val })}
          />
          <NumberInput
            label="Purchase Price (USD)"
            placeholder="0.00"
            required
            min={0}
            precision={2}
            value={assetData.purchasePrice}
            onChange={(val) => setAssetData({ ...assetData, purchasePrice: val })}
          />
          <DateInput
            label="Purchase Date"
            placeholder="Select purchase date"
            value={assetData.purchaseDate}
            onChange={(date) => setAssetData({ ...assetData, purchaseDate: date })}
            required
            maxDate={new Date()}
            styles={(theme) => ({
              input: {
                height: '36px'
              },
              calendarHeader: {
                marginBottom: '10px'
              },
              calendarHeaderControl: {
                width: '24px',
                height: '24px',
                '&:hover': {
                  backgroundColor: theme.colors.gray[0]
                }
              },
              calendarHeaderLevel: {
                fontSize: '14px'
              },
              day: {
                height: '32px',
                width: '32px',
                fontSize: '13px'
              },
              weekday: {
                fontSize: '12px',
                color: theme.colors.gray[6]
              },
              monthCell: {
                fontSize: '13px'
              }
            })}
          />
          <Button type="submit" fullWidth mt="md">
            Add Asset
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

export default AddAssetModal; 