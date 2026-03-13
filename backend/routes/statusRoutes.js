import express from 'express';
import { protect } from '../middlewares/auth.js';
import { 
  getAllStatuses, 
  createStatus, 
  deleteStatus, 
  viewStatus 
} from '../controllers/statusController.js';

const router = express.Router();

router.get('/', protect, getAllStatuses);
router.post('/', protect, createStatus);
router.delete('/:id', protect, deleteStatus);
router.put('/:id/view', protect, viewStatus);

export default router;
