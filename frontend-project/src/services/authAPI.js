import api from './axiosInstance.js';

export const authAPI = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  resetPassword: (payload) => api.post('/auth/reset-password', payload)
};
