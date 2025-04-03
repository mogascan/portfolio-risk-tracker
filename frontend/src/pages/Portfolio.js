import React, { useState } from 'react';
import { Container, Title, Group, Button, Divider, Box } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import AssetList from '../components/Portfolio/AssetList';
import ProfitLossChart from '../components/Portfolio/ProfitLossChart';
import PortfolioSummary from '../components/Portfolio/PortfolioSummary';
import AddAssetModal from '../components/Portfolio/AddAssetModal';

function Portfolio() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xs">
        <Title order={2}>Portfolio</Title>
        <Button 
          leftSection={<IconPlus size={14} />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Asset
        </Button>
      </Group>
      
      <PortfolioSummary showTitle={false} />
      
      <Group grow align="flex-start" mt="md">
        <ProfitLossChart />
      </Group>
      
      <AssetList />

      <AddAssetModal
        opened={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </Container>
  );
}

export default Portfolio; 