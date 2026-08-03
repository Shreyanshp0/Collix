import Notification from '../models/Notification.js';
import GroupMember from '../models/GroupMember.js';
import User from '../models/User.js';
import toNotificationDto from '../mappers/notification.mapper.js';
import eventBus from './eventBus.service.js';
import { getIO } from '../socket/index.js';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITY, NOTIFICATION_STATUS, NOTIFICATION_TYPES } from '../constants/notificationCategories.js';
import defaultLogger from '../utils/logger.js';

export function createNotificationService({ logger = defaultLogger } = {}) {
	function emitSocketNotification(recipientId, event, data) {
		try {
			const io = getIO();
			if (io) {
				const roomName = `user:${recipientId.toString()}`;
				io.to(roomName).emit(event, data);
			}
		} catch (err) {
			logger.error('Failed to emit socket notification:', err);
		}
	}

	async function getUnreadCount({ userId }) {
		const count = await Notification.countDocuments({
			recipient: userId,
			status: NOTIFICATION_STATUS.UNREAD,
		});
		return { count };
	}

	async function emitUnreadCount(userId) {
		const { count } = await getUnreadCount({ userId });
		emitSocketNotification(userId, 'notification:unread-count', { count });
	}

	async function createNotification({
		recipientId,
		actorId = null,
		groupId = null,
		category = NOTIFICATION_CATEGORIES.SYSTEM,
		type,
		title,
		message,
		icon = 'bell',
		color = 'blue',
		priority = NOTIFICATION_PRIORITY.NORMAL,
		deduplicationKey = null,
		expiresAt = null,
		target = {},
		data = {},
	}) {
		if (!recipientId) return null;
		// Central self-notification guard. Every publisher routes through this method,
		// so an actor can never persist or receive a notification for their own action.
		if (actorId && recipientId.toString() === actorId.toString()) return null;
		const preferences = await getUserPreferences({ userId: recipientId });
		if (preferences.categories?.[category] === false) return null;

		let notification;
		let wasUpdated = false;
		if (deduplicationKey) {
			wasUpdated = Boolean(await Notification.exists({ recipient: recipientId, deduplicationKey }));
			notification = await Notification.findOneAndUpdate(
				{ recipient: recipientId, deduplicationKey },
				{
					actor: actorId,
					group: groupId,
					category,
					type,
					title,
					message,
					icon,
					color,
					priority,
					status: NOTIFICATION_STATUS.UNREAD,
					expiresAt,
					target,
					data,
				},
				{ new: true, upsert: true }
			);
		} else {
			notification = await Notification.create({
				recipient: recipientId,
				actor: actorId,
				group: groupId,
				category,
				type,
				title,
				message,
				icon,
				color,
				priority,
				status: NOTIFICATION_STATUS.UNREAD,
				deduplicationKey,
				expiresAt,
				target,
				data,
			});
		}

		await notification.populate(['actor', 'group']);
		const dto = toNotificationDto(notification);

		// Socket emit
		emitSocketNotification(recipientId, wasUpdated ? 'notification:updated' : 'notification:new', dto);
		await emitUnreadCount(recipientId);

		return dto;
	}

	async function createGroupNotification({
		groupId,
		actorId = null,
		category = NOTIFICATION_CATEGORIES.GROUP,
		type,
		title,
		message,
		icon = 'bell',
		color = 'blue',
		priority = NOTIFICATION_PRIORITY.NORMAL,
		deduplicationKey = null,
		expiresAt = null,
		target = {},
		data = {},
	}) {
		if (!groupId) return [];

		const members = await GroupMember.find({ group: groupId, banned: false }).select('user').lean();
		const recipientIds = members
			.map((m) => m.user?.toString())
			.filter((uId) => uId && uId !== actorId?.toString());

		const promises = recipientIds.map((recipientId) =>
			createNotification({
				recipientId,
				actorId,
				groupId,
				category,
				type,
				title,
				message,
				icon,
				color,
				priority,
				deduplicationKey: deduplicationKey ? `${deduplicationKey}_${recipientId}` : null,
				expiresAt,
				target: { ...target, groupId: groupId.toString() },
				data,
			})
		);

		return Promise.all(promises);
	}

	async function listNotifications({ userId, category, status, page = 1, limit = 30 }) {
		const pageNum = Math.max(1, parseInt(page, 10) || 1);
		const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 30));

		const query = { recipient: userId };
		if (category) query.category = category;
		if (status) query.status = status;

		const [items, total, unreadCount] = await Promise.all([
			Notification.find(query)
				.sort({ createdAt: -1 })
				.skip((pageNum - 1) * limitNum)
				.limit(limitNum)
				.populate(['actor', 'group'])
				.lean(),
			Notification.countDocuments(query),
			Notification.countDocuments({ recipient: userId, status: NOTIFICATION_STATUS.UNREAD }),
		]);

		const totalPages = Math.ceil(total / limitNum) || 1;

		return {
			notifications: items.map(toNotificationDto),
			unreadCount,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total,
				totalPages,
				hasNextPage: pageNum < totalPages,
			},
		};
	}

	async function markRead({ notificationId, userId }) {
		const notification = await Notification.findOneAndUpdate(
			{ _id: notificationId, recipient: userId },
			{ $set: { status: NOTIFICATION_STATUS.READ, readAt: new Date() } },
			{ new: true }
		).populate(['actor', 'group']);

		if (!notification) return null;
		const dto = toNotificationDto(notification);

		emitSocketNotification(userId, 'notification:read', { id: notificationId });
		await emitUnreadCount(userId);

		return dto;
	}

	async function markAllRead({ userId, category }) {
		const query = { recipient: userId, status: NOTIFICATION_STATUS.UNREAD };
		if (category) query.category = category;

		await Notification.updateMany(query, {
			$set: { status: NOTIFICATION_STATUS.READ, readAt: new Date() },
		});

		emitSocketNotification(userId, 'notification:read-all', { category: category || 'all' });
		await emitUnreadCount(userId);

		return { success: true };
	}

	async function deleteNotification({ notificationId, userId }) {
		const result = await Notification.deleteOne({ _id: notificationId, recipient: userId });
		if (result.deletedCount > 0) {
			emitSocketNotification(userId, 'notification:deleted', { id: notificationId });
			await emitUnreadCount(userId);
		}
		return { success: result.deletedCount > 0 };
	}

	async function getUserPreferences({ userId }) {
		const user = await User.findById(userId).select('notificationPreferences').lean();
		return user?.notificationPreferences || { browser: true, categories: { chat: true, documents: true, ai: true, group: true, system: true } };
	}

	async function updateUserPreferences({ userId, preferences = {} }) {
		const allowedCategories = ['chat', 'documents', 'ai', 'group', 'system'];
		const updates = {};
		if (typeof preferences.browser === 'boolean') updates['notificationPreferences.browser'] = preferences.browser;
		if (preferences.categories && typeof preferences.categories === 'object') {
			for (const category of allowedCategories) {
				if (typeof preferences.categories[category] === 'boolean') updates[`notificationPreferences.categories.${category}`] = preferences.categories[category];
			}
		}
		const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select('notificationPreferences').lean();
		return user?.notificationPreferences || getUserPreferences({ userId });
	}

	// Register Event Bus Listeners
	function registerEventListeners() {
		const subscribe = (eventName, listener) => {
			eventBus.on(eventName, (payload) => {
				void Promise.resolve(listener(payload)).catch((error) => {
					logger.error('Notification event handling failed', { eventName, error, payload });
				});
			});
		};
		// 1. Document Uploaded
			subscribe('DOCUMENT_UPLOADED', async (payload) => {
			await createGroupNotification({
				groupId: payload.groupId,
				actorId: payload.uploadedBy,
				category: NOTIFICATION_CATEGORIES.DOCUMENTS,
				type: NOTIFICATION_TYPES.DOCUMENT_UPLOADED,
				title: 'New Document Uploaded',
				message: `${payload.uploaderName || 'A group member'} uploaded ${payload.filename}`,
				icon: 'file',
				color: 'blue',
				target: { type: 'document', tab: 'documents', groupId: payload.groupId, id: payload.documentId },
				data: { documentId: payload.documentId },
			});
		});

		// 2. Document Ready
		subscribe('DOCUMENT_READY', async (payload) => {
			await createGroupNotification({
				groupId: payload.groupId,
				actorId: payload.uploadedBy,
				category: NOTIFICATION_CATEGORIES.DOCUMENTS,
				type: NOTIFICATION_TYPES.DOCUMENT_READY,
				title: 'Document Ready for AI Search',
				message: `"${payload.filename}" is indexed and ready for AI search & grounded Q&A.`,
				icon: 'file-check',
				color: 'green',
				deduplicationKey: `DOC_READY_${payload.documentId}`,
				target: { type: 'document', tab: 'documents', groupId: payload.groupId, id: payload.documentId },
				data: { documentId: payload.documentId },
			});
		});

		// 3. Document Failed
		subscribe('DOCUMENT_FAILED', async (payload) => {
			await createGroupNotification({
				groupId: payload.groupId,
				actorId: payload.uploadedBy,
				category: NOTIFICATION_CATEGORIES.DOCUMENTS,
				type: NOTIFICATION_TYPES.DOCUMENT_FAILED,
				title: 'Document Processing Failed',
				message: `Could not extract text from "${payload.filename}": ${payload.error || 'Processing error'}`,
				icon: 'file-x',
				color: 'red',
				priority: NOTIFICATION_PRIORITY.HIGH,
				target: { type: 'document', tab: 'documents', groupId: payload.groupId, id: payload.documentId },
				data: { documentId: payload.documentId, error: payload.error },
			});
		});

		// 4. AI Response Ready
		subscribe('AI_RESPONSE_READY', async (payload) => {
			await createGroupNotification({
				groupId: payload.groupId,
				actorId: payload.askedBy,
				category: NOTIFICATION_CATEGORIES.AI,
				type: NOTIFICATION_TYPES.AI_RESPONSE,
				title: 'Nexus AI Answered',
				message: `Nexus AI generated an answer in your group conversation.`,
				icon: 'bot',
				color: 'purple',
				target: { type: 'ai', tab: 'chat', groupId: payload.groupId, id: payload.messageId },
				data: { messageId: payload.messageId },
			});
		});

		subscribe('AI_CONFIGURATION_UPDATED', async (payload) => {
			await createGroupNotification({
				groupId: payload.groupId,
				actorId: payload.actorId,
				category: NOTIFICATION_CATEGORIES.AI,
				type: NOTIFICATION_TYPES.AI_CONFIGURATION_UPDATED,
				title: 'AI settings updated',
				message: 'The group AI configuration was updated.',
				icon: 'bot',
				color: 'purple',
				target: { type: 'ai', tab: 'chat', groupId: payload.groupId },
			});
		});

		// 5. User Mentioned
		subscribe('MENTION_CREATED', async (payload) => {
			await createNotification({
				recipientId: payload.mentionedUserId,
				actorId: payload.senderId,
				groupId: payload.groupId,
				category: NOTIFICATION_CATEGORIES.CHAT,
				type: NOTIFICATION_TYPES.MENTION,
				title: 'You were mentioned',
				message: `${payload.senderName || 'Someone'} mentioned you in a message.`,
				icon: 'at-sign',
				color: 'amber',
				priority: NOTIFICATION_PRIORITY.HIGH,
				target: { type: 'message', tab: 'chat', groupId: payload.groupId, id: payload.messageId },
				data: { messageId: payload.messageId },
			});
		});

		// 6. Member Joined
		subscribe('MEMBER_JOINED', async (payload) => {
			await createGroupNotification({
				groupId: payload.groupId,
				actorId: payload.userId,
				category: NOTIFICATION_CATEGORIES.GROUP,
				type: NOTIFICATION_TYPES.MEMBER_JOINED,
				title: 'New Member Joined',
				message: `${payload.userName || 'A new user'} joined the group.`,
				icon: 'user-plus',
				color: 'blue',
				target: { type: 'member', tab: 'members', groupId: payload.groupId, id: payload.userId },
				data: { userId: payload.userId },
			});
		});

		subscribe('MESSAGE_SENT', async (payload) => {
			await createGroupNotification({
				groupId: payload.groupId,
				actorId: payload.senderId,
				category: NOTIFICATION_CATEGORIES.CHAT,
				type: NOTIFICATION_TYPES.MESSAGE,
				title: 'New message',
				message: `${payload.senderName || 'A group member'} sent a message.`,
				icon: 'message-square',
				color: 'blue',
				target: { type: 'message', tab: 'chat', groupId: payload.groupId, id: payload.messageId },
				data: { messageId: payload.messageId },
			});
		});

		subscribe('MEMBER_LEFT', async (payload) => {
			await createGroupNotification({
				groupId: payload.groupId, actorId: payload.userId,
				category: NOTIFICATION_CATEGORIES.GROUP, type: NOTIFICATION_TYPES.MEMBER_LEFT,
				title: 'Member left', message: `${payload.userName || 'A group member'} left the group.`,
				icon: 'users', color: 'blue', target: { type: 'member', tab: 'members', groupId: payload.groupId, id: payload.userId },
			});
		});

		subscribe('ROLE_CHANGED', async (payload) => {
			await createNotification({
				recipientId: payload.userId, actorId: payload.actorId, groupId: payload.groupId,
				category: NOTIFICATION_CATEGORIES.GROUP, type: NOTIFICATION_TYPES.ROLE_CHANGED,
				title: 'Your group role changed', message: `Your role is now ${payload.role}.`,
				icon: 'users', color: 'blue', target: { type: 'member', tab: 'members', groupId: payload.groupId, id: payload.userId },
			});
		});
	}

	registerEventListeners();

	return {
		createGroupNotification,
		createNotification,
		deleteNotification,
		getUnreadCount,
		getUserPreferences,
		listNotifications,
		markAllRead,
		markRead,
		updateUserPreferences,
	};
}

const notificationService = createNotificationService();
export default notificationService;
