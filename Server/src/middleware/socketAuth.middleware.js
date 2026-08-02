import { AuthenticationError } from '../utils/AppError.js';
import defaultLogger, { assertLogger } from '../utils/logger.js';
import { getUserById, verifyToken } from '../services/auth.service.js';

function extractToken(socket) {
	const authToken = socket.handshake.auth?.token;
	if (typeof authToken === 'string' && authToken.trim()) return authToken.trim();
	const authorization = socket.handshake.headers?.authorization;
	if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) return authorization.slice(7).trim();
	return null;
}

export function createSocketAuthMiddleware({ logger = defaultLogger } = {}) {
	assertLogger(logger);
	return async function socketAuth(socket, next) {
		try {
			const token = extractToken(socket);
			if (!token) throw new AuthenticationError();
			const { userId } = verifyToken(token);
			const user = await getUserById(userId);
			if (!user) throw new AuthenticationError();
			socket.user = user;
			return next();
		} catch (error) {
			logger.warn('Socket authentication failed', { error, socketId: socket.id });
			return next(new AuthenticationError());
		}
	};
}

export default createSocketAuthMiddleware;
