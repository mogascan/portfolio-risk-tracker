import React, { useState, useEffect } from 'react';
import { Modal, NumberInput, Button, Stack, Group, Text, Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { usePortfolio } from '../../contexts/PortfolioContext';
import '@mantine/dates/styles.css';

function EditAssetModal({ opened, onClose, asset }) {
  const { updateAsset } = usePortfolio();
  
  const [assetData, setAssetData] = useState({
    amount: '',
    purchasePrice: '',
    purchaseDate: new Date(),
    transactionType: 'buy',
    notes: '',
    fee: 0
  });

  // Initialize form data when asset changes
  useEffect(() => {
    if (asset) {
      setAssetData({
        amount: asset.amount || '',
        purchasePrice: asset.purchasePrice || '',
        purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : new Date(),
        transactionType: 'buy',
        notes: '',
        fee: 0
      });
    }
  }, [asset]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (asset) {
      updateAsset(asset.id, {
        amount: parseFloat(assetData.amount),
        purchasePrice: parseFloat(assetData.purchasePrice),
        purchaseDate: assetData.purchaseDate
      });
    }
    onClose();
  };

  if (!asset) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Edit ${asset.symbol}`}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <Group>
            <Text weight={500} size="lg">{asset.symbol} - {asset.name}</Text>
          </Group>
          
          <Select
            label="Transaction Type"
            placeholder="Select transaction type"
            required
            data={[
              { value: 'buy', label: 'Buy' },
              { value: 'sell', label: 'Sell' }
            ]}
            value={assetData.transactionType}
            onChange={(value) => setAssetData({ ...assetData, transactionType: value })}
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
            label={`${assetData.transactionType === 'buy' ? 'Purchase' : 'Sell'} Price (USD)`}
            placeholder="0.00"
            required
            min={0}
            precision={2}
            value={assetData.purchasePrice}
            onChange={(val) => setAssetData({ ...assetData, purchasePrice: val })}
          />
          
          <NumberInput
            label="Fee (USD)"
            placeholder="0.00"
            min={0}
            precision={2}
            value={assetData.fee}
            onChange={(val) => setAssetData({ ...assetData, fee: val })}
          />
          
          <DateInput
            label="Transaction Date"
            placeholder="Select transaction date"
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
          
          <TextInput
            label="Notes (Optional)"
            placeholder="Add any notes about this transaction"
            value={assetData.notes}
            onChange={(e) => setAssetData({ ...assetData, notes: e.target.value })}
          />
          
          <Button type="submit" fullWidth mt="md">
            {assetData.transactionType === 'buy' ? 'Add Buy Transaction' : 'Add Sell Transaction'}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

export default EditAssetModal;
