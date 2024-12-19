import { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  onLogin: (token: string, email: string) => void;
}

// Test credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useLanguage();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const isEmailValid = !touched.email || validateEmail(email);
  const isPasswordValid = !touched.password || password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Mark all fields as touched
    setTouched({ email: true, password: true });

    // Validate all fields
    if (!validateEmail(email)) {
      setError(t('login.emailError'));
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('login.passwordError'));
      setIsLoading(false);
      return;
    }

    try {
      // For testing purposes, accept test credentials
      if (email === TEST_EMAIL && password === TEST_PASSWORD) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        onLogin('test-token-12345', email);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      onLogin(data.token, email);
    } catch (err) {
      setError(t('login.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setEmail(TEST_EMAIL);
    setPassword(TEST_PASSWORD);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    onLogin('test-token-12345', TEST_EMAIL);
  };

  return (
    <Container 
      component="main" 
      maxWidth="xs" 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
            bgcolor: 'background.paper',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.5s ease-out',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(20px)' },
              to: { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Typography 
              component="h1" 
              variant={isMobile ? "h5" : "h4"}
              sx={{ 
                fontWeight: 600,
                textAlign: 'center',
                color: 'primary.main'
              }}
            >
              {t('login.title')}
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                animation: 'shake 0.5s ease-in-out',
                '@keyframes shake': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
                  '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
                }
              }}
            >
              {error}
            </Alert>
          )}

          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ mt: 1 }}
            noValidate
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={t('login.emailLabel')}
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
              error={!isEmailValid}
              helperText={!isEmailValid && t('login.emailError')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                  }
                }
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('login.passwordLabel')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
              error={!isPasswordValid}
              helperText={!isPasswordValid && t('login.passwordError')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                  }
                }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !isEmailValid || !isPasswordValid}
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transform: 'translateX(-100%)',
                  transition: 'transform 0.3s',
                },
                '&:hover::after': {
                  transform: 'translateX(100%)',
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                t('login.signInButton')
              )}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleTestLogin}
              disabled={isLoading}
              sx={{ mb: 3 }}
            >
              Login with Test Credentials
            </Button>

            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center" 
              sx={{ 
                mt: 2,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
                border: '1px dashed',
                borderColor: 'divider'
              }}
            >
              <strong>{t('login.testCredentials')}:</strong><br />
              Email: {TEST_EMAIL}<br />
              Password: {TEST_PASSWORD}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 