import GroupMember from '../models/GroupMember.js';
import Message from '../models/Message.js';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../constants/pagination.js';
import { AuthorizationError, NotFoundError } from '../utils/AppError.js';
import defaultLogger, { assertLogger } from '../utils/logger.js';
import { validateMessageInput, validatePagination } from '../validators/message.validator.js';
import eventBus from './eventBus.service.js';
import User from '../models/User.js';

export function createMessageService({ indexer, logger = defaultLogger } = {}) {
	assertLogger(logger);

	async function requireMembership(groupId, userId) {
		if (!userId) throw new AuthorizationError('User context is required');
		const membership = await GroupMember.exists({ group: groupId, user: userId, banned: false });
		if (!membership) throw new AuthorizationError('You are not an active member of this group');
	}

	async function createMessage({ groupId, senderId, message = '', type = 'text', attachments = [], replyTo, mentions = [], aiMetadata }) {
		if (type !== 'ai' && senderId) {
			await requireMembership(groupId, senderId);
		}
		validateMessageInput({ message, type, attachments });
		if (replyTo) {
			const parent = await Message.exists({ _id: replyTo, group: groupId, deleted: false });
			if (!parent) throw new NotFoundError('Reply target message');
		}
		const savedMessage = await Message.create({ group: groupId, sender: senderId || null, message: message.trim(), type, attachments, replyTo, mentions, aiMetadata });
		if (senderId && type !== 'ai') {
			const sender = await User.findById(senderId).select('name username').lean();
			const payload = { groupId: groupId.toString(), senderId: senderId.toString(), senderName: sender?.name || sender?.username, messageId: savedMessage._id.toString() };
			eventBus.publish('MESSAGE_SENT', payload);
			for (const mention of savedMessage.mentions || []) {
				const mentionedUserId = mention.user?.toString();
				if (mentionedUserId && mentionedUserId !== senderId.toString()) eventBus.publish('MENTION_CREATED', { ...payload, mentionedUserId });
			}
		}
		if (indexer?.indexMessage) {
			void Promise.resolve(indexer.indexMessage(savedMessage)).catch((error) => {
				logger.error('Message indexing dispatch failed', { error, messageId: savedMessage._id.toString() });
			});
		}
		return savedMessage;
	}

	async function getRecentConversation({ groupId, limit = 15 }) {
		if (!groupId) return [];
		const safeLimit = Math.min(Math.max(1, Number(limit) || 15), 50);
		const items = await Message.find({ group: groupId })
			.sort({ createdAt: -1, _id: -1 })
			.limit(safeLimit)
			.populate('sender', 'name username avatar')
			.lean();
		return items.reverse();
	}

	async function listMessages({ groupId, requesterId, page = DEFAULT_PAGE, limit = DEFAULT_PAGE_SIZE }) {
		await requireMembership(groupId, requesterId);
		const pagination = validatePagination({ page, limit });
		const filter = { group: groupId };
		const [items, total] = await Promise.all([
			Message.find(filter).sort({ createdAt: -1, _id: -1 }).skip((pagination.page - 1) * pagination.limit).limit(pagination.limit)
				.populate('sender', 'name username avatar status').populate('readBy.user', 'name username avatar').lean(),
			Message.countDocuments(filter),
		]);
		return { items: items.reverse(), ...pagination, total, totalPages: Math.ceil(total / pagination.limit), hasNextPage: pagination.page * pagination.limit < total };
	}

	async function markMessageRead({ groupId, messageId, userId }) {
		await requireMembership(groupId, userId);
		const message = await Message.findOne({ _id: messageId, group: groupId });
		if (!message) throw new NotFoundError('Message');
		const receipt = message.readBy.find((entry) => entry.user.toString() === userId.toString());
		if (receipt) receipt.readAt = new Date();
		else message.readBy.push({ user: userId, readAt: new Date() });
		await Promise.all([
			message.save(),
			GroupMember.updateOne({ group: groupId, user: userId }, { $set: { lastReadMessage: message._id } }),
		]);
		return message;
	}

	return { createMessage, getRecentConversation, listMessages, markMessageRead, requireMembership };
}

const messageService = createMessageService();
export default messageService;
