import { createHash } from 'node:crypto';
import { DependencyError } from '../../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../../utils/logger.js';

function normalizeVector(vector) {
	const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + (value * value), 0));
	if (!magnitude) return vector;
	return vector.map((value) => value / magnitude);
}

function cosineSimilarity(left, right) {
	const normalizedLeft = normalizeVector(left);
	const normalizedRight = normalizeVector(right);
	return normalizedLeft.reduce((sum, value, index) => sum + (value * normalizedRight[index]), 0);
}

function matchesFilter(record, filter = {}) {
	return Object.entries(filter).every(([key, value]) => String(record.metadata?.[key] ?? record[key]) === String(value));
}

export function createInMemoryVectorStoreProvider({ logger = defaultLogger } = {}) {
	assertLogger(logger);
	const indexes = new Map();

	function getGroupStore(groupId) {
		const key = groupId?.toString?.() || 'default';
		if (!indexes.has(key)) indexes.set(key, []);
		return indexes.get(key);
	}

	async function upsertChunks(chunks) {
		const groupId = chunks[0]?.metadata?.groupId?.toString?.() || 'default';
		const store = getGroupStore(groupId);
		const ids = [];
		for (const chunk of chunks) {
			const vectorId = createHash('sha1').update(`${groupId}:${chunk.metadata?.sourceId || 'unknown'}:${chunk.metadata?.chunkIndex || 0}`).digest('hex');
			store.push({
				id: vectorId,
				text: chunk.content,
				metadata: chunk.metadata,
				vector: chunk.vector,
			});
			ids.push(vectorId);
		}
		return ids;
	}

	async function findSimilar({ vector, filter = {}, limit = 5 }) {
		const groupId = filter.groupId?.toString?.() || 'default';
		const store = getGroupStore(groupId);
		return store
			.filter((entry) => matchesFilter(entry, filter))
			.map((entry) => ({
				text: entry.text,
				metadata: entry.metadata,
				similarityScore: cosineSimilarity(vector, entry.vector),
				vectorId: entry.id,
			}))
			.sort((left, right) => right.similarityScore - left.similarityScore)
			.slice(0, limit);
	}

	async function removeVectors(vectorIds = []) {
		for (const [groupId, store] of indexes.entries()) {
			const nextStore = store.filter((entry) => !vectorIds.includes(entry.id));
			indexes.set(groupId, nextStore);
		}
		return true;
	}

	return { findSimilar, removeVectors, upsertChunks };
}

export function createVectorStoreProvider({ implementation = 'memory', logger = defaultLogger } = {}) {
	assertLogger(logger);
	if (implementation !== 'memory') {
		throw new DependencyError(`Vector store implementation "${implementation}" is not available yet`);
	}

	return createInMemoryVectorStoreProvider({ logger });
}

const vectorStoreProvider = createVectorStoreProvider();

export default vectorStoreProvider;
