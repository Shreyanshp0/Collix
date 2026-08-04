import { ValidationError } from '../../utils/AppError.js';
import { AI_CONFIG } from '../../config/ai.config.js';
import GLOBAL_SYSTEM_PROMPT from './prompts/global.prompt.js';

export const PROMPT_VERSION = AI_CONFIG.promptVersion || 'v1.0';

export function createPromptBuilder({ promptVersion = PROMPT_VERSION } = {}) {
	function formatRecentConversation(recentMessages = []) {
		if (!Array.isArray(recentMessages) || recentMessages.length === 0) {
			return 'No recent conversation history available.';
		}
		return recentMessages
			.map((msg) => {
				const senderName = msg.sender?.name || msg.sender?.username || (msg.type === 'ai' ? 'Collix AI' : 'User');
				const content = msg.message || '';
				const time = msg.createdAt ? new Date(msg.createdAt).toISOString() : '';
				return `[${time}] ${senderName}: ${content}`;
			})
			.join('\n');
	}

	function formatSemanticContext(retrievedChunks = []) {
		if (!Array.isArray(retrievedChunks) || retrievedChunks.length === 0) {
			return 'No relevant document or past message context found.';
		}
		return retrievedChunks
			.map((chunk, idx) => {
				const sourceLabel = chunk.metadata?.filename
					? `Document: ${chunk.metadata.filename}${chunk.metadata.page ? `, Page ${chunk.metadata.page}` : ''}`
					: `Message ID: ${chunk.metadata?.sourceId || 'chat'}`;
				return `[Source ${idx + 1} | ${sourceLabel}]\n${chunk.text}`;
			})
			.join('\n\n');
	}

	function buildPrompt({
		question,
		retrievedContext = [],
		recentMessages = [],
		groupName = '',
		workspacePrompt = '',
	} = {}) {
		if (typeof question !== 'string' || !question.trim()) {
			throw new ValidationError('A user question is required to build a prompt');
		}

		const formattedHistory = formatRecentConversation(recentMessages);
		const formattedContext = formatSemanticContext(retrievedContext);

		const systemPromptSections = [GLOBAL_SYSTEM_PROMPT];

		if (groupName) {
			systemPromptSections.push(`Active Group Workspace: "${groupName}"`);
		}

		if (workspacePrompt && workspacePrompt.trim()) {
			systemPromptSections.push(workspacePrompt.trim());
		}

		const systemPrompt = systemPromptSections.join('\n\n');

		const userPrompt = `Recent conversation:
${formattedHistory}

Relevant context from group documents and past discussion:
${formattedContext}

Question: ${question.trim()}`;

		return {
			systemPrompt,
			userPrompt,
			fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
			promptVersion,
		};
	}

	return { buildPrompt, promptVersion };
}

const promptBuilder = createPromptBuilder();
export default promptBuilder;
