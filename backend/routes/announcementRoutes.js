import express from 'express';
import { protect } from '../middlewares/auth.js';
import { getAnnouncements, createAnnouncement } from '../controllers/announcementController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAnnouncements)
  .post(createAnnouncement);

export default router;
