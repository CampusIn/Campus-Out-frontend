import api from './axios';

export const registerUser = (data) => api.post('/auth/register', data);

export const loginUser = (data) => api.post('/auth/login', data);

export const verifyEmailOtp = (data) => api.post('/auth/verify-email', data);

export const logoutUser = () => api.post('/auth/logout');

export const logoutAllDevices = () => api.post('/auth/logout-all');

export const refreshToken = () =>
  api.post('/auth/refresh-token', {}, { withCredentials: true });

export const getMe = () => api.get('/auth/me');

export const updateMe = (data) => api.patch('/auth/me', data);
