import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { validateGroupQuery, validateNewGroup } from '../validators/group.validator.js';
import { NotImplementedError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

/**
 * GET /api/v1/groups
 * List groups available to the authenticated user.
 */
router.get('/groups', authenticate, validate({ query: validateGroupQuery }), asyncHandler(async () => {
	throw new NotImplementedError('Group listing');
}));

/**
 * POST /api/v1/groups
 * Create a new group.
 */
router.post('/groups', authenticate, validate({ body: validateNewGroup }), asyncHandler(async () => {
	throw new NotImplementedError('Group creation');
}));

/**
 * GET /api/v1/groups/:groupId
 * Fetch a single group by id.
 */
router.get('/groups/:groupId', authenticate, validate({ params: (value) => value }), asyncHandler(async () => {
	throw new NotImplementedError('Group retrieval');
}));

/**
 * POST /api/v1/groups/:groupId/join
 * Join an existing group.
 */
router.post('/groups/:groupId/join', authenticate, validate({ params: (value) => value }), asyncHandler(async () => {
	throw new NotImplementedError('Group join');
}));

/**
 * POST /api/v1/groups/:groupId/leave
 * Leave a group.
 */
router.post('/groups/:groupId/leave', authenticate, validate({ params: (value) => value }), asyncHandler(async () => {
	throw new NotImplementedError('Group leave');
}));

/**
 * GET /api/v1/groups/:groupId/members
 * List members in a group.
 */
router.get('/groups/:groupId/members', authenticate, validate({ params: (value) => value }), asyncHandler(async () => {
	throw new NotImplementedError('Group members listing');
}));

export default router;