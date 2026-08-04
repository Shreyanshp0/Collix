import { AppError, ValidationError } from './AppError.js';

export const SOCKET_EVENTS = Object.freeze({
	GROUP_JOIN: 'group:join',
	GROUP_LEAVE: 'group:leave',
	MESSAGE_SEND: 'message:send',
	MESSAGE_READ: 'message:read',
	MESSAGE_NEW: 'new-message',
	MESSAGE_UPDATE: 'message:update',
	MESSAGE_DELETE: 'message:delete',
	REACTION_ADD: 'reaction:add',
	REACTION_REMOVE: 'reaction:remove',
	TYPING_START: 'typing:start',
	TYPING_STOP: 'typing:stop',
	TYPING: 'typing',
	PRESENCE_UPDATE: 'presence:update',
	SOCKET_ERROR: 'socket:error',

	// AI Streaming Events
	AI_ASK: 'ai:ask',
	AI_THINKING: 'ai:thinking',
	AI_DELTA: 'ai:delta',
	AI_COMPLETE: 'ai:complete',
	AI_ERROR: 'ai:error',

	// Document Lifecycle Events
	DOCUMENT_CREATED: 'document:created',
	DOCUMENT_UPDATED: 'document:updated',
	DOCUMENT_DELETED: 'document:deleted',
});

function safeError(error) {
	if (error instanceof AppError) return { code: error.code, message: error.message };
	return { code: 'INTERNAL_ERROR', message: 'An unexpected socket error occurred' };
}

export function acknowledgeSuccess(ack, data = {}) {
	if (typeof ack === 'function') ack({ success: true, data });
}

export function acknowledgeError(ack, error) {
	if (typeof ack === 'function') ack({ success: false, error: safeError(error) });
}

export function emitSocketError(socket, error, ack) {
	const payload = { success: false, error: safeError(error) };
	acknowledgeError(ack, error);
	if (typeof ack !== 'function') socket.emit(SOCKET_EVENTS.SOCKET_ERROR, payload);
}

export function registerSocketHandler(socket, event, handler, { logger, beforeHandle } = {}) {
	socket.on(event, async (payload, acknowledgement) => {
		const ack = typeof payload === 'function' ? payload : acknowledgement;
		const data = typeof payload === 'function' ? {} : payload || {};
		try {
			if (beforeHandle) await beforeHandle(data);
			const response = await handler(data);
			acknowledgeSuccess(ack, response);
		} catch (error) {
			logger.error('Socket event failed', { error, event, socketId: socket.id, userId: socket.user?._id?.toString() });
			emitSocketError(socket, error instanceof Error ? error : new ValidationError('Invalid socket request'), ack);
		}
	});
}
