import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Container
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Person
} from '@mui/icons-material';
import { USER_ROLES } from '../config/constants';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // User credentials with roles
  const USERS = [
    { username: 'vishal', password: 'vishal@1990', role: USER_ROLES.ADMIN, name: 'Admin' },
    { username: 'bhadaji', password: 'bhadaji@123', role: USER_ROLES.BHADAJI, name: 'Bhadaji' }
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
        localStorage.setItem('homaBookingAuth', JSON.stringify({
          isLoggedIn: true,
          username: user.username,
          role: user.role,
          name: user.name,
          loginTime: new Date().toISOString()
        }));
        onLogin(true, user.role);
      } else {
        setError('Invalid username or password');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #880E4F 0%, #4A0028 100%)',
        p: 2
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: 'center'
          }}
        >
          {/* Logo/Title */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                mb: 1
              }}
            >
              🙏 Homa Booking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Login to continue
            </Typography>
          </Box>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <Typography variant="caption" color="text.secondary">
            Astro Vastu Shri V M Joshi
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
