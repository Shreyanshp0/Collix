import groqProvider from './groq.provider.js';
import { DependencyError } from '../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';
import { AI_CONFIG } from '../../config/ai.config.js';

export function createLlmProviderRegistry({ logger = defaultLogger } = {}) {
	assertLogger(logger);

	const providers = new Map([
		['groq', groqProvider],
	]);

	function getProvider(providerName = AI_CONFIG.provider) {
		const provider = providers.get(providerName.toLowerCase());
		if (!provider) {
			throw new DependencyError(`LLM provider "${providerName}" is not registered or supported`);
		}
		return provider;
	}

	async function generate({ prompt, systemPrompt, options = {}, tools = [] } = {}) {
		const targetProviderName = options.provider || AI_CONFIG.provider;
		const provider = getProvider(targetProviderName);
		return provider.generate({ prompt, systemPrompt, options, tools });
	}

	async function generateStream({ prompt, systemPrompt, onToken, options = {}, tools = [] } = {}) {
		const targetProviderName = options.provider || AI_CONFIG.provider;
		const provider = getProvider(targetProviderName);
		return provider.generateStream({ prompt, systemPrompt, onToken, options, tools });
	}

	function registerProvider(name, instance) {
		if (!instance || typeof instance.generate !== 'function') {
			throw new DependencyError('Invalid LLM provider instance');
		}
		providers.set(name.toLowerCase(), instance);
	}

	return { generate, generateStream, getProvider, registerProvider };
}

const llmProvider = createLlmProviderRegistry();
export default llmProvider;
