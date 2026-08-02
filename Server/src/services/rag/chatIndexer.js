import Document from '../../models/Document.js';
import { DOCUMENT_PROCESSING_STATUS } from '../../constants/documentStatus.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';
import { createQueueProvider } from './providers/queue.provider.js';

export function createChatIndexer({ embeddings, vectorStore, splitter, metadataStore, documentLoader, queue, logger = defaultLogger } = {}) {
	assertLogger(logger);
	if (!embeddings?.createEmbedding || !vectorStore?.upsertChunks || !splitter?.splitText || !metadataStore || !documentLoader?.loadDocument) {
		throw new TypeError('Chat indexer requires embedding, vector store, splitter, metadata, and document loader dependencies');
	}
	const jobQueue = queue || createQueueProvider();

	async function persistChunks(chunks) {
		const vectors = await Promise.all(chunks.map(({ content }) => embeddings.createEmbedding({ text: content })));
		return vectorStore.upsertChunks(chunks.map((chunk, index) => ({ ...chunk, vector: vectors[index] })));
	}

	function indexMessage(message) {
		jobQueue.enqueue({
			name: 'index-message',
			run: async () => {
				if (!message.message?.trim()) return;
				const chunks = splitter.splitText({ text: message.message, metadata: metadataStore.createMessageMetadata(message, 0) });
				await persistChunks(chunks);
			},
		});
	}

	function indexDocument(document) {
		jobQueue.enqueue({
			name: 'index-document',
			run: async () => {
				await Document.updateOne({ _id: document._id }, { $set: { processingStatus: DOCUMENT_PROCESSING_STATUS.PROCESSING } });
				try {
					const text = await documentLoader.loadDocument(document);
					const chunks = splitter.splitText({ text, metadata: metadataStore.createDocumentMetadata(document, 0) });
					const vectorIds = await persistChunks(chunks);
					await Document.updateOne({ _id: document._id }, { $set: { processingStatus: DOCUMENT_PROCESSING_STATUS.READY, vectorIds, 'metadata.chunkCount': chunks.length } });
				} catch (error) {
					await Document.updateOne({ _id: document._id }, { $set: { processingStatus: DOCUMENT_PROCESSING_STATUS.FAILED } });
					throw error;
				}
			},
		});
	}

	return { indexDocument, indexMessage };
}
