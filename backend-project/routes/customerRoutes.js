import { Router } from 'express';
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from '../controllers/customerController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);
router.get('/', listCustomers);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
