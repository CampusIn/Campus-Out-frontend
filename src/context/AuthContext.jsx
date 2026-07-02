import { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  verifyEmailOtp,
  logoutUser,
  logoutAllDevices,
  refreshToken,
  getMe,
  resendOtp as resendOtpApi,
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
      
      const fetchProfile = async () => {
        try {
          const { data: meRes } = await getMe();
          const userObj = { 
            id: meRes.data.id, 
            role: meRes.data.role, 
            email: meRes.data.email, 
            username: meRes.data.username 
          };

          // Block delivery partners
          if (userObj.role === 'delivery_partner') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
            localStorage.setItem('authError', 'Access Denied. Please use the Delivery Partner Portal to login.');
            
            // Clean URL parameters first
            const newUrl = window.location.pathname + window.location.search.replace(/[?&]token=[^&]+/, '').replace(/^&/, '?').replace(/\?$/, '');
            window.history.replaceState({}, document.title, newUrl);
            
            window.location.href = '/login';
            return;
          }

          localStorage.setItem('user', JSON.stringify(userObj));
          setUser(userObj);
          
          // Clean URL parameter
          const newUrl = window.location.pathname + window.location.search.replace(/[?&]token=[^&]+/, '').replace(/^&/, '?').replace(/\?$/, '');
          window.history.replaceState({}, document.title, newUrl);

          // Redirect based on role
          if (userObj.role === 'admin') {
            window.location.href = '/admin';
          } else if (userObj.role === 'vendor') {
            window.location.href = '/vendor';
          } else {
            window.location.href = '/restaurants';
          }
        } catch (e) {
          console.error('Failed to fetch profile during startup:', e);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      };
      
      fetchProfile();
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
            const { data: meRes } = await getMe();
            setUser({ 
              id: meRes.data.id, 
              role: meRes.data.role, 
              email: meRes.data.email, 
              username: meRes.data.username 
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
      const { data: meRes } = await getMe();
      setUser({ 
        id: meRes.data.id, 
        role: meRes.data.role, 
        email: meRes.data.email, 
        username: meRes.data.username 
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
      const { data: meRes } = await getMe();
      setUser({ 
        id: meRes.data.id, 
        role: meRes.data.role, 
        email: meRes.data.email, 
        username: meRes.data.username 
      });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (email) => {
    setLoading(true);
    try {
      const { data } = await resendOtpApi({ email });
      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP';
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
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, resendOtp, logout, logoutAll, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
