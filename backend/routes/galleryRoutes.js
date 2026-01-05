import express from 'express';
import {
  getGalleryImages,
  getGalleryImage,
  uploadGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  approveGalleryImage,
  rejectGalleryImage
} from '../controllers/galleryController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/:id', protect, getGalleryImage);
router.get('/', protect, getGalleryImages);

// Allow all authenticated users to upload
router.post('/', protect, uploadGalleryImage);
router.put('/:id', protect, authorize('admin'), updateGalleryImage);
router.put('/:id/approve', protect, authorize('admin'), approveGalleryImage);
router.put('/:id/reject', protect, authorize('admin'), rejectGalleryImage);
router.delete('/:id', protect, authorize('admin'), deleteGalleryImage);

export default router;

