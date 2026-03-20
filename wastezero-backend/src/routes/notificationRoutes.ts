import express from 'express';
import {
    getNotifications,
    markAsRead
} from '../controllers/notificationController';
import { authProtect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authProtect);

// @route   GET /api/notifications
router.get('/', getNotifications);

// @route   PUT /api/notifications/:id/read
router.put('/:id/read', markAsRead);

export default router;
