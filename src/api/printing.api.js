import api from './axios';

// Get printing config
export const getPrintingConfig = () => api.get('/printing/config');

// Upload files
export const uploadPrintFiles = (formData, onUploadProgress) => 
  api.post('/printing/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });

// Delete an uploaded file
export const deletePrintUpload = (uploadId) => api.delete(`/printing/uploads/${uploadId}`);

// Create an order
export const createPrintOrder = (data, idempotencyKey) => 
  api.post('/printing/orders', data, {
    headers: { 'Idempotency-Key': idempotencyKey }
  });

// Get user's orders
export const getMyPrintOrders = (params) => api.get('/printing/orders/my', { params });

// Get a single order
export const getPrintOrderById = (orderId) => api.get(`/printing/orders/${orderId}`);

// Cancel an order
export const cancelPrintOrder = (orderId) => api.patch(`/printing/orders/${orderId}/cancel`);

// Download file directly
export const downloadPrintFile = (orderId, fileId) => api.get(`/printing/orders/${orderId}/files/${fileId}/download`, {
  responseType: 'blob',
});
