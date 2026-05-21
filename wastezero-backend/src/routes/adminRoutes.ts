import express from 'express';
import { getAnalytics, getUsersActivity, suspendUser, broadcastSystemAlert, getAdminLogs } from '../controllers/adminController';
import { authProtect } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = express.Router();

// @route   GET /api/admin/analytics
// @access  Private (Admin)
router.get('/analytics', authProtect, requireRole(['Admin', 'NGO']), getAnalytics);

// @route   GET /api/admin/users
// @access  Private (Admin)
router.get('/users', authProtect, requireRole(['Admin', 'NGO']), getUsersActivity);

// @route   PUT /api/admin/users/:id/suspend
// @access  Private (Admin)
router.put('/users/:id/suspend', authProtect, requireRole(['Admin']), suspendUser);

// @route   POST /api/admin/alerts
// @access  Private (Admin)
router.post('/alerts', authProtect, requireRole(['Admin']), broadcastSystemAlert);

// @route   GET /api/admin/logs
// @access  Private (Admin)
router.get('/logs', authProtect, requireRole(['Admin']), getAdminLogs);

export default router;
