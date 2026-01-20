import express from 'express';
import {
  getAllUsers,
  getUser,
  approveUser,
  rejectUser,
  updateUser,
  updateMyProfile
} from '../controllers/userController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), getAllUsers);
router.put('/me/profile', protect, updateMyProfile);
router.get('/:id', protect, authorize('admin'), getUser);
router.put('/:id/approve', protect, authorize('admin'), approveUser);
router.put('/:id/reject', protect, authorize('admin'), rejectUser);
router.put('/:id', protect, authorize('admin'), updateUser);

export default router;


