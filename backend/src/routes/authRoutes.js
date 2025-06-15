import express from 'express';
import { register, verifyEmail, login, registerEmployer } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/register/employer', registerEmployer);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);

export default router;
