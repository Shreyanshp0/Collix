export const DOCUMENT_PROCESSING_STATUS = Object.freeze({
	UPLOADED: 'uploaded',
	QUEUED: 'queued',
	PROCESSING: 'processing',
	READY: 'ready',
	FAILED: 'failed',
});

export const DOCUMENT_PROCESSING_STATUS_VALUES = Object.freeze(Object.values(DOCUMENT_PROCESSING_STATUS));

export const DOCUMENT_LIFECYCLE_EVENTS = Object.freeze({
	UPLOADED: 'document:uploaded',
	PROCESSING: 'document:processing',
	READY: 'document:ready',
	FAILED: 'document:failed',
	DELETED: 'document:deleted',
});
