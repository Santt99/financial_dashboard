import React from 'react';
import { Box, Typography } from '@mui/material';

export const CategoryList: React.FC<{ items: { category: string; total: number }[] }> = ({ items }) => (
  <Box mt={1}>
    <Typography variant="subtitle2">Categorías de Gastos:</Typography>
  {items.map((cat) => <Box key={cat.category}>{cat.category}: {cat.total.toFixed(2)}</Box>)}
  </Box>
);
