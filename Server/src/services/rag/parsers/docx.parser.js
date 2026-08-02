import { DependencyError, ValidationError } from '../../../utils/AppError.js';

export function createDocxParser({ mammoth } = {}) {
	if (!mammoth?.extractRawText) {
		throw new DependencyError('DOCX parser dependency is not available');
	}

	async function parse({ content }) {
		if (!content || (typeof content !== 'string' && !Buffer.isBuffer(content) && !(content instanceof Uint8Array))) {
			throw new ValidationError('DOCX parser requires binary content');
		}
		const result = await mammoth.extractRawText({ buffer: content });
		if (typeof result?.value !== 'string' || !result.value.trim()) {
			throw new ValidationError('DOCX parser returned no text content');
		}
		return result.value;
	}

	return { parse };
}

export default createDocxParser;
