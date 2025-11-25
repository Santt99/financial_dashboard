import React from 'react';
import { Card, CardContent, Typography, Stack, Divider, Box } from '@mui/material';
import { DashboardSummary } from '../../types/api';
import { formatCurrency } from '../../utils/format';

interface Props { summary: DashboardSummary; }

export const SummaryCard: React.FC<Props> = ({ summary }) => {
  const next = summary.upcoming_payments[0];
  const totalMin = summary.upcoming_payments.reduce((a, p) => a + p.estimated_minimum, 0);
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>Resumen</Typography>
        <Stack spacing={1.2}>
          <Box>
            <Typography variant="body2" color="text.secondary">Deuda Total</Typography>
            <Typography variant="h5" fontWeight={600}>{formatCurrency(summary.total_debt)}</Typography>
          </Box>
          <Divider flexItem />
          <Box>
            <Typography variant="body2" color="text.secondary">Pagos Este Ciclo (Mín. Est.)</Typography>
            <Typography variant="subtitle1" fontWeight={600}>{formatCurrency(totalMin)}</Typography>
          </Box>
          {next && (
            <Box>
              <Typography variant="body2" color="text.secondary">Próximo Vencimiento</Typography>
              <Typography variant="subtitle2" fontWeight={600}>{next.card_name}: {next.due_date}</Typography>
              <Typography variant="caption" color="text.secondary">Mín: {formatCurrency(next.estimated_minimum)}</Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
