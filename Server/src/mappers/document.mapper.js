import { toUserDto } from './user.mapper.js';

function getId(value) {
	return value?.id || value?._id?.toString?.() || value?._id || value?.toString?.();
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
