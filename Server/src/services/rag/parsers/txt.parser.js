import { ValidationError } from '../../../utils/AppError.js';

export function createTxtParser() {
	async function parse({ content }) {
		if (typeof content === 'string') return content;
		if (Buffer.isBuffer(content)) return content.toString('utf8');
		if (content instanceof Uint8Array) return Buffer.from(content).toString('utf8');
		throw new ValidationError('TXT parser requires string or buffer content');
	}

	return { parse };
}

const txtParser = createTxtParser();

export default txtParser;
