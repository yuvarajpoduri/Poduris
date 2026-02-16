import express from 'express';
import {
  getAllUsers,
  getUser,
  approveUser,
  rejectUser,
  updateUser,
  updateMyProfile,
  resetUserPassword
} from '../controllers/userController.js';
import { register } from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.get('/', protect, authorize('admin'), getAllUsers);
router.put('/me/profile', protect, updateMyProfile);
router.get('/:id', protect, authorize('admin'), getUser);
router.put('/:id/approve', protect, authorize('admin'), approveUser);
router.put('/:id/reject', protect, authorize('admin'), rejectUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.put('/:id/reset-password', protect, authorize('admin'), resetUserPassword);

export default router;


