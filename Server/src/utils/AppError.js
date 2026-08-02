export class AppError extends Error {
	constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', details, cause } = {}) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.code = code;
		this.details = details;
		this.cause = cause;
		this.isOperational = true;
		Error.captureStackTrace?.(this, this.constructor);
	}

	toJSON() {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			statusCode: this.statusCode,
			details: this.details,
		};
	}
}

export class ValidationError extends AppError {
	constructor(message, details) {
		super(message, { statusCode: 400, code: 'VALIDATION_ERROR', details });
	}
}

export class AuthenticationError extends AppError {
	constructor(message = 'Unauthorized') {
		super(message, { statusCode: 401, code: 'UNAUTHORIZED' });
	}
}

export class AuthorizationError extends AppError {
	constructor(message = 'Forbidden') {
		super(message, { statusCode: 403, code: 'FORBIDDEN' });
	}
}

export class NotFoundError extends AppError {
	constructor(resource = 'Resource') {
		super(`${resource} not found`, { statusCode: 404, code: 'NOT_FOUND' });
	}
}

export class ConflictError extends AppError {
	constructor(message) {
		super(message, { statusCode: 409, code: 'CONFLICT' });
	}
}

export class RateLimitError extends AppError {
	constructor(message = 'Too many requests') {
		super(message, { statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' });
	}
}

export class DependencyError extends AppError {
	constructor(message, details) {
		super(message, { statusCode: 503, code: 'DEPENDENCY_UNAVAILABLE', details });
	}
}

export class NotImplementedError extends AppError {
	constructor(feature = 'This operation') {
		super(`${feature} is not implemented`, { statusCode: 501, code: 'NOT_IMPLEMENTED' });
	}
}
