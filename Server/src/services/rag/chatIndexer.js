import Document from '../../models/Document.js';
import { DOCUMENT_PROCESSING_STATUS } from '../../constants/documentStatus.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';

export function createInMemoryQueue({ concurrency = 1, retries = 3, logger = defaultLogger } = {}) {
	assertLogger(logger);
	const pending = [];
	let active = 0;

	async function runNext() {
		if (active >= concurrency || !pending.length) return;
		const job = pending.shift();
		active += 1;
		try {
			for (let attempt = 1; attempt <= (job.retries ?? retries); attempt += 1) {
				try { await job.run(); break; } catch (error) {
					if (attempt === (job.retries ?? retries)) logger.error('Indexing job exhausted retries', { error, job: job.name });
					else logger.warn('Retrying indexing job', { error, job: job.name, attempt });
				}
			}
		} finally {
			active -= 1;
			void runNext();
		}
		void runNext();
	}

	function enqueue(job) {
		pending.push(job);
		void runNext();
	}

	return { enqueue };
}

export function createChatIndexer({ embeddings, vectorStore, splitter, metadataStore, documentLoader, queue, logger = defaultLogger } = {}) {
	assertLogger(logger);
	if (!embeddings?.createEmbedding || !vectorStore?.upsertChunks || !splitter?.splitText || !metadataStore || !documentLoader?.loadDocument) {
		throw new TypeError('Chat indexer requires embedding, vector store, splitter, metadata, and document loader dependencies');
	}
	const jobQueue = queue || createInMemoryQueue({ logger });

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
					await Document.updateOne({ _id: document._id }, { $set: { processingStatus: DOCUMENT_PROCESSING_STATUS.INDEXED, vectorIds, 'metadata.chunkCount': chunks.length } });
				} catch (error) {
					await Document.updateOne({ _id: document._id }, { $set: { processingStatus: DOCUMENT_PROCESSING_STATUS.FAILED } });
					throw error;
				}
			},
		});
	}

	return { indexDocument, indexMessage };
}
