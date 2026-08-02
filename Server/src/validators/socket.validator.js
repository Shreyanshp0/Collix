import { ValidationError } from '../utils/AppError.js';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function validateSocketObjectId(value, fieldName) {
	if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
		throw new ValidationError(`${fieldName} must be a valid ID`);
	}
	return value;
}

export function validateSocketPayload(payload, fieldName = 'payload') {
	if (payload === undefined || payload === null) {
		throw new ValidationError(`${fieldName} is required`);
	}
	if (typeof payload !== 'object' || Array.isArray(payload)) {
		throw new ValidationError(`${fieldName} must be an object`);
	}
	return payload;
}
