import api from './axios';

// User Marketplace APIs
export const getUserCategories = (params) => api.get('/marketplace/categories', { params });
export const getUserProducts = (params) => api.get('/marketplace/products', { params });
export const getUserProductById = (productId) => api.get(`/marketplace/products/${productId}`);

// Admin Marketplace APIs
export const getAdminCategories = (params) => api.get('/admin/marketplace/categories', { params });
export const getAdminCategoryById = (categoryId) => api.get(`/admin/marketplace/categories/${categoryId}`);
export const createAdminCategory = (data) => api.post('/admin/marketplace/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateAdminCategory = (categoryId, data) => api.patch(`/admin/marketplace/categories/${categoryId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateAdminCategoryStatus = (categoryId) => api.patch(`/admin/marketplace/categories/${categoryId}/status`);

export const getAdminProducts = (params) => api.get('/admin/marketplace/products', { params });
export const getAdminProductById = (productId) => api.get(`/admin/marketplace/products/${productId}`);
export const createAdminProduct = (data) => api.post('/admin/marketplace/products', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateAdminProduct = (productId, data) => api.patch(`/admin/marketplace/products/${productId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateAdminProductStatus = (productId) => api.post(`/admin/marketplace/products/${productId}/status`);
