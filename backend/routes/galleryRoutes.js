import express from 'express';
import {
  getGalleryImages,
  getGalleryImage,
  uploadGalleryImage,
  updateGalleryImage,
  deleteGalleryImage
} from '../controllers/galleryController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/:id', protect, getGalleryImage);
router.get('/', protect, getGalleryImages);

router.post('/', protect, authorize('admin'), uploadGalleryImage);
router.put('/:id', protect, authorize('admin'), updateGalleryImage);
router.delete('/:id', protect, authorize('admin'), deleteGalleryImage);

export default router;

