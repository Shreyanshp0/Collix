import intentPatternsConfig from '../../config/intentPatterns.json' with { type: 'json' };

const DEFAULT_THRESHOLD = intentPatternsConfig.scoreThreshold || 40;

/**
 * 100% Deterministic Intent Detector Service
 * Layered Scoring Engine: Regex Rules -> Keyword Dictionary -> Pattern Matching -> Weighted Scoring -> Intent
 * Operates with 0ms LLM latency and zero token consumption.
 */
export function createCapabilityDetector({ config = intentPatternsConfig } = {}) {
	const capabilitiesConfig = config.capabilities || {};

	function scorePromptForCapability(promptText, capKey) {
		const capData = capabilitiesConfig[capKey];
		if (!capData) return 0;

		let score = 0;
		const lowerPrompt = promptText.toLowerCase();

		// 1. Regex Rule Matching (High Weight boost)
		if (Array.isArray(capData.regexes)) {
			for (const regexStr of capData.regexes) {
				try {
					const regex = new RegExp(regexStr, 'i');
					if (regex.test(promptText)) {
						score += 60;
					}
				} catch {
					// Ignore invalid regex string if any
				}
			}
		}

		// 2. Keyword & Phrase Weight Scoring
		if (Array.isArray(capData.patterns)) {
			for (const patternObj of capData.patterns) {
				const kw = (patternObj.keyword || '').toLowerCase();
				if (!kw) continue;

				if (lowerPrompt.includes(kw)) {
					score += patternObj.weight || 30;
				}
			}
		}

		return score;
	}

	function detectIntent(promptText = '') {
		if (typeof promptText !== 'string' || !promptText.trim()) {
			return {
				intent: 'UNKNOWN',
				intents: [],
				confidence: 0,
				scores: {},
			};
		}

		const text = promptText.trim();
		const scores = {};
		const detectedIntents = [];

		for (const capKey of Object.keys(capabilitiesConfig)) {
			const score = scorePromptForCapability(text, capKey);
			scores[capKey] = score;

			if (score >= DEFAULT_THRESHOLD) {
				detectedIntents.push({ capKey, score });
			}
		}

		// Sort detected intents descending by score
		detectedIntents.sort((a, b) => b.score - a.score);

		const intentsList = detectedIntents.map((item) => item.capKey);
		const primaryIntent = intentsList[0] || 'UNKNOWN';

		// Calculate confidence (capped at 1.0)
		const highestScore = detectedIntents[0]?.score || 0;
		const confidence = Math.min(1.0, highestScore / 100);

		return {
			intent: primaryIntent,
			intents: intentsList,
			confidence: Number(confidence.toFixed(2)),
			scores,
		};
	}

	return { detectIntent, scorePromptForCapability };
}

const capabilityDetector = createCapabilityDetector();
export default capabilityDetector;
