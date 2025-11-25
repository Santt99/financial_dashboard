import React from 'react';
import { Box, TextField, Button, Typography, Stack, IconButton, InputAdornment, Alert, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export const AuthForms: React.FC = () => {
  const { token, login, register, logout } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const validEmail = /.+@.+\..+/.test(email);
  const pwStrong = password.length >= 6;
  const canSubmit = validEmail && pwStrong && !loading;

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const ok = mode === 'login' ? await login(email, password) : await register(email, password);
      if (ok) navigate('/');
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Authentication failed');
    } finally { setLoading(false); }
  }

  if (token) {
    return (
      <Stack spacing={2} mb={2}>
        <Alert severity="success">Has iniciado sesión.</Alert>
        <Button onClick={logout} variant="outlined" color="inherit">Cerrar Sesión</Button>
      </Stack>
    );
  }

  return (
    <Box>
  <ToggleButtonGroup exclusive size="small" value={mode} onChange={(_e: React.MouseEvent<HTMLElement>, v: 'login' | 'signup' | null) => v && setMode(v)} sx={{ mb: 2 }}>
        <ToggleButton value="login">Iniciar Sesión</ToggleButton>
        <ToggleButton value="signup">Registrarse</ToggleButton>
      </ToggleButtonGroup>
      <Stack spacing={2}>
        <TextField label="Correo Electrónico" type="email" fullWidth value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} error={!!email && !validEmail} helperText={!!email && !validEmail ? 'Ingresa un correo válido' : ' '} />
        <TextField label="Contraseña" fullWidth type={showPw ? 'text' : 'password'} value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} error={!!password && !pwStrong} helperText={!!password && !pwStrong ? 'Mínimo 6 caracteres' : ' '} InputProps={{ endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={() => setShowPw((s: boolean) => !s)} edge="end" size="small">{showPw ? <VisibilityOff /> : <Visibility />}</IconButton>
          </InputAdornment>
        ) }} />
        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
        <Button disabled={!canSubmit} variant="contained" onClick={handleSubmit} size="large">{loading ? (mode==='login'?'Iniciando sesión...':'Creando cuenta...') : (mode==='login'?'Iniciar Sesión':'Crear Cuenta')}</Button>
        <Typography variant="caption" color="text.secondary" textAlign="center">Al continuar aceptas nuestros Términos y Política de Privacidad.</Typography>
      </Stack>
    </Box>
  );
};
