function normalizeContext(context = {}) {
	return Object.fromEntries(
		Object.entries(context).map(([key, value]) => [
			key,
			value instanceof Error
				? { name: value.name, message: value.message, stack: value.stack }
				: value,
		])
	);
}

function write(level, message, context) {
	const entry = { timestamp: new Date().toISOString(), level, message, ...normalizeContext(context) };
	console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'](JSON.stringify(entry));
}

const logger = {
	info(message, context) {
		write('info', message, context);
	},
	warn(message, context) {
		write('warn', message, context);
	},
	error(message, context) {
		write('error', message, context);
	},
};

export function assertLogger(candidate) {
	if (!candidate || ['info', 'warn', 'error'].some((method) => typeof candidate[method] !== 'function')) {
		throw new TypeError('Logger must implement info, warn, and error methods');
	}

	return candidate;
}

export default logger;
