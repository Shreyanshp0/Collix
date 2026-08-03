import axios from 'axios';
import Document from '../../models/Document.js';
import VectorMetadata from '../../models/VectorMetadata.js';
import documentLoader from './loader.js';
import { createTextSplitter } from './splitter.js';
import embeddingsProvider from './providers/embeddings.provider.js';
import vectorStoreProvider from './providers/vectorStore.provider.js';
import { createMetadataStore } from './metadataStore.js';
import queueProvider from './providers/queue.provider.js';
import { DOCUMENT_PROCESSING_STATUS } from '../../constants/documentStatus.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';

export function createDocumentProcessor({
	loader = documentLoader,
	splitter = createTextSplitter(),
	embeddings = embeddingsProvider,
	vectorStore = vectorStoreProvider,
	metadataStore = createMetadataStore(),
	queue = queueProvider,
	logger = defaultLogger,
} = {}) {
	assertLogger(logger);

	async function fetchFileContent(storageUrl) {
		if (!storageUrl) return null;
		if (typeof storageUrl === 'string' && storageUrl.startsWith('data:')) {
			const base64Data = storageUrl.split(',')[1] || '';
			return Buffer.from(base64Data, 'base64');
		}
		try {
			const response = await axios.get(storageUrl, { responseType: 'arraybuffer' });
			return Buffer.from(response.data);
		} catch (err) {
			logger.error('Failed to fetch document content from storage URL', { storageUrl, error: err.message });
			throw err;
		}
	}

	async function processDocument(documentId) {
		if (!documentId) return null;

		const document = await Document.findById(documentId);
		if (!document) {
			logger.warn('Document not found for processing', { documentId });
			return null;
		}

		// 1. Idempotency Guard: if already ready & vectorized, exit early
		if (document.processingStatus === DOCUMENT_PROCESSING_STATUS.READY && document.metadata?.vectorized) {
			logger.info('Document is already ready and vectorized (idempotent skipped)', { documentId: document._id.toString() });
			return document;
		}

		// 2. Retry Cleanup: Remove any old vectors and metadata records if re-processing
		if (Array.isArray(document.vectorIds) && document.vectorIds.length > 0) {
			try {
				await vectorStore.removeVectors(document.vectorIds);
			} catch (cleanErr) {
				logger.warn('Error removing old vectors during retry', { error: cleanErr });
			}
		}
		await VectorMetadata.deleteMany({ documentId: document._id });
		document.vectorIds = [];

		// 3. Update status to 'processing'
		document.processingStatus = DOCUMENT_PROCESSING_STATUS.PROCESSING;
		await document.save();

		try {
			// 4. Load & Extract Text
			let rawContent = document.content || document.buffer;
			if (!rawContent && document.storage?.url) {
				rawContent = await fetchFileContent(document.storage.url);
			}

			const docForLoader = {
				name: document.name || document.originalName,
				mimeType: document.mimeType,
				content: rawContent,
			};


			const extractedText = await loader.loadDocument(docForLoader);
			console.log('\n===== Extracted Text Preview =====');
			console.log(extractedText.substring(0, 1000));
			console.log('==================================\n');

			// 5. Split Text into Chunks
			const chunks = splitter.splitText({
				text: extractedText,
				metadata: {
					groupId: document.group?.toString(),
					documentId: document._id?.toString(),
					filename: document.originalName || document.name,
					mimeType: document.mimeType,
				},
			});
			console.log("Chunks created:", chunks.length);
			console.log("First chunk:");
			console.log(chunks[0]?.content);

			// 6. Embed & Store Vectors & Metadata
			const chunksWithVectors = [];
			for (const chunk of chunks) {
				const vector = await embeddings.createEmbedding({ text: chunk.content });
				const metaRecord = await metadataStore.createDocumentMetadata(document, chunk.metadata.chunkIndex, chunk.content);

				chunksWithVectors.push({
					content: chunk.content,
					vector,
					metadata: {
						...chunk.metadata,
						sourceType: 'document',
						sourceId: document._id?.toString(),
						groupId: document.group?.toString(),
						filename: document.originalName || document.name,
						mimeType: document.mimeType,
						recordId: metaRecord.recordId,
					},
				});
			}

			const createdVectorIds = await vectorStore.upsertChunks(chunksWithVectors);

			// 7. Update Document Status & Metadata to 'ready'
			const providerVersion = embeddings.version || embeddingsProvider.version || 'v1';

			document.processingStatus = DOCUMENT_PROCESSING_STATUS.READY;
			document.vectorIds = createdVectorIds || [];
			document.metadata = {
				...(document.metadata || {}),
				chunkCount: chunks.length,
				vectorized: true,
				vectorizedAt: new Date(),
				indexedAt: new Date(),
				embeddingVersion: providerVersion,
				processingError: null,
			};

			await document.save();
			logger.info('Document knowledge processing completed successfully', {
				documentId: document._id.toString(),
				chunkCount: chunks.length,
				status: document.processingStatus,
			});

			return document;
		} catch (error) {
			logger.error('Document processing failed', { documentId: document._id.toString(), error: error.message });

			document.processingStatus = DOCUMENT_PROCESSING_STATUS.FAILED;
			document.metadata = {
				...(document.metadata || {}),
				processingError: error.message || 'Knowledge processing failed',
			};
			await document.save();

			throw error;
		}
	}

	function enqueueDocument(documentId) {
		if (!documentId) return null;

		return queue.enqueue({
			name: `process-document-${documentId}`,
			run: async () => {
				await Document.findByIdAndUpdate(documentId, {
					processingStatus: DOCUMENT_PROCESSING_STATUS.QUEUED,
				});
				return processDocument(documentId);
			},
		});
	}

	return { enqueueDocument, processDocument };
}

const documentProcessor = createDocumentProcessor();
export default documentProcessor;
