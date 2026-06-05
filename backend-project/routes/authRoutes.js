import { Router } from 'express';
import { getMe, login, logout, register, resetPassword } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', getMe);
router.post('/reset-password', resetPassword);

export default router;
