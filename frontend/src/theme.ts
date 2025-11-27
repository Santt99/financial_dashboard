import { createTheme } from '@mui/material/styles';

const palette = {
  primaryDark: '#0F1412',
  greenDark: '#0F3A32',
  green: '#1A4F43',
  beigeBg: '#F8F6F1',
  beigeCard: '#FCFBF8'
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: palette.green },
    background: { default: palette.beigeBg, paper: palette.beigeCard },
    text: { primary: '#111', secondary: '#555' }
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial, sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  components: {
    MuiAppBar: { styleOverrides: { root: { background: palette.primaryDark } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 14, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } } },
    MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 10, fontWeight: 500 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } }
  }
});
