import api from './axios';

export const getLuckyWheelStatus = () => 
  api.get('/lucky-wheel/status');

export const spinLuckyWheel = () => 
  api.post('/lucky-wheel/spin');
