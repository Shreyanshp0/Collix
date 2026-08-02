import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { login, me, register } from '../controllers/auth.controller.js';
import { validateLoginInput, validateRegistrationInput } from '../validators/auth.validator.js';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user.
 */
router.post('/register', validate({ body: validateRegistrationInput }), register);

/**
 * POST /api/v1/auth/login
 * Authenticate a user and issue a token.
 */
router.post('/login', validate({ body: validateLoginInput }), login);

/**
 * GET /api/v1/auth/me
 * Fetch the currently authenticated user profile.
 */
router.get('/me', authenticate, me);

export default router;