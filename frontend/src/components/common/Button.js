import React from 'react';
import { Button as MantineButton } from '@mantine/core';

const Button = ({ children, ...props }) => {
  return (
    <MantineButton
      variant="filled"
      radius="md"
      {...props}
    >
      {children}
    </MantineButton>
  );
};

export default Button;
