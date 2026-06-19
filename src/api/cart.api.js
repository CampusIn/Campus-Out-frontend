import api from './axios';

export const getCart = () => api.get('/user/cart');

export const addToCart = (data) => api.post('/user/cart/items', data);

export const updateCartItemQty = (menuItemId, quantity) =>
  api.patch(`/user/cart/items/${menuItemId}`, { quantity });

export const deleteCartItem = (menuItemId) =>
  api.delete(`/user/cart/items/${menuItemId}`);

export const clearCart = () => api.delete('/user/cart');
