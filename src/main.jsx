import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App.jsx';
import './index.css';
import './styles.css';

// Material UI theme: dark navy with purple and cyan accents.
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#8b5cf6' },
    secondary: { main: '#22d3ee' },
    background: { default: '#060a1a', paper: '#0f1736' },
    text: { primary: '#e6e9f5', secondary: '#94a3c4' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", Roboto, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
