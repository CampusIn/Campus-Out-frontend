import { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  verifyEmailOtp,
  logoutUser,
  logoutAllDevices,
  refreshToken,
} from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (!saved || saved === 'undefined') return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('accessToken', token);
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const userObj = { 
          id: decoded.id, 
          role: decoded.role, 
          email: decoded.email || '', 
          username: decoded.username || '' 
        };
        localStorage.setItem('user', JSON.stringify(userObj));
        setUser(userObj);
        
        // Clean URL parameter
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]token=[^&]+/, '').replace(/^&/, '?').replace(/\?$/, '');
        window.history.replaceState({}, document.title, newUrl);
      } catch (e) {
        console.error('Failed to parse OAuth token from URL:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    let timer;

    const checkToken = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        if (user) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setUser(null);
        }
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000;
        const remaining = expiry - Date.now();

        if (remaining <= 0) {
          // Token expired, attempt refresh
          try {
            const { data } = await refreshToken();
            const newToken = data.data.accessToken;
            localStorage.setItem('accessToken', newToken);
            const decoded = JSON.parse(atob(newToken.split('.')[1]));
            setUser({ 
              id: decoded.id, 
              role: decoded.role, 
              email: decoded.email || '', 
              username: decoded.username || '' 
            });
          } catch (refreshErr) {
            // Refresh failed, clear session and redirect
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
            localStorage.setItem('authRedirectMessage', 'Your session has expired. Please log in again to continue.');
            const redirectUrl = user?.role === 'delivery_partner' ? '/delivery/login' : '/login';
            window.location.href = redirectUrl;
          }
        } else {
          // Set timer to check again when it expires
          timer = setTimeout(checkToken, remaining);
        }
      } catch (e) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
      }
    };

    checkToken();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await loginUser({ email, password });
      localStorage.setItem('accessToken', data.data.accessToken);
      const decoded = JSON.parse(atob(data.data.accessToken.split('.')[1]));
      setUser({ 
        id: decoded.id, 
        role: decoded.role, 
        email: decoded.email || '', 
        username: decoded.username || '' 
      });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, role) => {
    setLoading(true);
    try {
      const { data } = await registerUser({ username, email, password, role });
      return { success: true, message: data.message, email };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email, otp) => {
    setLoading(true);
    try {
      const { data } = await verifyEmailOtp({ email, otp });
      localStorage.setItem('accessToken', data.data.accessToken);
      const decoded = JSON.parse(atob(data.data.accessToken.split('.')[1]));
      setUser({ 
        id: decoded.id, 
        role: decoded.role, 
        email: decoded.email || '', 
        username: decoded.username || '' 
      });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const logoutAll = async () => {
    try {
      await logoutAllDevices();
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, logout, logoutAll, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
