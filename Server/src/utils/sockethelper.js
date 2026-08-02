import { AppError, ValidationError } from './AppError.js';

function serializeSocketError(error) {
	if (error instanceof AppError) {
		return { code: error.code, message: error.message };
	}
	return { code: 'INTERNAL_ERROR', message: 'An unexpected socket error occurred' };
}

export function acknowledgeSuccess(ack, data = {}) {
	if (typeof ack === 'function') {
		ack({ success: true, data });
	}
}

export function acknowledgeError(ack, error) {
	if (typeof ack === 'function') {
		ack({ success: false, error: serializeSocketError(error) });
	}
}

export function emitSocketError(socket, error, ack) {
	const payload = { success: false, error: serializeSocketError(error) };
	acknowledgeError(ack, error);
	if (typeof ack !== 'function') {
		socket.emit('socket:error', payload);
	}
}

export function toSocketPayload(payload) {
	if (payload instanceof Error) {
		return { success: false, error: serializeSocketError(payload instanceof AppError ? payload : new ValidationError('Invalid socket payload')) };
	}
	return { success: true, data: payload };
}
