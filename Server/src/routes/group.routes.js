import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { addMember, browse, configureAI, create, getAIConfig, getById, join, leave, list, listMembers } from '../controllers/group.controller.js';
import { validateAddMemberInput, validateGroupParams, validateNewGroup } from '../validators/group.validator.js';
import { validatePagination } from '../validators/message.validator.js';
import { NotImplementedError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

/**
 * GET /api/v1/groups
 * List groups available to the authenticated user.
 */
router.get('/groups', authenticate, validate({ query: validatePagination }), list);

/**
 * GET /api/v1/groups/browse
 * Browse public groups not yet joined by the authenticated user.
 */
router.get('/groups/browse', authenticate, validate({ query: validatePagination }), browse);

/**
 * POST /api/v1/groups
 * Create a new group.
 */
router.post('/groups', authenticate, validate({ body: validateNewGroup }), create);

/**
 * GET /api/v1/groups/:groupId
 * Fetch a single group by id.
 */
router.get('/groups/:groupId', authenticate, validate({ params: validateGroupParams }), getById);

/**
 * POST /api/v1/groups/:groupId/join
 * Join an existing group.
 */
router.post('/groups/:groupId/join', authenticate, validate({ params: validateGroupParams }), join);

/**
 * POST /api/v1/groups/:groupId/leave
 * Leave a group.
 */
router.post('/groups/:groupId/leave', authenticate, validate({ params: validateGroupParams }), leave);

/**
 * POST /api/v1/groups/:groupId/members
 * Add a user to a group.
 */
router.post('/groups/:groupId/members', authenticate, validate({ params: validateGroupParams, body: validateAddMemberInput }), addMember);

/**
 * GET /api/v1/groups/:groupId/members
 * List members in a group.
 */
router.get('/groups/:groupId/members', authenticate, validate({ params: validateGroupParams }), listMembers);

/**
 * GET /api/v1/groups/:groupId/ai/configuration
 * Fetch workspace AI configuration and prompt preview.
 */
router.get('/groups/:groupId/ai/configuration', authenticate, validate({ params: validateGroupParams }), getAIConfig);

/**
 * POST /api/v1/groups/:groupId/ai/configure
 * PATCH /api/v1/groups/:groupId/ai/configuration
 * Update or regenerate workspace AI configuration.
 */
router.post('/groups/:groupId/ai/configure', authenticate, validate({ params: validateGroupParams }), configureAI);
router.patch('/groups/:groupId/ai/configuration', authenticate, validate({ params: validateGroupParams }), configureAI);
router.post('/groups/:groupId/ai/regenerate', authenticate, validate({ params: validateGroupParams }), configureAI);

export default router;
