import { Router } from 'express';
import { getBookingPayments, getDailyBookings, getDashboard, getMainReport } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/dashboard', getDashboard);
router.get('/main', getMainReport);
router.get('/daily-bookings', getDailyBookings);
router.get('/booking-payments', getBookingPayments);

export default router;
