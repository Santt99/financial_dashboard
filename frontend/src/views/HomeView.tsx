import React from 'react';
import { Box, Container, Typography, Alert } from '@mui/material';
import { DashboardPanel } from '../components/dashboard/DashboardPanel';
import { FileUploadZone } from '../components/dashboard/FileUploadZone';
import { useData } from '../contexts/DataContext';

export const HomeView: React.FC = () => {
  const { summary } = useData();
  const hasCards = summary && summary.cards && summary.cards.length > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Visión General Financiera
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {hasCards 
            ? 'Monitorea tus tarjetas de crédito, patrones de gasto y proyecciones futuras.'
            : 'Carga tu primera tarjeta de crédito para comenzar.'}
        </Typography>
      </Box>

      {hasCards ? (
        <>
          <DashboardPanel />
          <Box mt={4}>
            <FileUploadZone />
          </Box>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Alert severity="info" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            <Typography variant="body2" fontWeight={600} mb={1}>
              Comienza cargando tu primer estado de cuenta
            </Typography>
            <Typography variant="body2">
              Sube un PDF o imagen del estado de tu tarjeta de crédito para ver tu análisis financiero.
            </Typography>
          </Alert>
          <FileUploadZone />
        </Box>
      )}
    </Container>
  );
};
