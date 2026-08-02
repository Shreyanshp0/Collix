import { MAX_MESSAGE_LENGTH, MESSAGE_TYPE_VALUES, TEXT_REQUIRED_MESSAGE_TYPES } from '../constants/messageTypes.js';
import { MAX_PAGE_SIZE } from '../constants/pagination.js';
import { ValidationError } from '../utils/AppError.js';
import { validateSocketObjectId } from './socket.validator.js';

export function validateMessageInput({ message = '', type = 'text', attachments = [] }) {
	if (!MESSAGE_TYPE_VALUES.includes(type)) throw new ValidationError('Unsupported message type');
	if (typeof message !== 'string' || message.length > MAX_MESSAGE_LENGTH) {
		throw new ValidationError(`Message must not exceed ${MAX_MESSAGE_LENGTH} characters`);
	}
	if (TEXT_REQUIRED_MESSAGE_TYPES.includes(type) && !message.trim()) {
		throw new ValidationError('Message content cannot be empty');
	}
	if (!Array.isArray(attachments)) throw new ValidationError('Attachments must be an array');
}

export function validatePagination({ page = 1, limit = 30 }) {
	const parsedPage = Number(page);
	const parsedLimit = Number(limit);
	if (!Number.isInteger(parsedPage) || parsedPage < 1) throw new ValidationError('Page must be a positive integer');
	if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_PAGE_SIZE) {
		throw new ValidationError(`Limit must be between 1 and ${MAX_PAGE_SIZE}`);
	}
	return { page: parsedPage, limit: parsedLimit };
}

export function validateMessageQuery(query = {}) {
	if (query && typeof query !== 'object') {
		throw new ValidationError('Query must be an object');
	}
}

export function validateGroupMessageParams(params = {}) {
	if (!params || typeof params !== 'object') {
		throw new ValidationError('Request parameters must be an object');
	}

	return { groupId: validateSocketObjectId(params.groupId, 'Group ID') };
}

export function validateMessageReadParams(params = {}) {
	const { groupId } = validateGroupMessageParams(params);
	return { groupId, messageId: validateSocketObjectId(params.messageId, 'Message ID') };
}
