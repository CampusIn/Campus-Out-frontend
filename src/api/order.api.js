import api from './axios';

export const createOrder = (paymentMethod, couponId, customerPhone, deliveryAddress) =>
  api.post('/user/order', { paymentMethod, couponId, customerPhone, deliveryAddress });

export const getMyOrders = (params) =>
  api.get('/user/orders/my', { params });

export const getOrderById = (orderId) =>
  api.get(`/user/orders/${orderId}`);

export const cancelOrder = (orderId) =>
  api.patch(`/user/orders/${orderId}/cancel`);

export const getVendorOrders = (params) =>
  api.get('/user/order/restaurant', { params });

export const getSingleVendorOrder = (orderId) =>
  api.get(`/user/order/restaurant/${orderId}`);

export const changeOrderStatus = (orderId, orderStatus, rejectionMsg) =>
  api.patch(`/user/order/${orderId}/status`, { orderStatus, rejectionMsg });

export const getCoupons = () =>
  api.get('/user/coupons/view');

export const applyCoupon = (couponId) =>
  api.post('/user/coupons/apply', { couponId });

export const getPlatformSettings = () =>
  api.get('/user/settings');

export const getPlatformSettingsVendor = () =>
  api.get('/user/view/settings');

