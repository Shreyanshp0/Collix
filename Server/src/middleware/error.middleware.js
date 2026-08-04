import { AppError, AuthenticationError, AuthorizationError, ValidationError } from '../utils/AppError.js';
import defaultLogger from '../utils/logger.js';

function normalizeZodError(error) {
	const issues = error?.issues || [];
	const details = issues.map((issue) => ({
		path: issue.path || [],
		message: issue.message,
	}));

	return {
		statusCode: 400,
		code: 'VALIDATION_ERROR',
		message: details[0]?.message || 'Validation failed',
		details,
	};
}

function normalizeMongooseError(error) {
	if (error?.name === 'CastError') {
		return {
			statusCode: 400,
			code: 'INVALID_ID',
			message: 'Invalid identifier provided',
			details: { field: error.path, value: error.value },
		};
	}

	if (error?.name === 'ValidationError') {
		return {
			statusCode: 400,
			code: 'MONGOOSE_VALIDATION_ERROR',
			message: error.message,
			details: error.errors,
		};
	}

	return {
		statusCode: 500,
		code: 'DATABASE_ERROR',
		message: 'Database operation failed',
		details: error?.message,
	};
}

function normalizeJwtError(error) {
	return {
		statusCode: 401,
		code: 'UNAUTHORIZED',
		message: 'Invalid or expired token',
		details: error?.message,
	};
}

function normalizeError(error) {
	if (error instanceof AppError) {
		return {
			statusCode: error.statusCode,
			code: error.code,
			message: error.message,
			details: error.details,
		};
	}

	if (error instanceof ValidationError) {
		return {
			statusCode: error.statusCode,
			code: error.code,
			message: error.message,
			details: error.details,
		};
	}

	if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
		return {
			statusCode: error.statusCode,
			code: error.code,
			message: error.message,
			details: error.details,
		};
	}

	if (error?.name === 'ZodError') {
		return normalizeZodError(error);
	}

	if (error?.name === 'MongooseError' || error?.name === 'CastError' || error?.name === 'ValidationError') {
		return normalizeMongooseError(error);
	}

	if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
		return normalizeJwtError(error);
	}

	return {
		statusCode: 500,
		code: 'INTERNAL_SERVER_ERROR',
		message: 'Internal server error',
		details: error?.message,
	};
}

export default function errorMiddleware(err, req, res, next) {
	if (err?.code === 'CAPABILITY_DENIED' || err?.name === 'WorkspacePolicyViolation') {
		return res.status(403).json({
			success: false,
			code: 'CAPABILITY_DENIED',
			message: err.message || 'This workspace does not permit this type of AI request.',
			requiredCapability: err.requiredCapability || 'CODE_REVIEW',
			enabledCapabilities: err.enabledCapabilities || [],
			blockedCapabilities: err.blockedCapabilities || [],
			risk: err.risk || 'MEDIUM',
		});
	}

	const normalized = normalizeError(err);

	// Log complete error stack trace to server console for debugging without exposing to client
	if (normalized.statusCode >= 500) {
		defaultLogger.error('Unhandled API Error:', {
			message: err?.message || 'Server Error',
			stack: err?.stack || err,
			statusCode: normalized.statusCode,
			path: req?.originalUrl,
			method: req?.method,
		});
	}

	const payload = {
		success: false,
		message: normalized.message,
		error: {
			code: normalized.code,
			statusCode: normalized.statusCode,
			details: normalized.details,
		},
	};

	res.status(normalized.statusCode).json(payload);
}
