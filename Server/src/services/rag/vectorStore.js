import { DependencyError } from '../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';

export function createVectorStore({ upsert, search, remove, logger = defaultLogger } = {}) {
	assertLogger(logger);
	if (typeof upsert !== 'function' || typeof search !== 'function' || typeof remove !== 'function') {
		throw new DependencyError('Vector store must supply upsert, search, and remove functions');
	}

	async function upsertChunks(chunks) {
		return upsert(chunks);
	}

	async function findSimilar({ vector, filter, limit }) {
		return search({ vector, filter, limit });
	}

	async function removeVectors(vectorIds) {
		return remove(vectorIds);
	}

	return { findSimilar, removeVectors, upsertChunks };
}
