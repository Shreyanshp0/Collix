import { toUserDto } from './user.mapper.js';

function getId(value) {
	if (!value) return null;
	if (typeof value === 'string') return value;
	if (typeof value === 'object') {
		if (value.id && typeof value.id === 'string') return value.id;
		if (value._id) return value._id.toString();
		if (typeof value.toString === 'function') {
			const str = value.toString();
			if (str !== '[object Object]') return str;
		}
	}
	return String(value);
}

export function toDocumentDto(document) {
	if (!document) return null;
	return {
		id: getId(document),
		name: document.name,
		originalName: document.originalName,
		mimeType: document.mimeType,
		size: document.size,
		uploadedBy: toUserDto(document.uploadedBy) || { id: getId(document.uploadedBy) },
		uploadedAt: document.uploadedAt,
		status: document.processingStatus,
		groupId: getId(document.group),
		storage: document.storage || null,
		version: document.version || 1,
		metadata: document.metadata || {},
	};
}
