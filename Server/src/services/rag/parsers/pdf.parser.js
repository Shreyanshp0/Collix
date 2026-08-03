import pdfParse from 'pdf-parse-new';
import { ValidationError } from '../../../utils/AppError.js';

export function createPdfParser() {
	async function parse({ content }) {
		if (!content) {
			throw new ValidationError('PDF parser requires binary content');
		}

		let buffer;
		if (Buffer.isBuffer(content)) {
			buffer = content;
		} else if (content instanceof Uint8Array) {
			buffer = Buffer.from(content.buffer, content.byteOffset, content.byteLength);
		} else if (content instanceof ArrayBuffer) {
			buffer = Buffer.from(content);
		} else {
			throw new ValidationError('PDF parser requires binary content (Buffer or Uint8Array)');
		}

		try {
			const pdfData = await pdfParse(buffer);
			const extractedText = pdfData?.text ? pdfData.text.trim() : '';

			if (!extractedText || extractedText.length < 20) {
				throw new ValidationError('Unable to extract readable text from PDF');
			}

			console.log('\n========== PDF TEXT ==========');
			console.log(extractedText.substring(0, 1000));
			console.log('==============================\n');

			return extractedText;
		} catch (error) {
			if (error instanceof ValidationError) {
				throw error;
			}
			throw new ValidationError(`Unable to extract readable text from PDF: ${error.message || 'Unknown error'}`);
		}
	}

	return { parse };
}

const pdfParser = createPdfParser();
export default pdfParser;
