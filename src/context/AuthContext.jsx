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
      localStorage.setItem('lastActive', Date.now().toString());
      
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

  // Activity Tracking: Listen for user interactions and throttle writing to localStorage
  useEffect(() => {
    let lastSaved = Date.now();
    
    // Set initial lastActive on mount if user is logged in
    const token = localStorage.getItem('accessToken');
    if (token && !localStorage.getItem('lastActive')) {
      localStorage.setItem('lastActive', Date.now().toString());
    }

    const updateActivity = () => {
      const now = Date.now();
      if (now - lastSaved > 10000) { // Update at most once every 10 seconds
        localStorage.setItem('lastActive', now.toString());
        lastSaved = now;
      }
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [user]);

  // Automatic token refresh / logout checking
  useEffect(() => {
    let timer;

    const handleAutoLogout = () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      const userRole = user?.role;
      setUser(null);
      localStorage.setItem('authRedirectMessage', 'Your session has expired. Please log in again.');
      
      const redirectUrl = userRole === 'delivery_partner' ? '/delivery/login' : '/login';
      const protectedPaths = ['/admin', '/vendor', '/delivery/dashboard', '/cart', '/orders', '/profile'];
      const isCurrentPathProtected = protectedPaths.some(path => window.location.pathname.startsWith(path));
      
      if (isCurrentPathProtected) {
        window.location.href = redirectUrl;
      }
    };

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

        const savedLastActive = localStorage.getItem('lastActive');
        const lastActiveTime = savedLastActive ? parseInt(savedLastActive, 10) : Date.now();
        const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes inactivity limit
        const isActive = (Date.now() - lastActiveTime) < INACTIVITY_THRESHOLD;

        if (remaining <= 0) {
          if (isActive) {
            // User is actively using the portal -> generate a new access token
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
              const newPayload = JSON.parse(atob(newToken.split('.')[1]));
              const newExpiry = newPayload.exp * 1000;
              const newRemaining = newExpiry - Date.now();
              timer = setTimeout(checkToken, Math.max(0, newRemaining - 60000));
            } catch (refreshErr) {
              handleAutoLogout();
            }
          } else {
            // User is not using the portal -> log out automatically
            handleAutoLogout();
          }
        } else {
          const refreshBuffer = 60000; // 1 minute buffer to refresh early if active
          if (remaining <= refreshBuffer) {
            if (isActive) {
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
                const newPayload = JSON.parse(atob(newToken.split('.')[1]));
                const newExpiry = newPayload.exp * 1000;
                const newRemaining = newExpiry - Date.now();
                timer = setTimeout(checkToken, Math.max(0, newRemaining - refreshBuffer));
              } catch (refreshErr) {
                handleAutoLogout();
              }
            } else {
              // Idle, check again right at expiration
              timer = setTimeout(checkToken, remaining);
            }
          } else {
            // Schedule the check 1 minute before expiration
            timer = setTimeout(checkToken, remaining - refreshBuffer);
          }
        }
      } catch (e) {
        handleAutoLogout();
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
      localStorage.setItem('lastActive', Date.now().toString());
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
      localStorage.setItem('lastActive', Date.now().toString());
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
