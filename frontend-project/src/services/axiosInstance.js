import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname.startsWith('/app')) {
      toast.error('Please sign in again');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
