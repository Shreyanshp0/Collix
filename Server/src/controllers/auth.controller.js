import sendErrorResponse from '../utils/errorResponse.js';
import { loginUser, registerUser, sanitizeUser } from '../services/auth.service.js';

function validateRegisterInput({ username, email, password }) {
	if (!username || !email || !password) {
		return 'Username, email, and password are required';
	}

	if (password.length < 8) {
		return 'Password must be at least 8 characters long';
	}

	return null;
}

function validateLoginInput({ email, password }) {
	if (!email || !password) {
		return 'Email and password are required';
	}

	return null;
}

async function register(req, res) {
	try {
		const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
		const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
		const password = typeof req.body.password === 'string' ? req.body.password : '';
		const avatar = typeof req.body.avatar === 'string' ? req.body.avatar.trim() : undefined;

		const validationError = validateRegisterInput({ username, email, password });

		if (validationError) {
			return sendErrorResponse(res, 400, validationError);
		}

		const result = await registerUser({ username, email, password, avatar });

		return res.status(201).json({
			success: true,
			message: 'User registered successfully',
			data: {
				token: result.token,
				user: result.user,
			},
		});
	} catch (error) {
		if (error.statusCode) {
			return sendErrorResponse(res, error.statusCode, error.message);
		}

		if (error.code === 11000) {
			return sendErrorResponse(res, 409, 'Username or email already exists');
		}

		return sendErrorResponse(res, 500, 'Failed to register user');
	}
}

async function login(req, res) {
	try {
		const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
		const password = typeof req.body.password === 'string' ? req.body.password : '';

		const validationError = validateLoginInput({ email, password });

		if (validationError) {
			return sendErrorResponse(res, 400, validationError);
		}

		const result = await loginUser({ email, password });

		return res.status(200).json({
			success: true,
			message: 'Login successful',
			data: {
				token: result.token,
				user: result.user,
			},
		});
	} catch (error) {
		if (error.statusCode) {
			return sendErrorResponse(res, error.statusCode, error.message);
		}

		return sendErrorResponse(res, 500, 'Failed to login user');
	}
}

async function me(req, res) {
	return res.status(200).json({
		success: true,
		message: 'Authenticated user fetched successfully',
		data: {
			user: sanitizeUser(req.user),
		},
	});
}

export { login, me, register };