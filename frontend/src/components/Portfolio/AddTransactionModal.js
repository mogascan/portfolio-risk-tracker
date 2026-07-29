import React, { useState } from 'react';
import { Modal, Select, NumberInput, Button, Stack, Group, Text, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { usePortfolio } from '../../contexts/PortfolioContext';
import '@mantine/dates/styles.css';

function AddTransactionModal({ opened, onClose, asset }) {
  const { addTransaction } = usePortfolio();
  
  const [transactionData, setTransactionData] = useState({
    type: 'buy',
    amount: '',
    price: '',
    date: new Date(),
    notes: '',
    fee: 0
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (opened && asset) {
      setTransactionData({
        type: 'buy',
        amount: '',
        price: '',
        date: new Date(),
        notes: '',
        fee: 0
      });
    }
  }, [opened, asset]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (asset) {
      addTransaction(asset.id, {
        ...transactionData,
        amount: parseFloat(transactionData.amount),
        price: parseFloat(transactionData.price),
        fee: parseFloat(transactionData.fee) || 0
      });
    }
    onClose();
  };

  if (!asset) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Add Transaction - ${asset.symbol}`}
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
            value={transactionData.type}
            onChange={(value) => setTransactionData({ ...transactionData, type: value })}
          />
          
          <NumberInput
            label="Amount"
            placeholder="0.00"
            required
            min={0}
            precision={8}
            value={transactionData.amount}
            onChange={(val) => setTransactionData({ ...transactionData, amount: val })}
          />
          
          <NumberInput
            label={`${transactionData.type === 'buy' ? 'Purchase' : 'Sell'} Price (USD)`}
            placeholder="0.00"
            required
            min={0}
            precision={2}
            value={transactionData.price}
            onChange={(val) => setTransactionData({ ...transactionData, price: val })}
          />
          
          <NumberInput
            label="Fee (USD)"
            placeholder="0.00"
            min={0}
            precision={2}
            value={transactionData.fee}
            onChange={(val) => setTransactionData({ ...transactionData, fee: val })}
          />
          
          <DateInput
            label="Transaction Date"
            placeholder="Select transaction date"
            value={transactionData.date}
            onChange={(date) => setTransactionData({ ...transactionData, date: date })}
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
            value={transactionData.notes}
            onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
          />
          
          <Button type="submit" fullWidth mt="md">
            Add Transaction
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

export default AddTransactionModal;

