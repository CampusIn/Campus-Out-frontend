import api from './axios';

// ─── User Auth ───────────────────────────────────────────────
export const registerUser = (data) => api.post('/auth/user/register', data);
export const loginUser = (data) => api.post('/auth/user/login', data);
export const resendOtp = (data) => api.post('/auth/user/resend-otp', data);
export const verifyEmailOtp = (data) => api.post('/auth/user/verify-email', data);
export const logoutUser = () => api.post('/auth/user/logout');
export const logoutAllDevices = () => api.post('/auth/user/logout-all');
export const refreshToken = () =>
  api.post('/auth/user/refresh-token', {}, { withCredentials: true });
export const forgotPassword = (data) => api.post('/auth/user/forgot-password', data);
export const verifyResetOtp = (data) => api.post('/auth/user/verify-reset-otp', data);
export const resetPassword = (data) => api.post('/auth/user/reset-password', data);

// ─── Vendor Auth ─────────────────────────────────────────────
export const registerVendor = (data) => api.post('/auth/vendor/register', data);
export const loginVendor = (data) => api.post('/auth/vendor/login', data);
export const resendOtpVendor = (data) => api.post('/auth/vendor/resend-otp', data);
export const verifyEmailVendor = (data) => api.post('/auth/vendor/verify-email', data);
export const logoutVendor = () => api.post('/auth/vendor/logout');
export const logoutAllVendor = () => api.post('/auth/vendor/logout-all');
export const refreshTokenVendor = () =>
  api.post('/auth/vendor/refresh-token', {}, { withCredentials: true });
export const forgotPasswordVendor = (data) => api.post('/auth/vendor/forgot-password', data);
export const verifyResetOtpVendor = (data) => api.post('/auth/vendor/verify-reset-otp', data);
export const resetPasswordVendor = (data) => api.post('/auth/vendor/reset-password', data);

// ─── Admin Auth ──────────────────────────────────────────────
export const loginAdmin = (data) => api.post('/auth/admin/login', data);
export const resendOtpAdmin = (data) => api.post('/auth/admin/resend-otp', data);
export const verifyEmailAdmin = (data) => api.post('/auth/admin/verify-email', data);
export const logoutAdmin = () => api.post('/auth/admin/logout');
export const logoutAllAdmin = () => api.post('/auth/admin/logout-all');
export const refreshTokenAdmin = () =>
  api.post('/auth/admin/refresh-token', {}, { withCredentials: true });
export const forgotPasswordAdmin = (data) => api.post('/auth/admin/forgot-password', data);
export const verifyResetOtpAdmin = (data) => api.post('/auth/admin/verify-reset-otp', data);
export const resetPasswordAdmin = (data) => api.post('/auth/admin/reset-password', data);

// ─── Delivery Partner Auth ──────────────────────────────────
export const registerDeliveryPartner = (data) => api.post('/auth/delivery-partner/register', data);
export const loginDeliveryPartner = (data) => api.post('/auth/delivery-partner/login', data);
export const resendOtpDeliveryPartner = (data) => api.post('/auth/delivery-partner/resend-otp', data);
export const verifyEmailDeliveryPartner = (data) => api.post('/auth/delivery-partner/verify-email', data);
export const logoutDeliveryPartner = () => api.post('/auth/delivery-partner/logout');
export const logoutAllDeliveryPartner = () => api.post('/auth/delivery-partner/logout-all');
export const refreshTokenDeliveryPartner = () =>
  api.post('/auth/delivery-partner/refresh-token', {}, { withCredentials: true });
export const forgotPasswordDeliveryPartner = (data) => api.post('/auth/delivery-partner/forgot-password', data);
export const verifyResetOtpDeliveryPartner = (data) => api.post('/auth/delivery-partner/verify-reset-otp', data);
export const resetPasswordDeliveryPartner = (data) => api.post('/auth/delivery-partner/reset-password', data);

// ─── Shared (role-agnostic) ──────────────────────────────────
export const getMe = () => api.get('/auth/me');
export const updateMe = (data) => api.patch('/auth/me', data);
