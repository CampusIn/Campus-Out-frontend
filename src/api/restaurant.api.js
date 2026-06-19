import api from './axios';

export const getRestaurants = (params) =>
  api.get('/restaurants', { params });

export const getRestaurantById = (id) => api.get(`/restaurant/${id}`);

export const getMyRestaurants = () => api.get('/restaurants/my');

export const createRestaurant = (data) => api.post('/restaurants', data);

export const updateRestaurant = (id, data) =>
  api.patch(`/restaurants/${id}`, data);

export const deleteRestaurant = (id) => api.delete(`/restaurants/${id}`);

export const toggleRestaurantStatus = (id, isOpen) =>
  api.patch(`/restaurants/${id}/status`, { isOpen });
