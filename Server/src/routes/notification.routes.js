import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { getPreferences, getUnreadCount, list, markAllRead, markRead, remove, updatePreferences } from '../controllers/notification.controller.js';

const router = Router();

/**
 * GET /api/v1/notifications
 * List notifications for the authenticated user.
 */
router.get('/notifications', authenticate, list);

/**
 * GET /api/v1/notifications/unread-count
 * Fetch unread notification count.
 */
router.get('/notifications/unread-count', authenticate, getUnreadCount);

router.get('/notifications/preferences', authenticate, getPreferences);
router.patch('/notifications/preferences', authenticate, updatePreferences);

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read.
 */
router.patch('/notifications/read-all', authenticate, markAllRead);

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read.
 */
router.patch('/notifications/:id/read', authenticate, markRead);

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification.
 */
router.delete('/notifications/:id', authenticate, remove);

export default router;
