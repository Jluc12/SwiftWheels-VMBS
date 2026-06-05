import api from './axiosInstance.js';

export const customersAPI = {
  list: (params) => api.get('/customers', { params }),
  create: (payload) => api.post('/customers', payload),
  update: (id, payload) => api.put(`/customers/${id}`, payload),
  remove: (id) => api.delete(`/customers/${id}`)
};
