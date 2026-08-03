import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { askAi } from '../controllers/ai.controller.js';

const router = Router();
import { ValidationError } from '../utils/AppError.js';

function validateAiAskBody(body) {
	if (!body || typeof body !== 'object') {
		throw new ValidationError('Request body must be an object');
	}

	if (!body.groupId) {
		throw new ValidationError('groupId is required');
	}

	if (!body.question || typeof body.question !== 'string' || !body.question.trim()) {
		throw new ValidationError('question string is required');
	}


	return body;
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