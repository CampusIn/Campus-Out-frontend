import { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  verifyEmailOtp,
  logoutUser,
  logoutAllDevices,
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
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await loginUser({ email, password });
      localStorage.setItem('accessToken', data.data.accessToken);
      const decoded = JSON.parse(atob(data.data.accessToken.split('.')[1]));
      setUser({ id: decoded.id, role: decoded.role, email });
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
      setUser({ id: decoded.id, role: decoded.role, email, username: data.data.user.username });
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
