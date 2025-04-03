import React from 'react';
import { Loader } from '@mantine/core';

const Loading = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <Loader size="xl" />
    </div>
  );
};

export default Loading;
