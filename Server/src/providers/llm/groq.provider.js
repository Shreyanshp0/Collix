import Groq from 'groq-sdk';
import { DependencyError, ValidationError } from '../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';
import { AI_CONFIG } from '../../config/ai.config.js';

export function createGroqProvider({ apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API, logger = defaultLogger } = {}) {
	assertLogger(logger);

	if (!apiKey) {
		logger.warn('Groq API key is missing from environment variables');
	}

	const groq = apiKey ? new Groq({ apiKey }) : null;

	async function generate({ prompt, systemPrompt, options = {}, tools = [] } = {}) {
		if (!groq) {
			throw new DependencyError('Groq API key is not configured');
		}
		if (typeof prompt !== 'string' || !prompt.trim()) {
			throw new ValidationError('Prompt text is required for generation');
		}

		const model = options.model || AI_CONFIG.model;
		const temperature = options.temperature ?? AI_CONFIG.temperature;
		const maxTokens = options.maxTokens ?? AI_CONFIG.maxTokens;
		const topP = options.topP ?? AI_CONFIG.topP;

		const messages = [];
		if (systemPrompt && typeof systemPrompt === 'string') {
			messages.push({ role: 'system', content: systemPrompt });
		}
		messages.push({ role: 'user', content: prompt });

		const reqPayload = {
			messages,
			model,
			temperature,
			max_completion_tokens: maxTokens,
			top_p: topP,
		};

		// Extension point for future tools/function calling without active execution
		if (Array.isArray(tools) && tools.length > 0) {
			reqPayload.tools = tools;
		}

		try {
			const completion = await groq.chat.completions.create(reqPayload);
			const choice = completion.choices?.[0];
			const text = choice?.message?.content || '';

			return {
				text,
				usage: {
					promptTokens: completion.usage?.prompt_tokens || 0,
					completionTokens: completion.usage?.completion_tokens || 0,
					totalTokens: completion.usage?.total_tokens || 0,
				},
				finishReason: choice?.finish_reason || 'stop',
				model: completion.model || model,
				provider: 'groq',
				toolCalls: choice?.message?.tool_calls || null, // Extension point
			};
		} catch (error) {
			logger.error('Groq LLM generation failed', { error: error.message || error });
			throw new DependencyError(`Groq LLM service failed: ${error.message || 'Unknown error'}`);
		}
	}

	async function generateStream({ prompt, systemPrompt, onToken, options = {}, tools = [] } = {}) {
		if (!groq) {
			throw new DependencyError('Groq API key is not configured');
		}
		if (typeof prompt !== 'string' || !prompt.trim()) {
			throw new ValidationError('Prompt text is required for generation');
		}

		const model = options.model || AI_CONFIG.model;
		const temperature = options.temperature ?? AI_CONFIG.temperature;
		const maxTokens = options.maxTokens ?? AI_CONFIG.maxTokens;
		const topP = options.topP ?? AI_CONFIG.topP;

		const messages = [];
		if (systemPrompt && typeof systemPrompt === 'string') {
			messages.push({ role: 'system', content: systemPrompt });
		}
		messages.push({ role: 'user', content: prompt });

		const reqPayload = {
			messages,
			model,
			temperature,
			max_completion_tokens: maxTokens,
			top_p: topP,
			stream: true,
		};

		if (Array.isArray(tools) && tools.length > 0) {
			reqPayload.tools = tools;
		}

		try {
			const stream = await groq.chat.completions.create(reqPayload);
			let accumulatedText = '';

			for await (const chunk of stream) {
				const delta = chunk.choices?.[0]?.delta?.content || '';
				if (delta) {
					accumulatedText += delta;
					if (typeof onToken === 'function') {
						onToken(delta);
					}
				}
			}

			return {
				text: accumulatedText,
				usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
				finishReason: 'stop',
				model,
				provider: 'groq',
			};
		} catch (error) {
			logger.error('Groq LLM streaming failed', { error: error.message || error });
			throw new DependencyError(`Groq LLM streaming failed: ${error.message || 'Unknown error'}`);
		}
	}

	return { generate, generateStream };
}

const groqProvider = createGroqProvider();
export default groqProvider;
