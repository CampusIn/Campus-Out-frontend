import api from './axios';

export const createReview = (restaurantId, data) =>
  api.post(`/user/reviews/${restaurantId}`, data);

export const getRestaurantReviews = (restaurantId, params) =>
  api.get(`/user/restaurants/${restaurantId}/reviews`, { params });

export const updateReview = (reviewId, data) =>
  api.patch(`/user/reviews/${reviewId}`, data);

export const deleteReview = (reviewId) =>
  api.delete(`/user/reviews/${reviewId}`);
