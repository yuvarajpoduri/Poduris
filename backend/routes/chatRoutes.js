import express from 'express';
import {
  getChats,
  sendMessage,
  deleteMessage
} from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', protect, getChats);
router.post('/', protect, sendMessage);
router.delete('/:id', protect, deleteMessage);

export default router;










