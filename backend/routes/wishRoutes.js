import express from 'express';
import { protect } from '../middlewares/auth.js';
import { 
  sendWish, 
  getReceivedWishes, 
  getSentWishFamilyIds 
} from '../controllers/wishController.js';

const router = express.Router();

router.use(protect); // All routes are protected

router.route('/')
  .post(sendWish);

router.get('/received', getReceivedWishes);
router.get('/sent-ids', getSentWishFamilyIds);

export default router;
