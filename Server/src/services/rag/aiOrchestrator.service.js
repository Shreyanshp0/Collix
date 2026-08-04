import ragRetriever from './retriever.js';
import promptBuilder from './promptBuilder.js';
import llmProvider from '../../providers/llm/index.js';
import messageService from '../message.services.js';
import Group from '../../models/Group.js';
import { toMessageDto } from '../../mappers/message.mapper.js';
import { ValidationError, WorkspacePolicyViolation } from '../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';
import { AI_CONFIG } from '../../config/ai.config.js';
import { getIO } from '../../socket/index.js';
import eventBus from '../eventBus.service.js';
import capabilityDetector from '../ai/capabilityDetector.service.js';
import workspacePolicyEngine from '../ai/workspacePolicyEngine.service.js';
import responsePolicy from '../ai/responsePolicy.service.js';

/**
 * AI Orchestrator Service
 * Responsible for orchestrating AI chat requests:
 * - Security & Group membership validation
 * - Backend AI capability authorization & Workspace Policy Engine check BEFORE LLM/RAG
 * - Semantic retrieval & Short-term conversation history memory
 * - Provider-agnostic prompt generation with versioning
 * - Normalized LLM invocation (Groq / multi-provider)
 * - Defense-in-depth response policy validation
 * - AI message persistence & Citation mapping
 * - Real-time Socket.IO streaming event dispatches
 */
export function createAiOrchestrator({
	retriever = ragRetriever,
	prompter = promptBuilder,
	llm = llmProvider,
	messages = messageService,
	detector = capabilityDetector,
	policyEngine = workspacePolicyEngine,
	responsePolicyScanner = responsePolicy,
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

		// Validate group membership before processing
		await messages.requireMembership(groupId, userId);

		// 2. Fetch Group details for workspace AI configuration & prompt template
		const group = await Group.findById(groupId)
			.select('name aiConfiguration promptTemplate')
			.populate('promptTemplate')
			.lean();
		const groupName = group?.name || '';
		const workspacePrompt = group?.promptTemplate?.compiledPrompt || '';

		// 3. BACKEND POLICY AUTHORIZATION CHECK (EXECUTIVE RULE: BEFORE RAG RETRIEVAL & BEFORE GROQ)
		const intentResult = detector.detectIntent(question.trim());
		const authResult = policyEngine.authorizeRequest({
			userId,
			groupId,
			question: question.trim(),
			detectedResult: intentResult,
			aiConfiguration: group?.aiConfiguration,
			requestId: options.requestId,
		});

		if (!authResult.allowed) {
			const policyViolationErr = new WorkspacePolicyViolation({
				requiredCapability: authResult.missingCapability,
				enabledCapabilities: authResult.enabledCapabilities,
				blockedCapabilities: authResult.blockedCapabilities,
				risk: authResult.risk,
				message: authResult.message,
			});

			emitEvent('ai:error', {
				code: 'CAPABILITY_DENIED',
				message: policyViolationErr.message,
				requiredCapability: authResult.missingCapability,
				enabledCapabilities: authResult.enabledCapabilities,
				blockedCapabilities: authResult.blockedCapabilities,
				risk: authResult.risk,
			});

			throw policyViolationErr;
		}

		// Apply capability max token limit if specified
		const mergedOptions = {
			...options,
			maxTokens: authResult.maxTokens || options.maxTokens || AI_CONFIG.maxTokens,
		};

		try {
			// Notify socket/listener of thinking start
			emitEvent('ai:thinking', { phase: 'retrieving_context', groupId });

			// 4. Separate Retrieval Calls
			// a) Semantic Retrieval (Documents & past vector messages)
			const semanticResult = await retriever.retrieveSemanticContext({
				query: question.trim(),
				groupId,
				options: mergedOptions,
			});

			// b) Short-term Conversation Memory Retrieval (Last N messages from MongoDB)
			const recentLimit = mergedOptions.recentMessagesLimit || AI_CONFIG.retrieval.recentMessagesLimit;
			const recentMessages = await messages.getRecentConversation({ groupId, limit: recentLimit });

			// 5. Provider-Agnostic Prompt Construction
			const { systemPrompt, userPrompt, promptVersion } = prompter.buildPrompt({
				question: question.trim(),
				retrievedContext: semanticResult.chunks,
				recentMessages,
				groupName,
				workspacePrompt,
				assistantName: mergedOptions.assistantName || AI_CONFIG.identity.displayName,
			});

			emitEvent('ai:thinking', { phase: 'generating_response', groupId });

			// 6. LLM Invocation with Normalization
			let llmResponse;
			const tools = mergedOptions.tools || []; // Extension point for future tool calling

			if (mergedOptions.stream) {
				llmResponse = await llm.generateStream({
					prompt: userPrompt,
					systemPrompt,
					onToken: (delta) => emitEvent('ai:delta', { delta, groupId }),
					options: mergedOptions,
					tools,
				});
			} else {
				llmResponse = await llm.generate({
					prompt: userPrompt,
					systemPrompt,
					options: mergedOptions,
					tools,
				});
			}

			// 7. Post-LLM Defense-In-Depth Response Validation Scan
			const responseCheck = responsePolicyScanner.validateResponse({
				responseText: llmResponse.text,
				aiConfiguration: group?.aiConfiguration,
			});

			if (responseCheck.violatesPolicy) {
				llmResponse.text = responseCheck.sanitizedResponse;
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

			// 8. Structured AI Metadata with Clean Citations & Prompt Versioning
			const aiMetadata = {
				provider: llmResponse.provider || mergedOptions.provider || AI_CONFIG.provider,
				model: llmResponse.model || mergedOptions.model || AI_CONFIG.model,
				displayName: mergedOptions.assistantName || AI_CONFIG.identity.displayName || 'Collix AI',
				promptVersion,
				confidence,
				citations: semanticResult.citations,
				sources: semanticResult.citations,
				ai: true,
				processingTime,
				usage: llmResponse.usage || null,
			};

			// 9. Persist AI Message to MongoDB
			const savedMessage = await messages.createMessage({
				groupId,
				senderId: null,
				message: llmResponse.text,
				type: 'ai',
				aiMetadata,
			});

			const messageDto = toMessageDto(savedMessage, {
				author: {
					id: 'collix_ai',
					_id: 'collix_ai',
					name: 'Collix AI',
					username: 'collix_ai',
					type: 'ai',
					status: 'online',
				},
			});

			// 10. Broadcast Realtime Socket Events & Notifications
			const io = getIO();
			if (io) {
				io.to(groupId).emit('new-message', messageDto);
			}

			emitEvent('ai:complete', {
				message: messageDto,
				answer: llmResponse.text,
				confidence,
				sources: semanticResult.citations,
				aiMetadata,
			});

			eventBus.emit('AI_RESPONSE_READY', {
				groupId,
				askedBy: userId,
				messageId: savedMessage._id.toString(),
				text: llmResponse.text,
			});

			return {
				message: messageDto,
				answer: llmResponse.text,
				confidence,
				sources: semanticResult.citations,
				aiMetadata,
			};
		} catch (err) {
			logger.error('Error during AI orchestration processing:', { error: err, groupId, userId });
			emitEvent('ai:error', { message: err.message });
			throw err;
		}
	}

	return { ask };
}

const aiOrchestrator = createAiOrchestrator();
export default aiOrchestrator;
