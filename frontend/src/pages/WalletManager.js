// frontend/src/pages/WalletManager.js
import React, { useState } from 'react';
import { 
  Container,
  Title, 
  TextInput, 
  Button, 
  Group, 
  Stack,
  Text,
  Select,
  Paper,
  SimpleGrid
} from '@mantine/core';

function WalletManager() {
  const [newWallet, setNewWallet] = useState({
    name: '',
    address: '',
    type: ''
  });

  const [newExchange, setNewExchange] = useState({
    name: '',
    apiKey: '',
    apiSecret: ''
  });

  const [wallets, setWallets] = useState([]);
  const [exchanges, setExchanges] = useState([]);

  const handleAddWallet = () => {
    if (newWallet.name && newWallet.address && newWallet.type) {
      setWallets([...wallets, { ...newWallet, id: Date.now() }]);
      setNewWallet({ name: '', address: '', type: '' });
    }
  };

  const handleAddExchange = () => {
    if (newExchange.name && newExchange.apiKey && newExchange.apiSecret) {
      setExchanges([...exchanges, { ...newExchange, id: Date.now() }]);
      setNewExchange({ name: '', apiKey: '', apiSecret: '' });
    }
  };

  return (
    <Container size="xl">
      <Title order={1} mb="xl">Wallet Manager</Title>

      <SimpleGrid cols={2} spacing="xl">
        {/* Add Wallet Section */}
        <Stack>
          <Title order={2}>Add Wallet</Title>
          <TextInput
            label="Wallet Name"
            placeholder="My Bitcoin Wallet"
            value={newWallet.name}
            onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
            mb="md"
          />
          <TextInput
            label="Wallet Address"
            placeholder="Enter wallet address"
            value={newWallet.address}
            onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
            mb="md"
          />
          <Select
            label="Wallet Type"
            placeholder="Select wallet type"
            value={newWallet.type}
            onChange={(value) => setNewWallet({ ...newWallet, type: value })}
            data={[
              { value: 'bitcoin', label: 'Bitcoin' },
              { value: 'ethereum', label: 'Ethereum' },
              { value: 'solana', label: 'Solana' }
            ]}
            mb="xl"
          />
          <Button 
            fullWidth
            onClick={handleAddWallet}
          >
            Add Wallet
          </Button>
        </Stack>

        {/* Add Exchange Section */}
        <Stack>
          <Title order={2}>Add Exchange</Title>
          <TextInput
            label="Exchange Name"
            placeholder="Binance"
            value={newExchange.name}
            onChange={(e) => setNewExchange({ ...newExchange, name: e.target.value })}
            mb="md"
          />
          <TextInput
            label="API Key"
            placeholder="Enter API key"
            value={newExchange.apiKey}
            onChange={(e) => setNewExchange({ ...newExchange, apiKey: e.target.value })}
            mb="md"
          />
          <TextInput
            label="API Secret"
            placeholder="Enter API secret"
            type="password"
            value={newExchange.apiSecret}
            onChange={(e) => setNewExchange({ ...newExchange, apiSecret: e.target.value })}
            mb="xl"
          />
          <Button 
            fullWidth
            onClick={handleAddExchange}
          >
            Add Exchange
          </Button>
        </Stack>
      </SimpleGrid>

      {/* Your Wallets Section */}
      <Stack mt="xl">
        <Title order={2}>Your Wallets</Title>
        {wallets.length > 0 ? (
          wallets.map(wallet => (
            <Paper key={wallet.id} p="md" withBorder>
              <Group position="apart">
                <div>
                  <Text weight={500}>{wallet.name}</Text>
                  <Text size="sm" color="dimmed">{wallet.address}</Text>
                  <Text size="sm" color="dimmed">Type: {wallet.type}</Text>
                </div>
                <Button 
                  variant="subtle" 
                  color="red"
                  onClick={() => setWallets(wallets.filter(w => w.id !== wallet.id))}
                >
                  Remove
                </Button>
              </Group>
            </Paper>
          ))
        ) : (
          <Text c="dimmed">No wallets added yet</Text>
        )}
      </Stack>

      {/* Your Exchanges Section */}
      <Stack mt="xl">
        <Title order={2}>Your Exchanges</Title>
        {exchanges.length > 0 ? (
          exchanges.map(exchange => (
            <Paper key={exchange.id} p="md" withBorder>
              <Group position="apart">
                <div>
                  <Text weight={500}>{exchange.name}</Text>
                  <Text size="sm" color="dimmed">API Key: ••••••••{exchange.apiKey.slice(-4)}</Text>
                </div>
                <Button 
                  variant="subtle" 
                  color="red"
                  onClick={() => setExchanges(exchanges.filter(e => e.id !== exchange.id))}
                >
                  Remove
                </Button>
              </Group>
            </Paper>
          ))
        ) : (
          <Text c="dimmed">No exchanges added yet</Text>
        )}
      </Stack>
    </Container>
  );
}

export default WalletManager;