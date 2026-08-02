import { ValidationError } from '../utils/AppError.js';
import { UPLOAD_CONSTANTS } from '../constants/upload.js';

export function validateDocumentForIndexing(document) {
	if (!document?.group || !document?.storage?.url || !document?.mimeType) {
		throw new ValidationError('Document group, URL, and MIME type are required for indexing');
	}
}

export function validateDocumentPayload(payload = {}) {
	if (payload && typeof payload !== 'object') {
		throw new ValidationError('Document payload must be an object');
	}
}

export function validateDocumentParams(params = {}) {
	if (!params || typeof params !== 'object') {
		throw new ValidationError('Request parameters must be an object');
	}
	if (!params.groupId && !params.documentId) {
		throw new ValidationError('A group or document identifier is required');
	}
	return params;
}

export function validateUploadRequest(req) {
	if (!req?.files || !Array.isArray(req.files) || req.files.length === 0) {
		throw new ValidationError('At least one document upload is required');
	}
	if (req.files.length > UPLOAD_CONSTANTS.MAX_FILES) {
		throw new ValidationError(`You can upload up to ${UPLOAD_CONSTANTS.MAX_FILES} files at once`);
	}
	return req.files;
}
