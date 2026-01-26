import express from 'express';
import { getStats } from '../controllers/statsController.js';
import { protect, admin } from '../middlewares/auth.js';

const router = express.Router();

// Only admins can see website trends
router.get('/', protect, admin, getStats);

export default router;
