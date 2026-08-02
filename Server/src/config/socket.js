export function createSocketConfig({ origin = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN } = {}) {
	const allowedOrigins = origin
		? origin.split(',').map((value) => value.trim()).filter(Boolean)
		: ['http://localhost:5173'];

	return {
		cors: {
			origin: allowedOrigins,
			credentials: true,
			methods: ['GET', 'POST'],
		},
	};
}
