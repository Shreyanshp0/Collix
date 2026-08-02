import ragRetriever, { createRagRetriever } from './retriever.js';
import defaultLogger from '../../utils/logger.js';

export { createRagRetriever };

export function createQaService({ retriever = ragRetriever, logger = defaultLogger } = {}) {
	return {
		retrieveContext: (params) => retriever.retrieveSemanticContext(params),
	};
}

const qaService = createQaService();
export default qaService;
