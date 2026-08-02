import { DependencyError, ValidationError } from '../../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../../utils/logger.js';

function createDeterministicVector(text) {
	const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
	const vector = Array.from({ length: 8 }, (_, index) => {
		const token = words[index % words.length] || 'token';
		const code = token.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
		return ((code + index) % 17) / 17;
	});
	return vector;
}

export function createDeterministicEmbeddingsProvider({ logger = defaultLogger } = {}) {
	assertLogger(logger);

	async function createEmbedding({ text }) {
		if (typeof text !== 'string' || !text.trim()) {
			throw new ValidationError('Text is required for embedding');
		}
		return createDeterministicVector(text);
	}

	return { createEmbedding };
}

export function createEmbeddingsProvider({ implementation = 'deterministic', embed, logger = defaultLogger } = {}) {
	assertLogger(logger);
	if (typeof embed === 'function') {
		return { createEmbedding: async ({ text }) => embed(text) };
	}

	if (implementation !== 'deterministic') {
		throw new DependencyError(`Embeddings implementation "${implementation}" is not available yet`);
	}

	return createDeterministicEmbeddingsProvider({ logger });
}

const embeddingsProvider = createEmbeddingsProvider();

export default embeddingsProvider;
