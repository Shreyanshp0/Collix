import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { create as createMessage, list as listMessages, markRead as markMessageRead } from '../controllers/message.controller.js';
import { validateGroupMessageParams, validateMessageInput, validateMessageReadParams, validatePagination } from '../validators/message.validator.js';

const router = Router();

/**
 * POST /api/v1/groups/:groupId/messages
 * Create a new message in a group.
 */
router.post(
	'/groups/:groupId/messages',
	authenticate,
	validate({ body: validateMessageInput, params: validateGroupMessageParams }),
	createMessage
);

/**
 * GET /api/v1/groups/:groupId/messages
 * List group messages with pagination.
 */
router.get(
	'/groups/:groupId/messages',
	authenticate,
	validate({ query: validatePagination, params: validateGroupMessageParams }),
	listMessages
);

/**
 * PATCH /api/v1/groups/:groupId/messages/:messageId/read
 * Mark a message as read for the authenticated user.
 */
router.patch(
	'/groups/:groupId/messages/:messageId/read',
	authenticate,
	validate({ params: validateMessageReadParams }),
	markMessageRead
);

export default router;
