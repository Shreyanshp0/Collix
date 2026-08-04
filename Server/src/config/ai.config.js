import dotenv from 'dotenv';

dotenv.config();

export const AI_CONFIG = Object.freeze({
	provider: process.env.AI_PROVIDER || 'groq',
	model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
	temperature: parseFloat(process.env.AI_TEMPERATURE || '0.2'),
	maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1024', 10),
	topP: parseFloat(process.env.AI_TOP_P || '1.0'),
	timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10),

	// RAG & Retrieval parameters
	retrieval: Object.freeze({
		similarityThreshold: parseFloat(process.env.AI_SIMILARITY_THRESHOLD || '0.5'),
		candidateLimit: parseInt(process.env.AI_CANDIDATE_LIMIT || '10', 10),
		contextChunkLimit: parseInt(process.env.AI_CONTEXT_CHUNK_LIMIT || '4', 10),
		recentMessagesLimit: parseInt(process.env.AI_RECENT_MESSAGES_LIMIT || '15', 10),
	}),

	// Identity & Metadata
	identity: Object.freeze({
		displayName: 'Collix AI',
		type: 'ai',
	}),

	// Versioning
	promptVersion: 'v1.0',
});

export default AI_CONFIG;
