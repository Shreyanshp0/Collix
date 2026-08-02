import { PRESENCE_SOCKET_TTL_MS, PRESENCE_STATUS } from '../constants/presence.js';
import defaultLogger, { assertLogger } from '../utils/logger.js';

export function createPresenceService({ logger = defaultLogger, now = () => Date.now() } = {}) {
	assertLogger(logger);
	const socketsByUser = new Map();

	function purgeStaleSockets() {
		const threshold = now() - PRESENCE_SOCKET_TTL_MS;
		for (const [userId, sockets] of socketsByUser) {
			for (const [socketId, connectedAt] of sockets) if (connectedAt < threshold) sockets.delete(socketId);
			if (!sockets.size) socketsByUser.delete(userId);
		}
	}

	function markConnected({ userId, socketId }) {
		purgeStaleSockets();
		const key = userId.toString();
		const sockets = socketsByUser.get(key) || new Map();
		const becameOnline = sockets.size === 0;
		sockets.set(socketId, now());
		socketsByUser.set(key, sockets);
		return { userId: key, status: PRESENCE_STATUS.ONLINE, becameOnline, connectionCount: sockets.size };
	}

	function markDisconnected({ userId, socketId }) {
		const key = userId.toString();
		const sockets = socketsByUser.get(key);
		if (!sockets) return { userId: key, status: PRESENCE_STATUS.OFFLINE, becameOffline: false, connectionCount: 0 };
		sockets.delete(socketId);
		if (sockets.size) return { userId: key, status: PRESENCE_STATUS.ONLINE, becameOffline: false, connectionCount: sockets.size };
		socketsByUser.delete(key);
		return { userId: key, status: PRESENCE_STATUS.OFFLINE, becameOffline: true, connectionCount: 0 };
	}

	function getPresence({ userId }) {
		const count = socketsByUser.get(userId.toString())?.size || 0;
		return { userId: userId.toString(), status: count ? PRESENCE_STATUS.ONLINE : PRESENCE_STATUS.OFFLINE, connectionCount: count };
	}

	return { getPresence, markConnected, markDisconnected };
}

const presenceService = createPresenceService();
export default presenceService;
