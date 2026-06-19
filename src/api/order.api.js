import api from './axios';

export const createOrder = (paymentMethod) =>
  api.post('/user/order', { paymentMethod });

export const getMyOrders = (params) =>
  api.get('/user/orders/my', { params });

export const getOrderById = (orderId) =>
  api.get(`/user/orders/${orderId}`);

export const cancelOrder = (orderId) =>
  api.patch(`/user/orders/${orderId}/cancel`);

export const getVendorOrders = (params) =>
  api.get('/user/order/restaurant', { params });

export const changeOrderStatus = (orderId, orderStatus) =>
  api.patch(`/user/order/${orderId}/status`, { orderStatus });
