import { DependencyError, ValidationError } from '../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';

export function createEmbeddingsProvider({ embed, logger = defaultLogger } = {}) {
	assertLogger(logger);
	if (typeof embed !== 'function') throw new DependencyError('An embeddings provider must supply an embed function');

	async function createEmbedding({ text }) {
		if (typeof text !== 'string' || !text.trim()) throw new ValidationError('Text is required for embedding');
		try {
			const vector = await embed(text);
			if (!Array.isArray(vector) || !vector.length || !vector.every(Number.isFinite)) {
				throw new DependencyError('Embeddings provider returned an invalid vector');
			}
			return vector;
		} catch (error) {
			logger.error('Embedding generation failed', { error });
			throw error;
		}
	}

	return { createEmbedding };
}
