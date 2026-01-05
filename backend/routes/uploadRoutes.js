import express from 'express';
import { uploadImage, uploadMiddleware } from '../controllers/uploadController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, authorize('admin'), uploadMiddleware, uploadImage);

export default router;

