import React from 'react';
import { Box, Typography } from '@mui/material';
import { DashboardSummary } from '../../types/api';

export const SummaryHeader: React.FC<{ summary: DashboardSummary }> = ({ summary }) => (
  <Box mb={2}>
    <Typography>Total Debt: {summary.total_debt.toFixed(2)}</Typography>
    <Typography variant="subtitle2">Upcoming Payments:</Typography>
    {summary.upcoming_payments.map((u) => (
      <Box key={u.card_id}>{u.card_name}: {u.due_date} (Est Min: {u.estimated_minimum.toFixed(2)})</Box>
    ))}
  </Box>
);
