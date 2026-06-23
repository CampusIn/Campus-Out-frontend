import api from './axios';

// Create delivery partner profile (phoneNumber, vehicleNumber)
export const createDeliveryProfile = (data) => 
  api.post('/delivery/profile', data);

// Assign a delivery partner to an order (vendor action)
export const assignDeliveryPartner = (orderId, deliveryPartnerId) =>
  api.patch(`/delivery/orders/${orderId}/assign-delivery`, { deliveryPartnerId });

// Fetch all orders assigned to the logged-in delivery partner
export const getDeliveryOrders = () =>
  api.get('/delivery/orders');

// Fetch a single order's details for the delivery partner
export const getDeliveryOrderById = (orderId) =>
  api.get(`/delivery/orders/${orderId}`);

// Mark an order as picked up (ready -> out for delivery)
export const pickUpOrder = (orderId) =>
  api.patch(`/delivery/orders/${orderId}/pick-up`);

// Mark an order as delivered (out for delivery -> delivered)
export const deliverOrder = (orderId) =>
  api.patch(`/delivery/orders/${orderId}/deliver`);
