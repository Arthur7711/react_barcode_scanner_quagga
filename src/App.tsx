import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState } from 'react';
import Login from './pages/Login';
import Scanner from './pages/Scanner';
import { LanguageProvider } from './contexts/LanguageContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import LanguageSelector from './components/LanguageSelector';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6200EE',
      light: '#B794F4',
      dark: '#4A148C',
      contrastText: '#fff',
    },
    secondary: {
      main: '#03DAC6',
      light: '#64ffda',
      dark: '#018786',
      contrastText: '#000',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    error: {
      main: '#B00020',
    },
    success: {
      main: '#00C853',
    },
    action: {
      hover: 'rgba(98, 0, 238, 0.04)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
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
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(98, 0, 238, 0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

interface UserInfo {
  email: string;
  token: string;
}

function App() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    return token && email ? { token, email } : null;
  });

  const handleLogin = (token: string, email: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
    setUserInfo({ token, email });
  };

  const handleLogout = () => {
    setUserInfo(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LanguageProvider>
        <PermissionsProvider>
          <LanguageSelector />
          <Router>
            <Routes>
              <Route 
                path="/" 
                element={
                  !userInfo ? (
                    <Login onLogin={handleLogin} />
                  ) : (
                    <Navigate to="/scanner" replace />
                  )
                } 
              />
              <Route 
                path="/scanner" 
                element={
                  userInfo ? (
                    <Scanner 
                      token={userInfo.token} 
                      userEmail={userInfo.email}
                      onLogout={handleLogout}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
            </Routes>
          </Router>
        </PermissionsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App; 