import express from 'express';
import { login, register, getMe, logout } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;

