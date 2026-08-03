import api from './axios';

// User Marketplace APIs
export const getUserCategories = (params) => api.get('/marketplace/categories', { params });
export const getUserProducts = (params) => api.get('/marketplace/products', { params });
export const getUserProductById = (productId) => api.get(`/marketplace/products/${productId}`);
export const getMarketplaceSuggestions = (q) => api.get('/marketplace/products/suggestions', { params: { q } });

// User Marketplace Cart APIs
export const getMarketCart = () => api.get('/marketplace/cart');
export const addToMarketCart = (productId, quantity) => api.post('/marketplace/cart', { productId, quantity });
export const updateMarketCartItemQty = (productId, quantity) => api.patch(`/marketplace/cart/items/${productId}`, { quantity });
export const deleteMarketCartItem = (productId) => api.delete(`/marketplace/cart/items/${productId}`);
export const clearMarketCart = () => api.delete('/marketplace/cart');

export const getCategoryPlatformSettings = (categoryId) => api.get('/marketplace/settings', { params: { categoryId } });

// User Marketplace Order APIs
export const createMarketplaceOrder = (data) => api.post('/marketplace/orders', data);
export const getMyMarketplaceOrders = (params) => api.get('/marketplace/orders/my', { params });
export const getMarketplaceOrderById = (orderId) => api.get(`/marketplace/orders/${orderId}`);
export const cancelMarketplaceOrder = (orderId) => api.patch(`/marketplace/orders/${orderId}/cancel`);

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
export const updateAdminProductStatus = (productId) => api.patch(`/admin/marketplace/products/${productId}/status`);

// Admin Marketplace Orders
export const getAdminMarketplaceOrders = (params) => api.get('/admin/marketplace/orders', { params });
export const getAdminMarketplaceOrderById = (orderId) => api.get(`/admin/marketplace/orders/${orderId}`);
export const updateAdminMarketplaceOrderStatus = (orderId, data) => api.patch(`/admin/marketplace/orders/${orderId}/status`, data);
export const assignAdminMarketplaceDeliveryPartner = (orderId, data) => api.patch(`/admin/marketplace/orders/${orderId}/assign-delivery`, data);
export const downloadAdminMarketplaceOrderInvoice = (orderId) => api.get(`/admin/marketplace/orders/${orderId}/invoice`, { responseType: 'blob' });

