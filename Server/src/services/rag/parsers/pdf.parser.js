import { DependencyError, ValidationError } from '../../../utils/AppError.js';

export function createPdfParser({ pdfParse } = {}) {
	if (typeof pdfParse !== 'function') {
		throw new DependencyError('PDF parser dependency is not available');
	}

	async function parse({ content }) {
		if (!content || (typeof content !== 'string' && !Buffer.isBuffer(content) && !(content instanceof Uint8Array))) {
			throw new ValidationError('PDF parser requires binary content');
		}
		const result = await pdfParse(content);
		if (typeof result?.text !== 'string' || !result.text.trim()) {
			throw new ValidationError('PDF parser returned no text content');
		}
		return result.text;
	}

	return { parse };
}

export default createPdfParser;
