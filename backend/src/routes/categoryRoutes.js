import { Router } from 'express';
import { getCategories, updateCategories } from '../controllers/categoryController.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', getCategories);
router.put('/', authMiddleware, isAdmin, updateCategories);

export default router;