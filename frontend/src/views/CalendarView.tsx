import React from 'react';
import { Box, Typography, Grid, Card, CardContent, List, ListItem, ListItemText, Chip, Divider } from '@mui/material';
import { useData } from '../contexts/DataContext';
import { formatDate, formatCurrency } from '../utils/format';

// Simple calendar-like grouped list of upcoming events (due dates + projection months)
export const CalendarView: React.FC = () => {
  const { summary, aggregateProjections, cardDetail, selectedCard } = useData();

  const dueEvents = (summary?.upcoming_payments || []).map((p: { card_name: string; due_date: string; estimated_minimum: number }) => ({
    type: 'Fecha de Vencimiento',
    label: `${p.card_name} Mínimo`,
    date: p.due_date,
    value: p.estimated_minimum
  }));

  const projectionSrc = selectedCard && cardDetail ? cardDetail.projections : aggregateProjections || [];
  const projectionEvents = projectionSrc.slice(0, 6).map((p: { month: string; projected_balance: number }) => ({
    type: 'Proyección',
    label: 'Saldo Proyectado',
    date: p.month,
    value: p.projected_balance
  }));

  const events = [...dueEvents, ...projectionEvents];

  // group by date string
  const grouped: Record<string, typeof events> = {} as any;
  events.forEach(e => { (grouped[e.date] = grouped[e.date] || []).push(e); });
  const dates = Object.keys(grouped).sort();

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={2}>Fechas Próximas</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Fechas de vencimiento y puntos de control de saldo proyectado para los próximos meses.</Typography>
      <Grid container spacing={2}>
        {dates.map(d => (
          <Grid item xs={12} md={6} lg={4} key={d}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>{formatDate(d, 'long')}</Typography>
                <Divider sx={{ my:1 }} />
                <List dense>
                  {grouped[d].map((ev, idx) => (
                    <ListItem key={idx} disableGutters secondaryAction={<Chip size="small" color={ev.type === 'Fecha de Vencimiento' ? 'primary' : 'default'} label={formatCurrency(ev.value)} />}> 
                      <ListItemText primary={ev.label} secondary={ev.type} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {!dates.length && (
          <Grid item xs={12}><Typography color="text.secondary">No hay eventos disponibles.</Typography></Grid>
        )}
      </Grid>
    </Box>
  );
};
