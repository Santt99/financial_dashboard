import React from 'react';
import { Card, CardContent, Typography, Stack, LinearProgress, Box } from '@mui/material';
import { CardDetail } from '../../types/api';

interface Props { detail: CardDetail | null; aggregate?: { category: string; total: number }[] | null }

export const CategoriesCard: React.FC<Props> = ({ detail, aggregate }) => {
  const source = detail ? detail.category_aggregates : aggregate;
  if (!source || source.length === 0) return null;
  const total = source.reduce((a, c) => a + c.total, 0) || 1;
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>Categorías de Gastos</Typography>
        <Stack spacing={1.2}>
          {source.map(cat => {
            const pct = (cat.total / total) * 100;
            return (
              <Box key={cat.category}>
                <Stack direction="row" justifyContent="space-between" mb={0.3}>
                  <Typography variant="body2" fontWeight={500}>{cat.category}</Typography>
                  <Typography variant="caption" color="text.secondary">{pct.toFixed(0)}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3 }} />
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
};
