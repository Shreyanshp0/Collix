import { Server } from 'socket.io';
import { createSocketConfig } from '../config/socket.js';
import createSocketAuthMiddleware from '../middleware/socketAuth.middleware.js';
import { toRealtimeUserDto } from '../mappers/user.mapper.js';
import groupService from '../services/group.service.js';
import messageService from '../services/message.services.js';
import presenceService from '../services/presence.services.js';
import aiOrchestrator from '../services/rag/aiOrchestrator.service.js';
import defaultLogger, { assertLogger } from '../utils/logger.js';
import { SOCKET_EVENTS } from '../utils/socket.utils.js';
import { registerChatSocketHandlers } from './chat.socket.js';

export function initializeSocketServer(httpServer, {
	config = createSocketConfig(),
	groupService: groups = groupService,
	messageService: messages = messageService,
	presenceService: presence = presenceService,
	aiOrchestratorService: ai = aiOrchestrator,
	rateLimitGuard,
	logger = defaultLogger,
} = {}) {
	assertLogger(logger);
	const io = new Server(httpServer, config);
	io.use(createSocketAuthMiddleware({ logger }));

	io.on('connection', (socket) => {
		const presenceState = presence.markConnected({ userId: socket.user._id, socketId: socket.id });
		if (presenceState.becameOnline) io.emit(SOCKET_EVENTS.PRESENCE_UPDATE, { user: toRealtimeUserDto(socket.user), status: presenceState.status });
		logger.info('Socket connected', { socketId: socket.id, userId: socket.user._id.toString() });

		registerChatSocketHandlers({
			io,
			socket,
			groupService: groups,
			messageService: messages,
			presenceService: presence,
			aiOrchestratorService: ai,
			rateLimitGuard,
			logger,
		});

		socket.on('disconnect', (reason) => {
			const state = presence.markDisconnected({ userId: socket.user._id, socketId: socket.id });
			if (state.becameOffline) io.emit(SOCKET_EVENTS.PRESENCE_UPDATE, { user: toRealtimeUserDto(socket.user), status: state.status });
			logger.info('Socket disconnected', { socketId: socket.id, userId: socket.user._id.toString(), reason });
		});
	});

	return io;
}
