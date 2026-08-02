import { ValidationError } from '../../utils/AppError.js';

export function createTextSplitter({ chunkSize = 1000, chunkOverlap = 150 } = {}) {
	if (!Number.isInteger(chunkSize) || chunkSize < 100 || !Number.isInteger(chunkOverlap) || chunkOverlap < 0 || chunkOverlap >= chunkSize) {
		throw new ValidationError('Invalid text splitter configuration');
	}

	function splitText({ text, metadata = {} }) {
		if (typeof text !== 'string' || !text.trim()) throw new ValidationError('Text is required for splitting');
		const chunks = [];
		const normalizedText = text.trim();
		const step = chunkSize - chunkOverlap;
		for (let start = 0, index = 0; start < normalizedText.length; start += step, index += 1) {
			chunks.push({ content: normalizedText.slice(start, start + chunkSize), metadata: { ...metadata, chunkIndex: index } });
		}
		return chunks;
	}

	return { splitText };
}
