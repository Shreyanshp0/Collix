import { DependencyError } from '../../../utils/AppError.js';
import defaultLogger, { assertLogger } from '../../../utils/logger.js';

export function createInMemoryQueueProvider({ concurrency = 1, retries = 3, logger = defaultLogger } = {}) {
	assertLogger(logger);
	const pending = [];
	let active = 0;

	async function runNext() {
		if (active >= concurrency || !pending.length) return;
		const job = pending.shift();
		active += 1;
		try {
			for (let attempt = 1; attempt <= (job.retries ?? retries); attempt += 1) {
				try {
					await job.run();
					break;
				} catch (error) {
					if (attempt === (job.retries ?? retries)) {
						logger.error('Queue job exhausted retries', { error, job: job.name });
					} else {
						logger.warn('Retrying queue job', { error, job: job.name, attempt });
					}
				}
			}
		} finally {
			active -= 1;
			void runNext();
		}
	}

	function enqueue(job) {
		if (!job || typeof job.run !== 'function') {
			throw new DependencyError('Queue jobs require a run function');
		}
		pending.push(job);
		void runNext();
		return job;
	}

	return { enqueue };
}

export function createQueueProvider({ implementation = 'in-memory', concurrency = 1, retries = 3, logger = defaultLogger } = {}) {
	assertLogger(logger);
	if (implementation !== 'in-memory') {
		throw new DependencyError(`Queue implementation "${implementation}" is not available yet`);
	}

	return createInMemoryQueueProvider({ concurrency, retries, logger });
}

const queueProvider = createQueueProvider();

export default queueProvider;
