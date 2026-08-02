export function createMetadataStore() {
	function createMessageMetadata(message, chunkIndex) {
		return { sourceType: 'message', messageId: message._id.toString(), groupId: message.group.toString(), senderId: message.sender?.toString(), createdAt: message.createdAt, chunkIndex };
	}

	function createDocumentMetadata(document, chunkIndex) {
		return { sourceType: 'document', documentId: document._id.toString(), groupId: document.group.toString(), uploadedBy: document.uploadedBy.toString(), uploadedAt: document.uploadedAt, chunkIndex };
	}

	return { createDocumentMetadata, createMessageMetadata };
}
