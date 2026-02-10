import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  styled,
  keyframes
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Person
} from '@mui/icons-material';
import { USER_ROLES } from '../config/constants';
import Footer from './Footer';

// Elegant animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const gentleFloat = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Styled Components
const PageContainer = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #1a0a00 0%, #0a0a0a 25%, #1a0f0a 50%, #0a0a0a 75%, #1a0a00 100%)',
  backgroundSize: '400% 400%',
  animation: `${gradientShift} 20s ease infinite`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: `
      radial-gradient(circle at 20% 30%, rgba(255, 107, 0, 0.25) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(255, 140, 0, 0.2) 0%, transparent 40%),
      radial-gradient(circle at 50% 50%, rgba(255, 165, 0, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 10% 80%, rgba(139, 69, 19, 0.2) 0%, transparent 35%)
    `,
    animation: `${gradientShift} 15s ease infinite`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(2px 2px at 20% 30%, rgba(255, 140, 0, 0.4), transparent),
      radial-gradient(2px 2px at 60% 70%, rgba(255, 165, 0, 0.3), transparent),
      radial-gradient(2px 2px at 80% 10%, rgba(255, 107, 0, 0.4), transparent),
      radial-gradient(2px 2px at 40% 80%, rgba(255, 140, 0, 0.3), transparent),
      radial-gradient(1px 1px at 90% 40%, rgba(255, 165, 0, 0.5), transparent),
      radial-gradient(1px 1px at 30% 60%, rgba(255, 140, 0, 0.4), transparent),
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(255, 140, 0, 0.04) 2px,
        rgba(255, 140, 0, 0.04) 4px
      )
    `,
    backgroundSize: '200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 100% 100%',
    backgroundPosition: '0% 0%, 40% 60%, 80% 20%, 20% 80%, 60% 40%, 30% 70%, 0% 0%',
    pointerEvents: 'none',
    animation: `${gradientShift} 25s ease infinite`,
  }
});

const LoginCard = styled(Box)({
  position: 'relative',
  width: '100%',
  maxWidth: '420px',
  padding: '3.5rem 2.5rem',
  background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 20, 15, 0.95) 100%)',
  borderRadius: '20px',
  border: '1px solid rgba(255, 140, 0, 0.2)',
  boxShadow: `
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 1px rgba(255, 140, 0, 0.5) inset,
    0 0 80px rgba(255, 107, 0, 0.1)
  `,
  backdropFilter: 'blur(10px)',
  animation: `${fadeIn} 0.6s ease-out`,
  zIndex: 1,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 140, 0, 0.5), transparent)',
  }
});

const LogoContainer = styled(Box)({
  textAlign: 'center',
  marginBottom: '2.5rem',
  animation: `${fadeIn} 0.8s ease-out 0.2s both`,
});

const OmSymbol = styled(Typography)({
  fontSize: '4rem',
  fontWeight: 300,
  background: 'linear-gradient(135deg, #ff6b00 0%, #ffa500 50%, #ff8c00 100%)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  marginBottom: '1rem',
  letterSpacing: '0.05em',
  filter: 'drop-shadow(0 0 20px rgba(255, 107, 0, 0.3))',
  animation: `${gentleFloat} 4s ease-in-out infinite`,
});

const Title = styled(Typography)({
  fontSize: '1.75rem',
  fontWeight: 300,
  color: '#fff',
  letterSpacing: '0.1em',
  marginBottom: '0.5rem',
  fontFamily: '"Cormorant Garamond", serif',
  textTransform: 'uppercase',
});

const Subtitle = styled(Typography)({
  fontSize: '0.875rem',
  color: 'rgba(255, 140, 0, 0.7)',
  letterSpacing: '0.15em',
  fontWeight: 500,
  textTransform: 'uppercase',
  fontFamily: '"Montserrat", sans-serif',
});

const FormContainer = styled('form')({
  animation: `${fadeIn} 0.8s ease-out 0.4s both`,
});

const StyledTextField = styled(TextField)({
  marginBottom: '1.5rem',
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    color: '#fff',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '& fieldset': {
      borderColor: 'rgba(255, 140, 0, 0.2)',
      transition: 'all 0.3s ease',
    },
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      '& fieldset': {
        borderColor: 'rgba(255, 140, 0, 0.4)',
      },
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      '& fieldset': {
        borderColor: 'rgba(255, 140, 0, 0.8)',
        borderWidth: '2px',
      },
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 140, 0, 0.6)',
    fontFamily: '"Montserrat", sans-serif',
    fontSize: '0.875rem',
    letterSpacing: '0.05em',
    '&.Mui-focused': {
      color: 'rgba(255, 140, 0, 0.9)',
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: '"Montserrat", sans-serif',
    fontSize: '0.95rem',
    padding: '14px',
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: 'rgba(255, 140, 0, 0.5)',
  }
});

const LoginButton = styled(Button)({
  marginTop: '1.5rem',
  padding: '1rem 2rem',
  borderRadius: '10px',
  fontSize: '0.95rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontFamily: '"Montserrat", sans-serif',
  background: 'linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%)',
  backgroundSize: '200% auto',
  color: '#000',
  border: 'none',
  boxShadow: '0 4px 20px rgba(255, 107, 0, 0.3)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    background: 'linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)',
    backgroundSize: '200% auto',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 30px rgba(255, 107, 0, 0.5)',
    '&::before': {
      left: '100%',
    },
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&.Mui-disabled': {
    background: 'rgba(255, 140, 0, 0.3)',
    color: 'rgba(255, 255, 255, 0.3)',
  }
});

const Divider = styled(Box)({
  width: '60px',
  height: '1px',
  background: 'linear-gradient(90deg, transparent, rgba(255, 140, 0, 0.5), transparent)',
  margin: '2rem auto',
});

const FooterText = styled(Typography)({
  fontSize: '0.75rem',
  color: 'rgba(255, 140, 0, 0.5)',
  textAlign: 'center',
  letterSpacing: '0.1em',
  fontFamily: '"Cormorant Garamond", serif',
  fontWeight: 500,
  marginTop: '2rem',
});


const DecorativeElement = styled(Box)({
  position: 'absolute',
  width: '400px',
  height: '400px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255, 107, 0, 0.2) 0%, rgba(255, 140, 0, 0.1) 30%, transparent 70%)',
  filter: 'blur(60px)',
  pointerEvents: 'none',
  animation: `${gentleFloat} 6s ease-in-out infinite`,
});

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // User credentials with roles
  const USERS = [
    { username: 'vishal', password: 'vishal@1990', role: USER_ROLES.ADMIN, name: 'Admin' },
    { username: 'bhadaji', password: 'bhadaji@123', role: USER_ROLES.BHADAJI, name: 'Bhadaji' },
    { username: 'vikas', password: 'vikas@123', role: USER_ROLES.PUROHIT, name: 'Vikas Joshi', purohitId: 'purohit1' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate login delay
    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);

      if (user) {
        // Store login state with role in localStorage
        const authData = {
          isLoggedIn: true,
          username: user.username,
          role: user.role,
          name: user.name,
          loginTime: new Date().toISOString()
        };

        // Add purohitId for purohit users
        if (user.purohitId) {
          authData.purohitId = user.purohitId;
        }

        localStorage.setItem('homaBookingAuth', JSON.stringify(authData));
        onLogin(true, user.role, user.purohitId);
      } else {
        setError('Invalid username or password');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <>
      <PageContainer>
        {/* Decorative glowing elements */}
        <DecorativeElement sx={{ top: '-150px', right: '-100px' }} />
        <DecorativeElement sx={{ bottom: '-150px', left: '-100px', animationDelay: '3s' }} />
        <DecorativeElement sx={{ top: '50%', left: '-200px', width: '350px', height: '350px', animationDelay: '1.5s', animationDuration: '8s' }} />
        <DecorativeElement sx={{ top: '-100px', left: '40%', width: '300px', height: '300px', animationDelay: '4s', animationDuration: '7s' }} />
        <DecorativeElement sx={{ bottom: '100px', right: '-150px', width: '380px', height: '380px', animationDelay: '2s', animationDuration: '9s' }} />

        <LoginCard>
          <LogoContainer>
            <OmSymbol>ॐ</OmSymbol>
            <Title>Homa Booking</Title>
            <Subtitle>Astro Vastu Shri V M Joshi</Subtitle>
          </LogoContainer>

          <Divider />

          <FormContainer onSubmit={handleSubmit}>
            <StyledTextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                )
              }}
            />

            <StyledTextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{
                        color: 'rgba(255, 140, 0, 0.5)',
                        '&:hover': {
                          color: 'rgba(255, 140, 0, 0.8)',
                        }
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {error && (
              <Alert
                severity="error"
                sx={{
                  backgroundColor: 'rgba(211, 47, 47, 0.15)',
                  color: '#ff6b6b',
                  border: '1px solid rgba(211, 47, 47, 0.3)',
                  borderRadius: '10px',
                  fontFamily: '"Montserrat", sans-serif',
                  fontSize: '0.875rem',
                  animation: `${fadeIn} 0.3s ease-out`,
                  '& .MuiAlert-icon': {
                    color: '#ff6b6b',
                  }
                }}
              >
                {error}
              </Alert>
            )}

            <LoginButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </LoginButton>
          </FormContainer>

          <FooterText>
            Sacred Portal • Divine Access
          </FooterText>
        </LoginCard>

        {/* Designer Footer */}
        <Footer variant="dark" />
      </PageContainer>

      {/* Load Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
    </>
  );
};

export default Login;
