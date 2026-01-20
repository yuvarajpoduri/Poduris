import express from 'express';
import { getCalendarEvents } from '../controllers/calendarController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/events', protect, getCalendarEvents);

export default router;

