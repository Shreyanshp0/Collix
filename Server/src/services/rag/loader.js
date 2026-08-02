import { ValidationError } from '../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../utils/logger.js';
import txtParser from './parsers/txt.parser.js';
import markdownParser from './parsers/markdown.parser.js';
import pdfParser from './parsers/pdf.parser.js';
import docxParser from './parsers/docx.parser.js';

function getParserForDocument(document) {
	const mimeType = document?.mimeType?.toLowerCase?.() || '';
	const name = document?.name?.toLowerCase?.() || '';

	if (mimeType.includes('pdf') || name.endsWith('.pdf')) return pdfParser;
	if (mimeType.includes('word') || mimeType.includes('officedocument') || name.endsWith('.docx') || name.endsWith('.doc')) return docxParser;
	if (mimeType.includes('markdown') || name.endsWith('.md') || name.endsWith('.markdown')) return markdownParser;
	return txtParser;
}

export function createDocumentLoader({ parsers = {}, logger = defaultLogger } = {}) {
	assertLogger(logger);
	const parserMap = {
		pdf: parsers.pdf || pdfParser,
		docx: parsers.docx || docxParser,
		txt: parsers.txt || txtParser,
		markdown: parsers.markdown || markdownParser,
	};

	async function loadDocument(document) {
		if (!document) throw new ValidationError('A document is required');
		const parser = getParserForDocument(document);
		if (!parser?.parse) throw new ValidationError('No parser available for the provided document');
		const content = document.content ?? document.buffer ?? document.rawContent ?? '';
		if (!content) throw new ValidationError('Document content is required');
		const text = await parser.parse({ content });
		if (typeof text !== 'string' || !text.trim()) throw new ValidationError('Document parser returned no text content');
		return text;
	}

	return { loadDocument, parserMap };
}

const documentLoader = createDocumentLoader();

export default documentLoader;
