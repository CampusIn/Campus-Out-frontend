import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Map raw JWT/expired/unauthorized error messages to user-friendly format
    if (error.response?.data) {
      const msg = error.response.data.message;
      if (msg && (
        msg.toLowerCase().includes('jwt') || 
        msg.toLowerCase().includes('expired') || 
        msg.toLowerCase().includes('unauthorized') || 
        msg.toLowerCase().includes('token')
      )) {
        error.response.data.message = "Your session has expired. Please log in again to continue.";
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Determine the role-prefixed refresh endpoint
        let rolePrefix = 'user';
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const userObj = JSON.parse(userStr);
            if (userObj.role === 'vendor') rolePrefix = 'vendor';
            else if (userObj.role === 'admin') rolePrefix = 'admin';
            else if (userObj.role === 'delivery_partner') rolePrefix = 'delivery-partner';
          }
        } catch (e) { /* default to user */ }

        const { data } = await axios.post(
          `${BASE_URL}/auth/${rolePrefix}/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        
        let redirectUrl = '/login';
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const userObj = JSON.parse(userStr);
            if (userObj.role === 'delivery_partner') redirectUrl = '/delivery/login';
            else if (userObj.role === 'vendor') redirectUrl = '/vendor/login';
            else if (userObj.role === 'admin') redirectUrl = '/admin/login';
          }
        } catch (e) {
          console.error('Failed to determine redirect URL:', e);
        }
        
        localStorage.removeItem('user');
        localStorage.setItem('authRedirectMessage', 'Your session has expired. Please log in again to continue.');
        window.location.href = redirectUrl;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
