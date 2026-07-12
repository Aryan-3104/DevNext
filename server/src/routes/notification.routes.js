import express from 'express';
import {
	getNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);

// IMPORTANT: Mount /read-all BEFORE /:id/read to prevent the :id param from
// swallowing the literal "read-all" path segment.
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;
