import ragRetriever from './retriever.js';
import promptBuilder from './promptBuilder.js';
import llmProvider from '../../providers/llm/index.js';
import messageService from '../message.services.js';
import Group from '../../models/Group.js';
import { toMessageDto } from '../../mappers/message.mapper.js';
import { ValidationError } from '../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';
import { AI_CONFIG } from '../../config/ai.config.js';
import { getIO } from '../../socket/index.js';

/**
 * AI Orchestrator Service
 * Responsible for orchestrating AI chat requests:
 * - Security & Group membership validation
 * - Semantic retrieval & Short-term conversation history memory
 * - Provider-agnostic prompt generation with versioning
 * - Normalized LLM invocation (Groq / multi-provider)
 * - AI message persistence & Citation mapping
 * - Real-time Socket.IO streaming event dispatches
 * 
 * Future Capability Extension Points:
 * - Multi-model routing (via options.provider / options.model)
 * - Tool/function calling (via options.tools & llmResponse.toolCalls)
 * - Multiple AI assistants (via options.assistantId / options.assistantConfig)
 * - Cross-group AI memory (via options.crossGroupMemory)
 * - Multimodal input / Image understanding (via options.attachments)
 * - Agent workflow execution (via options.agentWorkflow)
 */
export function createAiOrchestrator({
	retriever = ragRetriever,
	prompter = promptBuilder,
	llm = llmProvider,
	messages = messageService,
	logger = defaultLogger,
} = {}) {
	assertLogger(logger);

	async function ask({ groupId, question, userId, options = {}, onEvent } = {}) {
		const startTime = Date.now();

		function emitEvent(event, data) {
			if (typeof onEvent === 'function') {
				try {
					onEvent({ event, data });
				} catch (err) {
					logger.error('Error in AI orchestrator event listener', { error: err });
				}
			}
		}

		// 1. Security & Validation
		if (!groupId) throw new ValidationError('Group ID is required');
		if (!question || typeof question !== 'string' || !question.trim()) {
			throw new ValidationError('Question content is required');
		}
		if (!userId) throw new ValidationError('Authenticated user ID is required');

		// Validate group membership before retrieval
		await messages.requireMembership(groupId, userId);

		try {
			// Notify socket/listener of thinking start
			emitEvent('ai:thinking', { phase: 'retrieving_context', groupId });

			// 2. Fetch Group details for prompt context & workspace AI settings
			const group = await Group.findById(groupId).select('name aiConfiguration promptTemplate').populate('promptTemplate').lean();
			const groupName = group?.name || '';
			const workspacePrompt = group?.promptTemplate?.compiledPrompt || '';

			// 3. Separate Retrieval Calls
			// a) Semantic Retrieval (Documents & past vector messages)
			const semanticResult = await retriever.retrieveSemanticContext({
				query: question.trim(),
				groupId,
				options,
			});

			// b) Short-term Conversation Memory Retrieval (Last N messages from MongoDB)
			const recentLimit = options.recentMessagesLimit || AI_CONFIG.retrieval.recentMessagesLimit;
			const recentMessages = await messages.getRecentConversation({ groupId, limit: recentLimit });

			// 4. Provider-Agnostic Prompt Construction
			const { systemPrompt, userPrompt, promptVersion } = prompter.buildPrompt({
				question: question.trim(),
				retrievedContext: semanticResult.chunks,
				recentMessages,
				groupName,
				workspacePrompt,
				assistantName: options.assistantName || AI_CONFIG.identity.displayName,
			});

			emitEvent('ai:thinking', { phase: 'generating_response', groupId });

			// 5. LLM Invocation with Normalization
			let llmResponse;
			const tools = options.tools || []; // Extension point for future tool calling

			if (options.stream) {
				llmResponse = await llm.generateStream({
					prompt: userPrompt,
					systemPrompt,
					onToken: (delta) => emitEvent('ai:delta', { delta, groupId }),
					options,
					tools,
				});
			} else {
				llmResponse = await llm.generate({
					prompt: userPrompt,
					systemPrompt,
					options,
					tools,
				});
			}

			const processingTime = Date.now() - startTime;

			// Calculate multi-signal confidence based on top-3 average vector similarity of passing chunks
			const passingCitations = (semanticResult.citations || []).filter(
				(c) => typeof c.similarityScore === 'number' && c.similarityScore >= 0.5,
			);
			const topScores = passingCitations
				.map((c) => c.similarityScore)
				.slice(0, 3);

			let confidenceLevel = 'LOW';
			let confidenceScore = 0;
			if (semanticResult.passingCount > 0 && topScores.length > 0) {
				const avgScore = topScores.reduce((sum, s) => sum + s, 0) / topScores.length;
				confidenceScore = Math.round(avgScore * 100) / 100;
				if (avgScore >= 0.75) confidenceLevel = 'HIGH';
				else if (avgScore >= 0.68) confidenceLevel = 'MEDIUM';
				else confidenceLevel = 'LOW';
			}

			const confidence = {
				level: confidenceLevel,
				score: confidenceScore,
			};

			// 6. Structured AI Metadata with Clean Citations & Prompt Versioning
			const aiMetadata = {
				provider: llmResponse.provider || options.provider || AI_CONFIG.provider,
				model: llmResponse.model || options.model || AI_CONFIG.model,
				displayName: options.assistantName || AI_CONFIG.identity.displayName || 'Nexus AI',
				promptVersion,
				confidence,
				citations: semanticResult.citations,
				sources: semanticResult.citations,
				ai: true,
				processingTime,
				usage: llmResponse.usage || null,
			};

			// 7. Persist AI Message to MongoDB
			const savedMessage = await messages.createMessage({
				groupId,
				senderId: null,
				message: llmResponse.text,
				type: 'ai',
				aiMetadata,
			});

			const messageDto = toMessageDto(savedMessage, {
				author: {
					id: 'nexus_ai',
					_id: 'nexus_ai',
					name: 'Nexus AI',
					username: 'nexus_ai',
					type: 'ai',
					status: 'online',
				},
			});

			// 8. Broadcast Realtime Socket Events
			const io = getIO();
			if (io) {
				io.to(groupId).emit('new-message', messageDto);
			}
			emitEvent('new-message', messageDto);
			emitEvent('ai:complete', {
				message: messageDto,
				answer: llmResponse.text,
				confidence,
				sources: semanticResult.citations,
				groupId,
			});

			return {
				message: messageDto,
				answer: llmResponse.text,
				confidence,
				sources: semanticResult.citations,
				aiMetadata,
			};
		} catch (error) {
			logger.error('AI Orchestration failed', { error, groupId, userId });
			emitEvent('ai:error', {
				error: { code: error.code || 'AI_ORCHESTRATION_ERROR', message: error.message },
				groupId,
			});
			throw error;
		}
	}

	return { ask };
}

const aiOrchestrator = createAiOrchestrator();
export default aiOrchestrator;
