import React from 'react';
import { Container, Box, Typography, Paper } from '@mui/material';
import { AuthForms } from '../components/auth/AuthForms';

export const LoginView: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" fontWeight={600}>Bienvenido</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Inicia sesión o crea una cuenta para acceder a tu panel financiero.
          </Typography>
        </Box>
        <AuthForms />
      </Paper>
    </Container>
  );
};
