import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { NotImplementedError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

/**
 * POST /api/v1/ai/ask
 * AI endpoint placeholder. The implementation is intentionally unavailable.
 */
router.post('/ai/ask', authenticate, validate({ body: (value) => value }), asyncHandler(async () => {
	throw new NotImplementedError('AI HTTP operations');
}));

export default router;