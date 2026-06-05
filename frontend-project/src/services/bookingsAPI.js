import api from './axiosInstance.js';

export const bookingsAPI = {
  list: (params) => api.get('/bookings', { params }),
  create: (payload) => api.post('/bookings', payload),
  update: (id, payload) => api.put(`/bookings/${id}`, payload),
  remove: (id) => api.delete(`/bookings/${id}`),
  approve: (id) => api.patch(`/bookings/${id}/approve`),
  reject: (id) => api.patch(`/bookings/${id}/reject`)
};
