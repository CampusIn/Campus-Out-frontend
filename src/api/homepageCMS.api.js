import api from './axios';

export const getActiveBanners = () => api.get('/user/homepage/banners');
export const getActiveAnnouncements = () => api.get('/user/homepage/announcements');
