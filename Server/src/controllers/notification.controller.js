import notificationService from '../services/notification.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import { NotFoundError } from '../utils/AppError.js';

const list = asyncHandler(async (req, res) => {
	const { category, status, page, limit } = req.query;
	const result = await notificationService.listNotifications({
		userId: req.user._id,
		category,
		status,
		page,
		limit,
	});
	return success(res, { message: 'Notifications fetched successfully', data: result });
});

const getUnreadCount = asyncHandler(async (req, res) => {
	const result = await notificationService.getUnreadCount({ userId: req.user._id });
	return success(res, { message: 'Unread count fetched successfully', data: result });
});

const markRead = asyncHandler(async (req, res) => {
	const result = await notificationService.markRead({
		notificationId: req.params.id,
		userId: req.user._id,
	});
	if (!result) throw new NotFoundError('Notification');
	return success(res, { message: 'Notification marked as read', data: { notification: result } });
});

const markAllRead = asyncHandler(async (req, res) => {
	const { category } = req.body || {};
	const result = await notificationService.markAllRead({
		userId: req.user._id,
		category,
	});
	return success(res, { message: 'All notifications marked as read', data: result });
});

const remove = asyncHandler(async (req, res) => {
	const result = await notificationService.deleteNotification({
		notificationId: req.params.id,
		userId: req.user._id,
	});
	if (!result.success) throw new NotFoundError('Notification');
	return success(res, { message: 'Notification deleted successfully', data: result });
});

const getPreferences = asyncHandler(async (req, res) => {
	const preferences = await notificationService.getUserPreferences({ userId: req.user._id });
	return success(res, { message: 'Notification preferences fetched successfully', data: { preferences } });
});

const updatePreferences = asyncHandler(async (req, res) => {
	const preferences = await notificationService.updateUserPreferences({ userId: req.user._id, preferences: req.body || {} });
	return success(res, { message: 'Notification preferences updated successfully', data: { preferences } });
});

export { getPreferences, getUnreadCount, list, markAllRead, markRead, remove, updatePreferences };
