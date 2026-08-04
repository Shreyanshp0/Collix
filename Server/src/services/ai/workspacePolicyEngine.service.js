import intentPatternsConfig from '../../config/intentPatterns.json' with { type: 'json' };
import defaultLogger, { assertLogger } from '../../utils/logger.js';
import AI_CONFIG from '../../config/ai.config.js';

export const RISK_LEVELS = Object.freeze({
	LOW: 'LOW',
	MEDIUM: 'MEDIUM',
	HIGH: 'HIGH',
	CRITICAL: 'CRITICAL',
});

const CAPABILITIES_METADATA = intentPatternsConfig.capabilities || {};

export function getCapabilityAliases(capKey) {
	return CAPABILITIES_METADATA[capKey]?.aliases || [capKey];
}

export function isCapabilityEnabledInConfig(aiConfiguration = {}, capKey) {
	const capabilities = aiConfiguration?.capabilities;

	// If no capabilities dictionary exists, default to allowing DOCUMENT_QA and IDEA_BRAINSTORMING
	if (!capabilities || typeof capabilities !== 'object' || Object.keys(capabilities).length === 0) {
		return capKey === 'DOCUMENT_QA' || capKey === 'IDEA_BRAINSTORMING';
	}

	const aliases = getCapabilityAliases(capKey);
	for (const alias of aliases) {
		const val = capabilities[alias];
		if (typeof val === 'boolean') {
			return val;
		}
		if (val && typeof val === 'object' && typeof val.enabled === 'boolean') {
			return val.enabled;
		}
	}

	return false;
}

export function getEnabledCapabilities(aiConfiguration = {}) {
	const enabled = [];
	for (const capKey of Object.keys(CAPABILITIES_METADATA)) {
		if (isCapabilityEnabledInConfig(aiConfiguration, capKey)) {
			enabled.push(capKey);
		}
	}
	return enabled;
}

export function getBlockedCapabilities(aiConfiguration = {}) {
	const blocked = [];
	for (const capKey of Object.keys(CAPABILITIES_METADATA)) {
		if (!isCapabilityEnabledInConfig(aiConfiguration, capKey)) {
			blocked.push(capKey);
		}
	}
	return blocked;
}

export function resolveMaxOutputTokens(requestedIntents = []) {
	if (!Array.isArray(requestedIntents) || requestedIntents.length === 0) {
		return AI_CONFIG.maxTokens || 1024;
	}

	let minTokens = Infinity;
	for (const capKey of requestedIntents) {
		const capMeta = CAPABILITIES_METADATA[capKey];
		if (capMeta && typeof capMeta.defaultMaxTokens === 'number') {
			minTokens = Math.min(minTokens, capMeta.defaultMaxTokens);
		}
	}

	return minTokens === Infinity ? AI_CONFIG.maxTokens || 1024 : minTokens;
}

export function createWorkspacePolicyEngine({ logger = defaultLogger } = {}) {
	assertLogger(logger);

	function authorizeRequest({
		userId,
		groupId,
		question = '',
		detectedResult = {},
		aiConfiguration = {},
		requestId = null,
	} = {}) {
		const requiredIntents = detectedResult.intents || [];
		const enabledCapabilities = getEnabledCapabilities(aiConfiguration);
		const blockedCapabilities = getBlockedCapabilities(aiConfiguration);

		// Check every required intent against workspace policy
		for (const reqCap of requiredIntents) {
			if (!isCapabilityEnabledInConfig(aiConfiguration, reqCap)) {
				const capMeta = CAPABILITIES_METADATA[reqCap] || {};
				const risk = capMeta.risk || RISK_LEVELS.MEDIUM;

				// Structured Audit Log Event (AI_CAPABILITY_DENIED)
				const auditPayload = {
					event: 'AI_CAPABILITY_DENIED',
					userId: userId || 'anonymous',
					groupId: groupId || 'unknown',
					intent: reqCap,
					risk,
					workspacePolicyVersion: 1,
					aiConfigurationVersion: 1,
					modelName: AI_CONFIG.model,
					requestId: requestId || `req_${Date.now()}`,
					timestamp: new Date().toISOString(),
					reason: 'Disabled by Workspace Administrator',
					promptLength: question.length,
				};

				logger.warn('AI Capability Authorization Denied (Workspace Policy Violation)', auditPayload);

				return {
					allowed: false,
					missingCapability: reqCap,
					risk,
					message: 'This workspace does not permit this type of AI request.',
					enabledCapabilities,
					blockedCapabilities,
					auditPayload,
				};
			}
		}

		// Authorization passed: calculate output token limit for allowed capabilities
		const maxTokens = resolveMaxOutputTokens(requiredIntents);

		return {
			allowed: true,
			maxTokens,
			enabledCapabilities,
			blockedCapabilities,
		};
	}

	return {
		authorizeRequest,
		isCapabilityEnabledInConfig,
		getEnabledCapabilities,
		getBlockedCapabilities,
		resolveMaxOutputTokens,
	};
}

const workspacePolicyEngine = createWorkspacePolicyEngine();
export default workspacePolicyEngine;
