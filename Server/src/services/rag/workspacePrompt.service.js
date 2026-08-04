import crypto from 'node:crypto';
import PromptTemplate from '../../models/PromptTemplate.js';
import llmProvider from '../../providers/llm/index.js';
import defaultLogger from '../../utils/logger.js';

export function computeFingerprint(aiConfig = {}) {
	const normalized = {
		workspaceDomain: (aiConfig.workspaceDomain || 'general').trim().toLowerCase(),
		persona: (aiConfig.persona || 'mentor').trim().toLowerCase(),
		responseStyle: (aiConfig.responseStyle || 'balanced').trim().toLowerCase(),
		defaultMode: (aiConfig.defaultMode || 'hybrid').trim().toLowerCase(),
		creativity: (aiConfig.creativity || 'medium').trim().toLowerCase(),
		additionalInstructions: (aiConfig.additionalInstructions || '').trim(),
		capabilities: aiConfig.capabilities || {},
		metadata: aiConfig.metadata || {},
	};

	const jsonString = JSON.stringify(normalized, Object.keys(normalized).sort());
	return crypto.createHash('sha256').update(jsonString).digest('hex');
}

export function compileBehaviorToPrompt(behavior = {}, capabilities = {}, metadata = {}) {
	const lines = [];
	lines.push('# Workspace AI Identity & Directives');
	lines.push(`Identity: ${behavior.identity || 'Workspace Assistant'}`);
	if (behavior.tone) lines.push(`Tone: ${behavior.tone}`);
	if (behavior.responseStyle) lines.push(`Response Style: ${behavior.responseStyle}`);

	if (Array.isArray(behavior.expertise) && behavior.expertise.length > 0) {
		lines.push('\n## Core Expertise');
		behavior.expertise.forEach((item) => lines.push(`- ${item}`));
	}

	if (Array.isArray(behavior.rules) && behavior.rules.length > 0) {
		lines.push('\n## Workspace Specific Rules');
		behavior.rules.forEach((rule) => lines.push(`- ${rule}`));
	}

	if (behavior.customInstructions) {
		lines.push('\n## Custom Guidance');
		lines.push(behavior.customInstructions);
	}

	const activeCapabilities = Object.entries(capabilities || {})
		.filter(([, enabled]) => (typeof enabled === 'boolean' ? enabled : enabled?.enabled))
		.map(([cap]) => cap);

	const forbiddenCapabilities = Object.entries(capabilities || {})
		.filter(([, enabled]) => !(typeof enabled === 'boolean' ? enabled : enabled?.enabled))
		.map(([cap]) => cap);

	if (activeCapabilities.length > 0) {
		lines.push('\n## Allowed Capabilities');
		activeCapabilities.forEach((cap) => lines.push(`- Authorized: ${cap}`));
	}

	if (forbiddenCapabilities.length > 0) {
		lines.push('\n## Forbidden Capabilities');
		forbiddenCapabilities.forEach((cap) => lines.push(`- Forbidden: ${cap}`));
	}

	lines.push('\n## Workspace Policy & Violation Handling');
	lines.push('If a user requests any forbidden capability, politely refuse. Do NOT attempt partial compliance.');

	if (metadata && Object.keys(metadata).length > 0) {
		lines.push('\n## Workspace Context');
		if (metadata.industry) lines.push(`- Industry: ${metadata.industry}`);
		if (metadata.experienceLevel) lines.push(`- Experience Level: ${metadata.experienceLevel}`);
		if (metadata.preferredLanguage) lines.push(`- Preferred Language: ${metadata.preferredLanguage}`);
		if (metadata.timezone) lines.push(`- Timezone: ${metadata.timezone}`);
	}

	return lines.join('\n');
}

export async function getOrCreateWorkspacePrompt(aiConfig = {}, logger = defaultLogger) {
	const fingerprint = computeFingerprint(aiConfig);

	const existingTemplate = await PromptTemplate.findOne({ fingerprint });
	if (existingTemplate) {
		existingTemplate.usageCount += 1;
		await existingTemplate.save();
		logger.info('PromptTemplate cache hit!', { fingerprint, usageCount: existingTemplate.usageCount });
		return existingTemplate;
	}

	logger.info('PromptTemplate cache miss. Generating structured AI behavior...', { fingerprint });

	const metaPrompt = `
You are an expert AI Workspace Architect.
Generate structured behavior JSON for a workspace AI assistant based on these preferences:

Workspace Domain: ${aiConfig.workspaceDomain || 'general'}
Persona Role: ${aiConfig.persona || 'mentor'}
Response Style: ${aiConfig.responseStyle || 'balanced'}
Default Mode: ${aiConfig.defaultMode || 'hybrid'}
Additional Instructions: ${aiConfig.additionalInstructions || 'None'}

CRITICAL INSTRUCTIONS:
- Generate ONLY workspace-specific behavior.
- NEVER include global safety, Markdown formatting, or RAG citation policies in this JSON (those are handled globally).
- Output MUST be valid, strictly formatted JSON with NO surrounding text, explanation, or codeblocks.

JSON SCHEMA:
{
  "identity": "Brief single-sentence persona identity statement",
  "expertise": ["Key skill 1", "Key skill 2", "Key skill 3"],
  "tone": "Tone description (e.g. Professional, Encouraging, Analytical)",
  "responseStyle": "${aiConfig.responseStyle || 'Balanced'}",
  "rules": ["Rule 1", "Rule 2", "Rule 3"],
  "customInstructions": "${(aiConfig.additionalInstructions || '').replace(/"/g, "'")}"
}
`.trim();

	let behavior = {
		identity: `Workspace Assistant specializing in ${aiConfig.workspaceDomain || 'General Collaboration'} as a ${aiConfig.persona || 'Mentor'}.`,
		expertise: [aiConfig.workspaceDomain || 'General', aiConfig.persona || 'Assistant'],
		tone: 'Professional & Collaborative',
		responseStyle: aiConfig.responseStyle || 'Balanced',
		rules: ['Focus on domain best practices', 'Provide actionable insights'],
		customInstructions: aiConfig.additionalInstructions || '',
	};

	try {
		const metaResult = await llmProvider.generate({
			prompt: metaPrompt,
			options: { temperature: 0.2, maxTokens: 512 },
		});

		const rawContent = metaResult.text.replace(/```json/gi, '').replace(/```/g, '').trim();
		const parsed = JSON.parse(rawContent);
		if (parsed && parsed.identity) {
			behavior = { ...behavior, ...parsed };
		}
	} catch (err) {
		logger.warn('Failed to parse LLM behavior JSON, using structured fallback:', { error: err.message });
	}

	const compiledPrompt = compileBehaviorToPrompt(behavior, aiConfig.capabilities, aiConfig.metadata);

	const newTemplate = await PromptTemplate.create({
		fingerprint,
		preferences: aiConfig,
		behavior,
		compiledPrompt,
		generator: {
			provider: 'groq',
			model: 'llama-3.1-8b-instant',
			version: '2026-08',
		},
		promptVersion: 1,
		usageCount: 1,
	});

	logger.info('PromptTemplate generated and saved successfully', { id: newTemplate._id, fingerprint });
	return newTemplate;
}

export default {
	computeFingerprint,
	compileBehaviorToPrompt,
	getOrCreateWorkspacePrompt,
};
