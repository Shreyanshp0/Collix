import { toUserDto } from './user.mapper.js';
import { toGroupDto } from './group.mapper.js';

function getId(value) {
	return value?.id || value?._id?.toString?.() || value?._id || value?.toString?.();
}

export function toNotificationDto(notification) {
	if (!notification) return null;

	const id = getId(notification);
	return {
		id,
		recipientId: getId(notification.recipient),
		actor: notification.actor ? toUserDto(notification.actor) || { id: getId(notification.actor) } : null,
		group: notification.group ? toGroupDto(notification.group) || { id: getId(notification.group) } : null,
		category: notification.category,
		type: notification.type,
		title: notification.title,
		message: notification.message,
		icon: notification.icon || 'bell',
		color: notification.color || 'blue',
		priority: notification.priority || 'normal',
		status: notification.status || 'UNREAD',
		isRead: notification.status === 'READ',
		deduplicationKey: notification.deduplicationKey || null,
		target: notification.target || {
			type: 'chat',
			tab: 'chat',
			groupId: notification.group ? getId(notification.group) : null,
			id: null,
		},
		data: notification.data || {},
		createdAt: notification.createdAt,
		updatedAt: notification.updatedAt,
	};
}

export default toNotificationDto;
