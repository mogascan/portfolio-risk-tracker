import React from 'react';
import { Card as MantineCard } from '@mantine/core';

const Card = ({ children, ...props }) => {
  return (
    <MantineCard
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      {...props}
    >
      {children}
    </MantineCard>
  );
};

export default Card;
