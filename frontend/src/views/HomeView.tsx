import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { DashboardPanel } from '../components/dashboard/DashboardPanel';
import { FileUploadZone } from '../components/dashboard/FileUploadZone';

export const HomeView: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Box mb={4}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Visión General Financiera
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Monitorea tus tarjetas de crédito, patrones de gasto y proyecciones futuras.
      </Typography>
    </Box>
    <DashboardPanel />
    <Box mt={4}>
      <FileUploadZone />
    </Box>
  </Container>
);
