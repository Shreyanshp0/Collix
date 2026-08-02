import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { askAi } from '../controllers/ai.controller.js';

const router = Router();

function validateAiAskBody(body) {
	if (!body || typeof body !== 'object') {
		return 'Request body must be an object';
	}
	if (!body.groupId) {
		return 'groupId is required';
	}
	if (!body.question || typeof body.question !== 'string' || !body.question.trim()) {
		return 'question string is required';
	}
	return true;
}

/**
 * POST /api/v1/ai/ask
 * Execute AI RAG query for a group with authenticated user context
 */
router.post(
	'/ai/ask',
	authenticate,
	validate({ body: validateAiAskBody }),
	askAi
);

export default router;