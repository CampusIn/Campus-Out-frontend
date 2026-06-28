import api from './axios';

export const getAdminDashboard = () => api.get('/admin/dashboard');

export const getAdminUsers = (params) => api.get('/admin/dashboard/users', { params });

export const getAdminVendors = (params) => api.get('/admin/dashboard/vendors', { params });

export const getAdminRestaurants = (params) => api.get('/admin/dashboard/restaurants', { params });

export const blockUser = (id) => api.patch(`/admin/users/${id}/block`);

export const unblockUser = (id) => api.patch(`/admin/users/${id}/unblock`);

export const suspendRestaurant = (id) => api.patch(`/admin/restaurants/${id}/suspend`);

export const activateRestaurant = (id) => api.patch(`/admin/restaurants/${id}/activate`);

export const getAdminOrders = (params) => api.get('/admin/orders', { params });

export const getAdminOrderById = (id) => api.get(`/admin/orders/${id}`);

// Platform Settings
export const getAdminSettings = () => api.get('/admin/settings');
export const updateAdminSettings = (data) => api.patch('/admin/settings', data);

// Coupons
export const createCoupon = (data) => api.post('/admin/coupons', data);
export const getCoupons = (params) => api.get('/admin/coupons', { params });
export const getCouponById = (couponId) => api.get(`/admin/coupons/${couponId}`);
export const updateCoupon = (couponId, data) => api.patch(`/admin/coupons/${couponId}`, data);
export const updateCouponStatus = (couponId) => api.patch(`/admin/coupons/${couponId}/status`);

// Announcements
export const createAnnouncement = (data) => api.post('/admin/announcements', data);
export const getAnnouncements = (params) => api.get('/admin/announcements', { params });
export const getAnnouncementById = (announcementId) => api.get(`/admin/announcements/${announcementId}`);
export const updateAnnouncement = (announcementId, data) => api.patch(`/admin/announcements/${announcementId}`, data);
export const updateAnnouncementStatus = (announcementId) => api.patch(`/admin/announcements/${announcementId}/status`);

// Banners
export const createBanner = (data) => api.post('/admin/banners', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getBanners = (params) => api.get('/admin/banners', { params });
export const getBannerById = (bannerId) => api.get(`/admin/banners/${bannerId}`);
export const updateBanner = (bannerId, data) => api.patch(`/admin/banners/${bannerId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateBannerStatus = (bannerId) => api.patch(`/admin/banners/${bannerId}/status`);

export const getTopRestaurants = () => api.get('/admin/dashboard/top-restaurant');
