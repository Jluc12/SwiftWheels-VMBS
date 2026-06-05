import { Router } from 'express';
import { approveBooking, createBooking, deleteBooking, listBookings, rejectBooking, updateBooking } from '../controllers/bookingController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listBookings);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);
router.patch('/:id/approve', requireAdmin, approveBooking);
router.patch('/:id/reject', requireAdmin, rejectBooking);

export default router;
