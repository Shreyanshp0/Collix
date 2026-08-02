import embeddingsProvider from './providers/embeddings.provider.js';
import vectorStoreProvider from './providers/vectorStore.provider.js';
import { toCitationDtoList } from '../../mappers/citation.mapper.js';
import { ValidationError } from '../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';
import { AI_CONFIG } from '../../config/ai.config.js';

export function createRagRetriever({
	embeddings = embeddingsProvider,
	vectorStore = vectorStoreProvider,
	logger = defaultLogger,
} = {}) {
	assertLogger(logger);

	if (!embeddings?.createEmbedding || !vectorStore?.findSimilar) {
		throw new TypeError('Retriever requires embeddings and vectorStore providers');
	}

	async function retrieveSemanticContext({ query, groupId, options = {} }) {
		if (typeof query !== 'string' || !query.trim()) {
			throw new ValidationError('A query is required for retrieval');
		}
		if (!groupId) {
			throw new ValidationError('Group ID is required for retrieval');
		}

		const threshold = options.similarityThreshold ?? AI_CONFIG.retrieval.similarityThreshold;
		const limit = options.candidateLimit ?? AI_CONFIG.retrieval.candidateLimit;
		const chunkLimit = options.contextChunkLimit ?? AI_CONFIG.retrieval.contextChunkLimit;

		// 1. Embed query
		const queryVector = await embeddings.createEmbedding({ text: query.trim() });

		// 2. Search FAISS / vector store for this group
		const rawResults = await vectorStore.findSimilar({
			vector: queryVector,
			filter: { groupId: groupId.toString() },
			limit,
		});

		const safeResults = Array.isArray(rawResults) ? rawResults : [];

		// 3. Apply similarity threshold filter
		const passingResults = safeResults.filter((item) => (item.similarityScore ?? 0) >= threshold);

		// 4. Select top candidates up to contextChunkLimit
		const selectedResults = passingResults.slice(0, chunkLimit);

		// 5. Extract context chunks and safe citations
		const chunks = selectedResults.map((item) => ({
			text: item.text,
			metadata: {
				sourceType: item.metadata?.sourceType,
				filename: item.metadata?.filename,
				page: item.metadata?.page,
				sourceId: item.metadata?.sourceId,
			},
		}));

		const citations = toCitationDtoList(selectedResults);

		return {
			chunks,
			citations,
			passingCount: passingResults.length,
			totalCandidates: safeResults.length,
		};
	}

	return { retrieveSemanticContext };
}

const ragRetriever = createRagRetriever();
export default ragRetriever;
