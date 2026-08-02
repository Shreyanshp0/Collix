import { DependencyError } from '../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';
import { validateDocumentForIndexing } from '../../validators/document.validator.js';

export function createDocumentLoader({ load, logger = defaultLogger } = {}) {
	assertLogger(logger);
	if (typeof load !== 'function') throw new DependencyError('A document loader must supply a load function');

	async function loadDocument(document) {
		validateDocumentForIndexing(document);
		try {
			const content = await load(document);
			if (typeof content !== 'string' || !content.trim()) throw new DependencyError('Document loader returned no text content');
			return content;
		} catch (error) {
			logger.error('Document loading failed', { error, documentId: document._id?.toString() });
			throw error;
		}
	}

	return { loadDocument };
}
