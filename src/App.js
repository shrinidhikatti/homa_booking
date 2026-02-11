import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Dashboard from './pages/Dashboard';
import Login from './components/Login';

// Enhanced theme with spiritual elegance
const theme = createTheme({
  palette: {
    primary: {
      main: '#8B4513', // Saddle Brown - earthy, warm
      light: '#A0522D',
      dark: '#654321',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF8C00', // Dark Orange - saffron accent
      light: '#FFA500',
      dark: '#FF6B00',
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
      default: '#FAF8F5', // Warm off-white
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C2418',
      secondary: '#6B5B47',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Spectral", "Segoe UI", "Helvetica Neue", sans-serif',
    h1: {
      fontFamily: '"Spectral", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontFamily: '"Spectral", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Spectral", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: '"Spectral", Georgia, serif',
      fontWeight: 600,
      letterSpacing: '-0.005em',
    },
    h5: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      letterSpacing: '0',
    },
    h6: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      letterSpacing: '0',
    },
    subtitle1: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
    subtitle2: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
    body1: {
      fontFamily: '"Outfit", sans-serif',
      letterSpacing: '0.01em',
    },
    body2: {
      fontFamily: '"Outfit", sans-serif',
      letterSpacing: '0.01em',
    },
    button: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    '0 4px 8px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)',
    '0 8px 16px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
    '0 12px 24px rgba(0,0,0,0.10), 0 6px 12px rgba(0,0,0,0.05)',
    '0 16px 32px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)',
    '0 20px 40px rgba(0,0,0,0.14), 0 10px 20px rgba(0,0,0,0.07)',
    '0 24px 48px rgba(0,0,0,0.16), 0 12px 24px rgba(0,0,0,0.08)',
    '0 28px 56px rgba(0,0,0,0.18), 0 14px 28px rgba(0,0,0,0.09)',
    '0 32px 64px rgba(0,0,0,0.20), 0 16px 32px rgba(0,0,0,0.10)',
    '0 36px 72px rgba(0,0,0,0.22), 0 18px 36px rgba(0,0,0,0.11)',
    '0 40px 80px rgba(0,0,0,0.24), 0 20px 40px rgba(0,0,0,0.12)',
    '0 44px 88px rgba(0,0,0,0.26), 0 22px 44px rgba(0,0,0,0.13)',
    '0 48px 96px rgba(0,0,0,0.28), 0 24px 48px rgba(0,0,0,0.14)',
    '0 52px 104px rgba(0,0,0,0.30), 0 26px 52px rgba(0,0,0,0.15)',
    '0 56px 112px rgba(0,0,0,0.32), 0 28px 56px rgba(0,0,0,0.16)',
    '0 60px 120px rgba(0,0,0,0.34), 0 30px 60px rgba(0,0,0,0.17)',
    '0 64px 128px rgba(0,0,0,0.36), 0 32px 64px rgba(0,0,0,0.18)',
    '0 68px 136px rgba(0,0,0,0.38), 0 34px 68px rgba(0,0,0,0.19)',
    '0 72px 144px rgba(0,0,0,0.40), 0 36px 72px rgba(0,0,0,0.20)',
    '0 76px 152px rgba(0,0,0,0.42), 0 38px 76px rgba(0,0,0,0.21)',
    '0 80px 160px rgba(0,0,0,0.44), 0 40px 80px rgba(0,0,0,0.22)',
    '0 84px 168px rgba(0,0,0,0.46), 0 42px 84px rgba(0,0,0,0.23)',
    '0 88px 176px rgba(0,0,0,0.48), 0 44px 88px rgba(0,0,0,0.24)',
    '0 92px 184px rgba(0,0,0,0.50), 0 46px 92px rgba(0,0,0,0.25)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Spectral:wght@400;500;600;700&display=swap');

        body {
          background: linear-gradient(135deg, #FAF8F5 0%, #FFF9F0 100%);
        }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '10px',
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #A0522D 0%, #8B4513 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: '16px',
          border: '1px solid rgba(139, 69, 19, 0.08)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)',
        },
        elevation3: {
          boxShadow: '0 8px 20px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9F0 100%)',
          color: '#2C2418',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          borderBottom: '1px solid rgba(139, 69, 19, 0.1)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          letterSpacing: '0.02em',
          fontFamily: '"Outfit", sans-serif',
          minHeight: '56px',
          padding: '12px 24px',
          color: '#6B5B47',
          transition: 'all 0.3s ease',
          '&:hover': {
            color: '#FF8C00',
            backgroundColor: 'rgba(255, 140, 0, 0.04)',
          },
          '&.Mui-selected': {
            color: '#FF8C00',
            fontWeight: 700,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: '3px',
          borderRadius: '3px 3px 0 0',
          background: 'linear-gradient(90deg, #FF6B00 0%, #FF8C00 50%, #FFA500 100%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: '1px solid rgba(139, 69, 19, 0.08)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 20px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 600,
          letterSpacing: '0.02em',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            transition: 'all 0.3s ease',
            '& fieldset': {
              borderColor: 'rgba(139, 69, 19, 0.15)',
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(139, 69, 19, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FF8C00',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: 'rgba(139, 69, 19, 0.04)',
            fontWeight: 700,
            fontSize: '0.875rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#6B5B47',
            borderBottom: '2px solid rgba(139, 69, 19, 0.1)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(139, 69, 19, 0.06)',
          padding: '16px',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 6px 20px rgba(255, 140, 0, 0.3)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(255, 140, 0, 0.4)',
          },
        },
        primary: {
          background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Spectral", Georgia, serif',
          fontSize: '1.75rem',
          fontWeight: 600,
          color: '#2C2418',
          paddingBottom: '8px',
          borderBottom: '2px solid rgba(255, 140, 0, 0.2)',
        },
      },
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [purohitId, setPurohitId] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const authData = localStorage.getItem('homaBookingAuth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.isLoggedIn) {
          setIsAuthenticated(true);
          setUserRole(parsed.role || 'admin');
          setPurohitId(parsed.purohitId || null);
        }
      } catch (e) {
        localStorage.removeItem('homaBookingAuth');
      }
    }
  }, []);

  const handleLogin = (status, role, purohitIdParam) => {
    setIsAuthenticated(status);
    setUserRole(role);
    setPurohitId(purohitIdParam || null);
  };

  const handleLogout = () => {
    localStorage.removeItem('homaBookingAuth');
    setIsAuthenticated(false);
    setUserRole(null);
    setPurohitId(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        {isAuthenticated ? (
          <Dashboard onLogout={handleLogout} userRole={userRole} purohitId={purohitId} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
