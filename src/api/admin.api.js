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

