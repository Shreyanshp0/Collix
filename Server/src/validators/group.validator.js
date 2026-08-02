import { GROUP_ROLE_VALUES } from '../constants/roles.js';
import { ValidationError } from '../utils/AppError.js';
import { validateSocketObjectId } from './socket.validator.js';

export function validateNewGroup({ name, visibility }) {
	if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
		throw new ValidationError('Group name must contain between 1 and 120 characters');
	}
	if (visibility !== undefined && !['public', 'private'].includes(visibility)) {
		throw new ValidationError('Group visibility must be public or private');
	}
}

export function validateGroupRole(role) {
	if (role !== undefined && !GROUP_ROLE_VALUES.includes(role)) {
		throw new ValidationError('Invalid group role');
	}
}

export function validateGroupQuery(query = {}) {
	if (query && typeof query !== 'object') {
		throw new ValidationError('Query must be an object');
	}
}

export function validateGroupParams(params = {}) {
	if (!params || typeof params !== 'object') {
		throw new ValidationError('Request parameters must be an object');
	}

	return { groupId: validateSocketObjectId(params.groupId, 'Group ID') };
}

export function validateAddMemberInput({ userId, role } = {}) {
	return {
		userId: validateSocketObjectId(userId, 'User ID'),
		role,
	};
}
