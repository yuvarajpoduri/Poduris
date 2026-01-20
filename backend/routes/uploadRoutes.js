import express from 'express';
import { uploadImage, uploadMiddleware } from '../controllers/uploadController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Allow all authenticated users to upload (removed admin restriction for dev)
router.post('/', protect, uploadMiddleware, uploadImage);

export default router;

