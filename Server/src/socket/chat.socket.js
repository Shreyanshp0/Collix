import { toMessageDto } from '../mappers/message.mapper.js';
import { toRealtimeUserDto } from '../mappers/user.mapper.js';
import defaultLogger, { assertLogger } from '../utils/logger.js';
import { registerSocketHandler, SOCKET_EVENTS } from '../utils/socket.utils.js';
import { validateMessageInput } from '../validators/message.validator.js';
import { validateSocketObjectId } from '../validators/socket.validator.js';
import aiOrchestrator from '../services/rag/aiOrchestrator.service.js';

export function registerChatSocketHandlers({
	io,
	socket,
	groupService,
	messageService,
	presenceService,
	aiOrchestratorService = aiOrchestrator,
	rateLimitGuard,
	logger = defaultLogger,
}) {
	assertLogger(logger);
	const userId = socket.user._id;
	const register = (event, handler) => registerSocketHandler(socket, event, handler, {
		logger,
		beforeHandle: rateLimitGuard
			? (payload) => rateLimitGuard({ event, socket, payload })
			: undefined,
	});

	register(SOCKET_EVENTS.GROUP_JOIN, async ({ groupId }) => {
		const roomId = validateSocketObjectId(groupId, 'Group ID');
		const membership = await groupService.verifyMemberAccess({ groupId: roomId, userId });
		await socket.join(roomId);
		return { groupId: roomId, role: membership.role };
	});

	register(SOCKET_EVENTS.GROUP_LEAVE, async ({ groupId }) => {
		const roomId = validateSocketObjectId(groupId, 'Group ID');
		await socket.leave(roomId);
		return { groupId: roomId };
	});

	register(SOCKET_EVENTS.MESSAGE_SEND, async ({ groupId, message, type, attachments, replyTo, mentions, aiMetadata }) => {
		const roomId = validateSocketObjectId(groupId, 'Group ID');
		validateMessageInput({ message, type, attachments });
		await groupService.verifyMemberAccess({ groupId: roomId, userId });
		const savedMessage = await messageService.createMessage({ groupId: roomId, senderId: userId, message, type, attachments, replyTo, mentions, aiMetadata });
		const payload = toMessageDto(savedMessage, { author: socket.user });
		io.to(roomId).emit(SOCKET_EVENTS.MESSAGE_NEW, payload);
		return { message: payload };
	});

	register(SOCKET_EVENTS.MESSAGE_READ, async ({ groupId, messageId }) => {
		const roomId = validateSocketObjectId(groupId, 'Group ID');
		const normalizedMessageId = validateSocketObjectId(messageId, 'Message ID');
		await groupService.verifyMemberAccess({ groupId: roomId, userId });
		const message = await messageService.markMessageRead({ groupId: roomId, messageId: normalizedMessageId, userId });
		const payload = { messageId: message._id.toString(), readBy: [toRealtimeUserDto(socket.user)] };
		io.to(roomId).emit(SOCKET_EVENTS.MESSAGE_READ, payload);
		return payload;
	});

	register(SOCKET_EVENTS.AI_ASK, async ({ groupId, question, stream = true, options = {} }) => {
		const roomId = validateSocketObjectId(groupId, 'Group ID');
		await groupService.verifyMemberAccess({ groupId: roomId, userId });

		void Promise.resolve(
			aiOrchestratorService.ask({
				groupId: roomId,
				question,
				userId,
				options: { stream, ...options },
				onEvent: ({ event, data }) => {
					if (event === SOCKET_EVENTS.AI_THINKING || event === 'ai:thinking') {
						io.to(roomId).emit(SOCKET_EVENTS.AI_THINKING, data);
					} else if (event === SOCKET_EVENTS.AI_DELTA || event === 'ai:delta') {
						io.to(roomId).emit(SOCKET_EVENTS.AI_DELTA, data);
					} else if (event === SOCKET_EVENTS.AI_COMPLETE || event === 'ai:complete') {
						io.to(roomId).emit(SOCKET_EVENTS.AI_COMPLETE, data);
						if (data?.message) {
							io.to(roomId).emit(SOCKET_EVENTS.MESSAGE_NEW, data.message);
						}
					} else if (event === SOCKET_EVENTS.AI_ERROR || event === 'ai:error') {
						io.to(roomId).emit(SOCKET_EVENTS.AI_ERROR, data);
					}
				},
			})
		).catch((error) => {
			logger.error('Async AI ask failed in socket handler', { error, groupId: roomId, userId });
		});

		return { status: 'accepted', groupId: roomId };
	});

	for (const [event, isTyping] of [[SOCKET_EVENTS.TYPING_START, true], [SOCKET_EVENTS.TYPING_STOP, false]]) {
		register(event, async ({ groupId }) => {
			const roomId = validateSocketObjectId(groupId, 'Group ID');
			await groupService.verifyMemberAccess({ groupId: roomId, userId });
			const payload = { groupId: roomId, users: isTyping ? [toRealtimeUserDto(socket.user)] : [] };
			socket.to(roomId).emit(SOCKET_EVENTS.TYPING, payload);
			return payload;
		});
	}

	register(SOCKET_EVENTS.PRESENCE_UPDATE, async () => {
		return presenceService.getPresence({ userId });
	});
}
