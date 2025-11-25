import React from 'react';
import { Box, Typography } from '@mui/material';
import { Projection } from '../../types/api';

export const ProjectionList: React.FC<{ items: Projection[] }> = ({ items }) => (
  <Box mt={2}>
    <Typography variant="subtitle2">Next 6 Months Projection:</Typography>
  {items.map((p: Projection) => <Box key={p.month}>{p.month}: Bal {p.projected_balance.toFixed(2)} MinPay {p.projected_min_payment.toFixed(2)}</Box>)}
  </Box>
);
