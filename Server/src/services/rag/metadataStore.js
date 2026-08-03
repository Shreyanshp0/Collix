import VectorMetadata from '../../models/VectorMetadata.js';

export function createMetadataStore() {
	async function createMessageMetadata(message, chunkIndex) {
		const record = await VectorMetadata.create({
			groupId: message.group,
			sourceType: 'message',
			sourceId: message._id.toString(),
			contentType: 'text',
			text: message.message,
			chunkIndex,
			messageId: message._id,
			metadata: {
				senderId: message.sender?.toString(),
				createdAt: message.createdAt,
			},
		});
		return { sourceType: 'message', messageId: message._id.toString(), groupId: message.group.toString(), senderId: message.sender?.toString(), createdAt: message.createdAt, chunkIndex, recordId: record._id.toString() };
	}

	async function createDocumentMetadata(document, chunkIndex, text = '') {
		const chunkText = text || document.content || document.name || '';
		const record = await VectorMetadata.create({
			groupId: document.group,
			sourceType: 'document',
			sourceId: document._id.toString(),
			contentType: 'text',
			text: chunkText,
			chunkIndex,
			documentId: document._id,
			filename: document.originalName || document.name,
			mimeType: document.mimeType,
			metadata: {
				uploadedBy: document.uploadedBy?.toString(),
				uploadedAt: document.uploadedAt,
			},
		});
		return { sourceType: 'document', documentId: document._id.toString(), groupId: document.group.toString(), uploadedBy: document.uploadedBy?.toString(), uploadedAt: document.uploadedAt, chunkIndex, recordId: record._id.toString() };
	}

	return { createDocumentMetadata, createMessageMetadata };
}
