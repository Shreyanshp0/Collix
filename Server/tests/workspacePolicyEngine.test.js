import test from 'node:test';
import assert from 'node:assert/strict';
import capabilityDetector from '../src/services/ai/capabilityDetector.service.js';
import workspacePolicyEngine, { RISK_LEVELS } from '../src/services/ai/workspacePolicyEngine.service.js';
import responsePolicy from '../src/services/ai/responsePolicy.service.js';

test('1. Capability Detector - Layered Scoring Engine', async (t) => {
	await t.test('detects direct & indirect code prompts (CODE_REVIEW)', () => {
		const result1 = capabilityDetector.detectIntent('Write a Java function to sort an array');
		assert.equal(result1.intent, 'CODE_REVIEW');
		assert.ok(result1.intents.includes('CODE_REVIEW'));

		const result2 = capabilityDetector.detectIntent('Show me an implementation of binary search');
		assert.equal(result2.intent, 'CODE_REVIEW');

		const result3 = capabilityDetector.detectIntent('Fix my React component bug');
		assert.equal(result3.intent, 'CODE_REVIEW');
	});

	await t.test('detects architecture review prompts (ARCHITECTURE_REVIEW)', () => {
		const result = capabilityDetector.detectIntent('Design a scalable backend microservices architecture');
		assert.equal(result.intent, 'ARCHITECTURE_REVIEW');
	});

	await t.test('detects resume review prompts (RESUME_REVIEW)', () => {
		const result = capabilityDetector.detectIntent('Please review my CV and give feedback on my work experience');
		assert.equal(result.intent, 'RESUME_REVIEW');
	});

	await t.test('detects career guidance prompts (CAREER_GUIDANCE)', () => {
		const result = capabilityDetector.detectIntent('What career path should I choose for software engineering interview prep?');
		assert.equal(result.intent, 'CAREER_GUIDANCE');
	});

	await t.test('detects document QA prompts (DOCUMENT_QA)', () => {
		const result = capabilityDetector.detectIntent('Summarize chapter 3 in the uploaded PDF file');
		assert.equal(result.intent, 'DOCUMENT_QA');
	});

	await t.test('detects brainstorming prompts (IDEA_BRAINSTORMING)', () => {
		const result = capabilityDetector.detectIntent('Brainstorm some startup project ideas');
		assert.equal(result.intent, 'IDEA_BRAINSTORMING');
	});

	await t.test('detects multi-intent combination prompts', () => {
		const result = capabilityDetector.detectIntent('Summarize this PDF and write a Python script for it');
		assert.ok(result.intents.includes('DOCUMENT_QA'));
		assert.ok(result.intents.includes('CODE_REVIEW'));
	});

	await t.test('returns UNKNOWN for neutral general prompts', () => {
		const result = capabilityDetector.detectIntent('Hello, how is the weather today?');
		assert.equal(result.intent, 'UNKNOWN');
		assert.equal(result.intents.length, 0);
	});
});

test('2. Workspace Policy Engine Authorization', async (t) => {
	const sampleConfig = {
		capabilities: {
			documentQA: true,
			brainstorming: true,
			codeReview: false,
			architectureReview: false,
			resumeReview: false,
			careerCoaching: false,
		},
	};

	await t.test('allows DOCUMENT_QA when enabled', () => {
		const intentResult = capabilityDetector.detectIntent('Summarize the document file');
		const auth = workspacePolicyEngine.authorizeRequest({
			userId: 'user123',
			groupId: 'group456',
			question: 'Summarize the document file',
			detectedResult: intentResult,
			aiConfiguration: sampleConfig,
		});
		assert.equal(auth.allowed, true);
	});

	await t.test('allows IDEA_BRAINSTORMING when enabled', () => {
		const intentResult = capabilityDetector.detectIntent('Brainstorm startup ideas');
		const auth = workspacePolicyEngine.authorizeRequest({
			userId: 'user123',
			groupId: 'group456',
			question: 'Brainstorm startup ideas',
			detectedResult: intentResult,
			aiConfiguration: sampleConfig,
		});
		assert.equal(auth.allowed, true);
		assert.equal(auth.maxTokens, 1200);
	});

	await t.test('blocks CODE_REVIEW when disabled', () => {
		const intentResult = capabilityDetector.detectIntent('Write a Python function to parse JSON');
		const auth = workspacePolicyEngine.authorizeRequest({
			userId: 'user123',
			groupId: 'group456',
			question: 'Write a Python function to parse JSON',
			detectedResult: intentResult,
			aiConfiguration: sampleConfig,
		});
		assert.equal(auth.allowed, false);
		assert.equal(auth.missingCapability, 'CODE_REVIEW');
		assert.equal(auth.risk, RISK_LEVELS.CRITICAL);
		assert.ok(auth.auditPayload);
		assert.equal(auth.auditPayload.event, 'AI_CAPABILITY_DENIED');
	});

	await t.test('blocks RESUME_REVIEW when disabled', () => {
		const intentResult = capabilityDetector.detectIntent('Improve my resume bullet points');
		const auth = workspacePolicyEngine.authorizeRequest({
			userId: 'user123',
			groupId: 'group456',
			question: 'Improve my resume bullet points',
			detectedResult: intentResult,
			aiConfiguration: sampleConfig,
		});
		assert.equal(auth.allowed, false);
		assert.equal(auth.missingCapability, 'RESUME_REVIEW');
		assert.equal(auth.risk, RISK_LEVELS.MEDIUM);
	});

	await t.test('blocks ARCHITECTURE_REVIEW when disabled', () => {
		const intentResult = capabilityDetector.detectIntent('Design a scalable database schema for microservices');
		const auth = workspacePolicyEngine.authorizeRequest({
			userId: 'user123',
			groupId: 'group456',
			question: 'Design a scalable database schema for microservices',
			detectedResult: intentResult,
			aiConfiguration: sampleConfig,
		});
		assert.equal(auth.allowed, false);
		assert.equal(auth.missingCapability, 'ARCHITECTURE_REVIEW');
		assert.equal(auth.risk, RISK_LEVELS.HIGH);
	});

	await t.test('blocks mixed request if any required capability is disabled', () => {
		const intentResult = capabilityDetector.detectIntent('Summarize this PDF document and generate Java code for it');
		const auth = workspacePolicyEngine.authorizeRequest({
			userId: 'user123',
			groupId: 'group456',
			question: 'Summarize this PDF document and generate Java code for it',
			detectedResult: intentResult,
			aiConfiguration: sampleConfig,
		});
		assert.equal(auth.allowed, false);
		assert.equal(auth.missingCapability, 'CODE_REVIEW');
	});
});

test('3. Defense-in-Depth Response Policy Scanner', async (t) => {
	const codeDisabledConfig = { capabilities: { codeReview: false } };
	const codeEnabledConfig = { capabilities: { codeReview: true } };

	await t.test('scans and blocks fenced code blocks when code review is disabled', () => {
		const text = 'Here is the function:\n```javascript\nconst x = 10;\n```';
		const check = responsePolicy.validateResponse({ responseText: text, aiConfiguration: codeDisabledConfig });
		assert.equal(check.violatesPolicy, true);
		assert.equal(check.sanitizedResponse, 'This response violates workspace policy.');
	});

	await t.test('scans and blocks unfenced imports, classes, and SQL queries', () => {
		const unfenced1 = 'Use import React from "react"; to create your component.';
		const check1 = responsePolicy.validateResponse({ responseText: unfenced1, aiConfiguration: codeDisabledConfig });
		assert.equal(check1.violatesPolicy, true);

		const unfenced2 = 'SELECT * FROM users WHERE active = true';
		const check2 = responsePolicy.validateResponse({ responseText: unfenced2, aiConfiguration: codeDisabledConfig });
		assert.equal(check2.violatesPolicy, true);

		const unfenced3 = 'docker compose up -d';
		const check3 = responsePolicy.validateResponse({ responseText: unfenced3, aiConfiguration: codeDisabledConfig });
		assert.equal(check3.violatesPolicy, true);
	});

	await t.test('passes code content through when code review is enabled', () => {
		const text = '```javascript\nfunction hello() {}\n```';
		const check = responsePolicy.validateResponse({ responseText: text, aiConfiguration: codeEnabledConfig });
		assert.equal(check.violatesPolicy, false);
	});
});
