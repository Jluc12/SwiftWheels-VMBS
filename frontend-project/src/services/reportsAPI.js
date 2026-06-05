import api from './axiosInstance.js';

export const reportsAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  main: (params) => api.get('/reports/main', { params }),
  dailyBookings: () => api.get('/reports/daily-bookings'),
  bookingPayments: () => api.get('/reports/booking-payments')
};
