import React from 'react';
import { Grid, Box, Fade, Card, CardContent, Typography, Stack, MenuItem, TextField } from '@mui/material';
import { useData } from '../../contexts/DataContext';
import { SummaryCard } from './SummaryCard';
import { CategoriesCard } from './CategoriesCard';
import { ProjectionsCard } from './ProjectionsCard';
import { formatCurrency, formatNumber } from '../../utils/format';

export const DashboardPanel: React.FC = () => {
  const { summary, selectedCard, selectCard, cardDetail, aggregateCategories, aggregateProjections } = useData();

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Resumen */}
        <Grid item xs={12} md={4}>
          {summary && <Fade in timeout={400}><div><SummaryCard summary={summary} /></div></Fade>}
        </Grid>
        
        {/* Proyección de Pagos */}
        <Grid item xs={12} md={8}>
          <ProjectionsCard detail={cardDetail} aggregate={aggregateProjections} />
        </Grid>
        
        {/* Gastos por Categorías */}
        <Grid item xs={12} md={6}>
          <CategoriesCard detail={cardDetail} aggregate={aggregateCategories} />
        </Grid>
        
        {/* Tarjetas */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Tarjetas</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Selecciona una tarjeta para ver proyecciones y categorías</Typography>
              {summary && (
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Tarjeta"
                  value={selectedCard || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => selectCard(e.target.value || null)}
                >
                  <MenuItem value="">Todas las Tarjetas</MenuItem>
                  {summary.cards.map((c: { id: string; name: string; balance: number }) => (
                    <MenuItem key={c.id} value={c.id}>{c.name} ({formatCurrency(c.balance, 0)})</MenuItem>
                  ))}
                </TextField>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
