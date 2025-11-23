import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Dashboard from './pages/Dashboard';
import Login from './components/Login';

// Custom theme with Indian cultural colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#880E4F', // Maroon/Burgundy
      light: '#BC477B',
      dark: '#560027',
      contrastText: '#fff',
    },
    secondary: {
      main: '#004E89', // Deep Blue
      light: '#2970A0',
      dark: '#003562',
      contrastText: '#fff',
    },
    success: {
      main: '#66BB6A',
      light: '#81C784',
      dark: '#388E3C',
    },
    warning: {
      main: '#FFA726',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    error: {
      main: '#EF5350',
      light: '#E57373',
      dark: '#C62828',
    },
    info: {
      main: '#42A5F5',
      light: '#64B5F6',
      dark: '#1976D2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const authData = localStorage.getItem('homaBookingAuth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.isLoggedIn) {
          setIsAuthenticated(true);
        }
      } catch (e) {
        localStorage.removeItem('homaBookingAuth');
      }
    }
  }, []);

  const handleLogin = (status) => {
    setIsAuthenticated(status);
  };

  const handleLogout = () => {
    localStorage.removeItem('homaBookingAuth');
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        {isAuthenticated ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
