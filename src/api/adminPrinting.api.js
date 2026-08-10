import api from './axios';

// Get admin printing config
export const getAdminPrintingConfig = () => api.get('/admin/printing/config');

// Update admin printing config
export const updateAdminPrintingConfig = (data) => api.patch('/admin/printing/config', data);

// Get admin printing orders
export const getAdminPrintOrders = (params) => api.get('/admin/printing/orders', { params });

// Get single admin print order
export const getAdminPrintOrderById = (orderId) => api.get(`/admin/printing/orders/${orderId}`);

// Update order status
export const updatePrintOrderStatus = (orderId, data) => api.patch(`/admin/printing/orders/${orderId}/status`, data);

// Update order notes
export const updatePrintOrderNotes = (orderId, data) => api.patch(`/admin/printing/orders/${orderId}/notes`, data);

// Update payment status
export const updatePrintOrderPaymentStatus = (orderId, data) => api.patch(`/admin/printing/orders/${orderId}/payment-status`, data);

// Download admin file directly
export const downloadAdminPrintFile = (orderId, fileId) => api.get(`/admin/printing/orders/${orderId}/files/${fileId}/download`, {
  responseType: 'blob',
});
