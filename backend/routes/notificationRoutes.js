import express from 'express';
import { protect, admin } from '../middlewares/auth.js';
import { 
    getNotifications, 
    createNotification, 
    markAsRead, 
    markAllAsRead,
    deleteNotification
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.post('/', createNotification); // Allow users to send notifications (e.g. wishes)
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;
