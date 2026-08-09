import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loginUser,
  registerUser,
  verifyEmailOtp,
  logoutUser,
  logoutAllDevices,
  refreshToken as refreshTokenUser,
  getMe,
  resendOtp as resendOtpApi,
  loginVendor,
  registerVendor,
  verifyEmailVendor,
  logoutVendor,
  logoutAllVendor,
  refreshTokenVendor,
  resendOtpVendor,
  loginAdmin,
  verifyEmailAdmin,
  logoutAdmin,
  logoutAllAdmin,
  refreshTokenAdmin,
  resendOtpAdmin,
  loginDeliveryPartner,
  registerDeliveryPartner,
  verifyEmailDeliveryPartner,
  logoutDeliveryPartner,
  logoutAllDeliveryPartner,
  refreshTokenDeliveryPartner,
  resendOtpDeliveryPartner,
} from '../api/auth.api';

// Helper: choose the correct API function based on role
const getLoginFn = (role) => {
  if (role === 'vendor') return loginVendor;
  if (role === 'admin') return loginAdmin;
  if (role === 'delivery_partner') return loginDeliveryPartner;
  return loginUser;
};
const getRegisterFn = (role) => {
  if (role === 'vendor') return registerVendor;
  if (role === 'delivery_partner') return registerDeliveryPartner;
  return registerUser; 
};
const getVerifyEmailFn = (role) => {
  if (role === 'vendor') return verifyEmailVendor;
  if (role === 'admin') return verifyEmailAdmin;
  if (role === 'delivery_partner') return verifyEmailDeliveryPartner;
  return verifyEmailOtp;
};
const getResendOtpFn = (role) => {
  if (role === 'vendor') return resendOtpVendor;
  if (role === 'admin') return resendOtpAdmin;
  if (role === 'delivery_partner') return resendOtpDeliveryPartner;
  return resendOtpApi;
};
const getLogoutFn = (role) => {
  if (role === 'vendor') return logoutVendor;
  if (role === 'admin') return logoutAdmin;
  if (role === 'delivery_partner') return logoutDeliveryPartner;
  return logoutUser;
};
const getLogoutAllFn = (role) => {
  if (role === 'vendor') return logoutAllVendor;
  if (role === 'admin') return logoutAllAdmin;
  if (role === 'delivery_partner') return logoutAllDeliveryPartner;
  return logoutAllDevices;
};
const getRefreshFn = (role) => {
  if (role === 'vendor') return refreshTokenVendor;
  if (role === 'admin') return refreshTokenAdmin;
  if (role === 'delivery_partner') return refreshTokenDeliveryPartner;
  return refreshTokenUser;
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('accessToken');
    const saved = localStorage.getItem('user');

    if (!token || !saved || saved === 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActive');
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const remaining = expiry - Date.now();

      if (remaining <= 0) {
        const savedLastActive = localStorage.getItem('lastActive');
        const lastActiveTime = savedLastActive ? parseInt(savedLastActive, 10) : Date.now();
        const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes inactivity limit
        const isActive = (Date.now() - lastActiveTime) < INACTIVITY_THRESHOLD;

        if (!isActive) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          localStorage.removeItem('lastActive');
          return null;
        }
      }
      return JSON.parse(saved);
    } catch (e) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActive');
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
      
      let redirectUrl = '/login';
      if (userRole === 'delivery_partner') redirectUrl = '/delivery/login';
      else if (userRole === 'vendor') redirectUrl = '/vendor/login';
      else if (userRole === 'admin') redirectUrl = '/admin/login';

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
              const refreshFn = getRefreshFn(user?.role);
              const { data } = await refreshFn();
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
                const refreshFn = getRefreshFn(user?.role);
                const { data } = await refreshFn();
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

  const login = async (email, password, role = 'user') => {
    setLoading(true);
    try {
      const loginFn = getLoginFn(role);
      const { data } = await loginFn({ email, password });
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('lastActive', Date.now().toString());
      sessionStorage.removeItem('dismissedAnnouncements');
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

  const register = async (username, email, password, role = 'user') => {
    setLoading(true);
    try {
      const registerFn = getRegisterFn(role);
      const { data } = await registerFn({ username, email, password });
      return { success: true, message: data.message, email };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email, otp, role = 'user') => {
    setLoading(true);
    try {
      const verifyFn = getVerifyEmailFn(role);
      const { data } = await verifyFn({ email, otp });
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('lastActive', Date.now().toString());
      sessionStorage.removeItem('dismissedAnnouncements');
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

  const resendOtp = async (email, role = 'user') => {
    setLoading(true);
    try {
      const resendFn = getResendOtpFn(role);
      const { data } = await resendFn({ email });
      return { success: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (role, shouldNavigate = true) => {
    try {
      const logoutFn = getLogoutFn(role || user?.role);
      await logoutFn();
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('dismissedAnnouncements');
    setUser(null);
    if (shouldNavigate) navigate('/');
  };

  const logoutAll = async (role, shouldNavigate = true) => {
    try {
      const logoutAllFn = getLogoutAllFn(role || user?.role);
      await logoutAllFn();
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('dismissedAnnouncements');
    setUser(null);
    if (shouldNavigate) navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, resendOtp, logout, logoutAll, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
