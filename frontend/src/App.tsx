import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { HomeView } from './views/HomeView';
import { LoginView } from './views/LoginView';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { AppBar, Toolbar, Typography, Box, Button, Stack } from '@mui/material';
import { CalendarView } from './views/CalendarView';
import { useAuth } from './contexts/AuthContext';

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <DataProvider>{children}</DataProvider>
  </AuthProvider>
);

const TopBar: React.FC = () => {
  const { token, logout } = useAuth();
  const location = useLocation();
  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Panel Financiero
        </Typography>
        {token && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Button color="inherit" component={Link} to="/" variant={location.pathname==='/'? 'outlined':'text'}>Panel</Button>
            <Button color="inherit" component={Link} to="/calendar" variant={location.pathname==='/calendar'? 'outlined':'text'}>Calendario</Button>
            <Button color="inherit" onClick={logout}>Cerrar Sesión</Button>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
};

const App: React.FC = () => (
  <Providers>
    <BrowserRouter>
      <TopBar />
      <Box>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route path="/" element={
            <ProtectedRoute>
              <HomeView />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <CalendarView />
            </ProtectedRoute>
          } />
        </Routes>
      </Box>
    </BrowserRouter>
  </Providers>
);

export default App;
