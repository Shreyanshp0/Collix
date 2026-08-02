import { ValidationError } from '../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';

export function createRagRetriever({ embeddings, vectorStore, logger = defaultLogger } = {}) {
	assertLogger(logger);
	if (!embeddings?.createEmbedding || !vectorStore?.findSimilar) throw new TypeError('Retriever requires embeddings and vectorStore providers');

	async function retrieveContext({ query, groupId, limit = 5 }) {
		if (typeof query !== 'string' || !query.trim()) throw new ValidationError('A query is required');
		if (!groupId) throw new ValidationError('Group ID is required');
		const vector = await embeddings.createEmbedding({ text: query });
		const results = await vectorStore.findSimilar({ vector, filter: { groupId: groupId.toString() }, limit });
		return { sources: Array.isArray(results) ? results : [] };
	}

	return { retrieveContext };
}
