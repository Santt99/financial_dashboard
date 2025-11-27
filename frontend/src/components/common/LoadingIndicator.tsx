import React from 'react';
import { CircularProgress, Box } from '@mui/material';

export const LoadingIndicator: React.FC = () => (
  <Box display="flex" justifyContent="center" alignItems="center" p={2}><CircularProgress size={24} /></Box>
);
