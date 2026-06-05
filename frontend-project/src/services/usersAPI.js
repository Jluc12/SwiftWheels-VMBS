import api from './axiosInstance.js';

export const usersAPI = {
  list: (params) => api.get('/users', { params }),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  resetPassword: (id, password) => api.patch(`/users/${id}/password`, { password }),
  remove: (id) => api.delete(`/users/${id}`)
};
