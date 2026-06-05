import { Router } from 'express';
import { createUser, deleteUser, listUsers, resetUserPassword, updateUser } from '../controllers/userController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);
router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/password', resetUserPassword);
router.delete('/:id', deleteUser);

export default router;
