import api from './axiosInstance.js';

export const paymentsAPI = {
  list: (params) => api.get('/payments', { params }),
  create: (payload) => api.post('/payments', payload),
  update: (id, payload) => api.put(`/payments/${id}`, payload),
  remove: (id) => api.delete(`/payments/${id}`)
};
