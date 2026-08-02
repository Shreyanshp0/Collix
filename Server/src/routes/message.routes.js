import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { create as createMessage, list as listMessages, markRead as markMessageRead } from '../controllers/message.controller.js';
import { validateMessageInput, validatePagination } from '../validators/message.validator.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

/**
 * POST /api/v1/groups/:groupId/messages
 * Create a new message in a group.
 */
router.post(
	'/groups/:groupId/messages',
	authenticate,
	validate({ body: validateMessageInput, params: (value) => value }),
	asyncHandler(async (req, res, next) => {
		req.params.id = req.params.groupId;
		return createMessage(req, res, next);
	})
);

/**
 * GET /api/v1/groups/:groupId/messages
 * List group messages with pagination.
 */
router.get(
	'/groups/:groupId/messages',
	authenticate,
	validate({ query: validatePagination, params: (value) => value }),
	asyncHandler(async (req, res, next) => {
		req.params.id = req.params.groupId;
		return listMessages(req, res, next);
	})
);

/**
 * PATCH /api/v1/groups/:groupId/messages/:messageId/read
 * Mark a message as read for the authenticated user.
 */
router.patch(
	'/groups/:groupId/messages/:messageId/read',
	authenticate,
	validate({ params: (value) => value }),
	asyncHandler(async (req, res, next) => {
		req.params.id = req.params.groupId;
		return markMessageRead(req, res, next);
	})
);

export default router;