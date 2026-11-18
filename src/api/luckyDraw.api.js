import api from './axios';

// User Lucky Draw APIs
export const getUserLuckyDrawStatus = () => api.get('/user/lucky-draw/status');
export const submitLuckyDrawEntry = (data) => api.post('/user/lucky-draw/submit', data);
export const getUserLuckyDrawWinners = (params) => api.get('/user/lucky-draw/winners', { params });

// Admin Lucky Draw APIs
export const getAdminLuckyDrawDetails = (params) => api.get('/admin/lucky-draw', { params });
export const enableLuckyDraw = (data) => api.post('/admin/lucky-draw/enable', data);
export const updateLuckyDrawDeadline = (data) => api.patch('/admin/lucky-draw/deadline', data);
export const drawLuckyWinners = (data) => api.post('/admin/lucky-draw/draw', data);
export const getAdminLuckyDrawWinners = (params) => api.get('/admin/lucky-draw/winners', { params });
export const getAdminLuckyDrawParticipants = (params) => api.get('/admin/lucky-draw/participants', { params });
