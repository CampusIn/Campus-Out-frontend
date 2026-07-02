import api from './axios';

export const getRestaurantMenu = (restaurantId) =>
  api.get(`/restaurants/${restaurantId}/menu`);

export const getMenuItemById = (id) => api.get(`/restaurants/menu/${id}`);

export const createMenuItem = (restaurantId, formData) =>
  api.post(`/restaurants/${restaurantId}/menu`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateMenuItem = (id, data) =>
  api.patch(`/restaurants/menu/${id}`, data);

export const toggleMenuItemStatus = (id, isAvailable) =>
  api.patch(`/restaurants/menu/${id}/status`, { isAvailable });

export const deleteMenuItem = (id) => api.delete(`/restaurants/menu/${id}`);

export const getMenuSuggestions = (q) =>
  api.get(`/restaurants/menu/suggestions`, { params: { q } });

