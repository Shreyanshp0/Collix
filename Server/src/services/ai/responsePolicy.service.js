import { isCapabilityEnabledInConfig } from './workspacePolicyEngine.service.js';

const PROHIBITED_CODE_PATTERNS = [
	/```[\s\S]*?```/m, // Fenced code blocks
	/\bimport\s+[\w{}*,\s]+\s+from\s+['"][^'"]+['"]/i, // ES imports (import React from 'react')
	/\bimport\s+[\w.*]+;/i, // Java/Python imports
	/\bpublic\s+(class|interface|enum|static)\s+\w+/i, // Java/C# class definition
	/\bdef\s+\w+\s*\([^)]*\)\s*:/i, // Python function definition
	/\bfunction\s+\w+\s*\([^)]*\)\s*\{/i, // JS function definition
	/\bconst\s+\w+\s*=\s*\([^)]*\)\s*=>/i, // JS arrow function
	/\bSELECT\s+[\s\S]+?\s+FROM\s+[\w.]+/i, // SQL SELECT query
	/\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/i, // SQL mutation queries
	/\bnpm\s+(install|i|run|build)\b/i, // npm command
	/\bdocker\s+(compose|run|build|exec)\b/i, // Docker command
	/\bdockerfile\b/i, // Dockerfile
	/\bkubectl\s+(apply|get|delete|exec|logs)\b/i, // kubectl command
	/^\s*<!DOCTYPE\s+html>/i, // HTML document
	/^\s*<\?xml\s+/i, // XML header
	/<(div|span|button|input|form|script|style)[\s>]/i, // HTML/JSX tags
	/^#!\/(bin|usr\/bin)\/(bash|sh|zsh|python)/m, // Shell shebang
	/\bSet-ExecutionPolicy\b/i, // PowerShell policy
];

export function createResponsePolicy() {
	function containsProhibitedCode(text = '') {
		if (typeof text !== 'string' || !text.trim()) return false;

		for (const pattern of PROHIBITED_CODE_PATTERNS) {
			if (pattern.test(text)) {
				return true;
			}
		}
		return false;
	}

	function validateResponse({ responseText = '', aiConfiguration = {} } = {}) {
		const isCodeAllowed = isCapabilityEnabledInConfig(aiConfiguration, 'CODE_REVIEW');

		// If code review is enabled, no policy block on code responses
		if (isCodeAllowed) {
			return { violatesPolicy: false };
		}

		// If code review is DISABLED, scan output for code signatures
		if (containsProhibitedCode(responseText)) {
			return {
				violatesPolicy: true,
				sanitizedResponse: 'This response violates workspace policy.',
			};
		}

		return { violatesPolicy: false };
	}

	return { validateResponse, containsProhibitedCode };
}

const responsePolicy = createResponsePolicy();
export default responsePolicy;
