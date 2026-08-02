import messageService from '../services/message.services.js';
import { toMessageDto } from '../mappers/message.mapper.js';
import asyncHandler from '../utils/asyncHandler.js';
import { created, paginated, success } from '../utils/response.js';

const create = asyncHandler(async (req, res) => {
	const { message, type, attachments, replyTo, mentions, aiMetadata } = req.body || {};
	const savedMessage = await messageService.createMessage({
		groupId: req.params.groupId, senderId: req.user._id, message, type, attachments, replyTo, mentions, aiMetadata,
	});
	return created(res, { message: 'Message created successfully', data: { message: toMessageDto(savedMessage, { author: req.user }) } });
});

const list = asyncHandler(async (req, res) => {
	const { page, limit } = req.query;
	const { items, ...pagination } = await messageService.listMessages({ groupId: req.params.groupId, requesterId: req.user._id, page, limit });
	return paginated(res, { message: 'Messages fetched successfully', items: items.map(toMessageDto), ...pagination, key: 'messages' });
});

const markRead = asyncHandler(async (req, res) => {
	const message = await messageService.markMessageRead({ groupId: req.params.groupId, messageId: req.params.messageId, userId: req.user._id });
	return success(res, { message: 'Read receipt recorded', data: { message: toMessageDto(message) } });
});

export { create, list, markRead };
