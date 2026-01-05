import express from 'express';
import {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/:id', protect, getAnnouncement);
router.get('/', protect, getAnnouncements);

router.post('/', protect, authorize('admin'), createAnnouncement);
router.put('/:id', protect, authorize('admin'), updateAnnouncement);
router.delete('/:id', protect, authorize('admin'), deleteAnnouncement);

export default router;

