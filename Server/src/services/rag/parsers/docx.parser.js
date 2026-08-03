import { ValidationError } from '../../../utils/AppError.js';

let mammothModule = null;
try {
	const mod = await import('mammoth');
	mammothModule = mod.default || mod;
} catch (e) {
	// mammoth optional dependency not loaded
}

export function createDocxParser({ mammoth = mammothModule } = {}) {
	async function parse({ content }) {
		if (!content || (typeof content !== 'string' && !Buffer.isBuffer(content) && !(content instanceof Uint8Array))) {
			throw new ValidationError('DOCX parser requires binary or string content');
		}

		if (mammoth?.extractRawText) {
			try {
				const result = await mammoth.extractRawText({ buffer: content });
				if (typeof result?.value === 'string' && result.value.trim()) {
					return result.value;
				}
			} catch (e) {
				// Fallback if mammoth fails
			}
		}

		const rawText = Buffer.isBuffer(content) ? content.toString('utf8') : String(content);
		const cleaned = rawText.replace(/<[^>]+>/g, ' ').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').replace(/\s+/g, ' ').trim();
		if (!cleaned || cleaned.length < 3) {
			throw new ValidationError('DOCX parser returned no readable text content');
		}
		return cleaned;
	}

	return { parse };
}

const docxParser = createDocxParser();
export default docxParser;

