import GroupMember from '../models/GroupMember.js';
import Message from '../models/Message.js';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../constants/pagination.js';
import { AuthorizationError, NotFoundError } from '../utils/AppError.js';
import defaultLogger, { assertLogger } from '../utils/logger.js';
import { validateMessageInput, validatePagination } from '../validators/message.validator.js';

export function createMessageService({ indexer, logger = defaultLogger } = {}) {
	assertLogger(logger);

	async function requireMembership(groupId, userId) {
		const membership = await GroupMember.exists({ group: groupId, user: userId, banned: false });
		if (!membership) throw new AuthorizationError('You are not an active member of this group');
	}

	async function createMessage({ groupId, senderId, message = '', type = 'text', attachments = [], replyTo, mentions = [], aiMetadata }) {
		await requireMembership(groupId, senderId);
		validateMessageInput({ message, type, attachments });
		if (replyTo) {
			const parent = await Message.exists({ _id: replyTo, group: groupId, deleted: false });
			if (!parent) throw new NotFoundError('Reply target message');
		}
		const savedMessage = await Message.create({ group: groupId, sender: senderId, message: message.trim(), type, attachments, replyTo, mentions, aiMetadata });
		if (indexer?.indexMessage) {
			void Promise.resolve(indexer.indexMessage(savedMessage)).catch((error) => {
				logger.error('Message indexing dispatch failed', { error, messageId: savedMessage._id.toString() });
			});
		}
		return savedMessage;
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

	return { createMessage, listMessages, markMessageRead };
}

const messageService = createMessageService();
export default messageService;
