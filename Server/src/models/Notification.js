import mongoose from 'mongoose';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITY, NOTIFICATION_STATUS } from '../constants/notificationCategories.js';

const { Schema } = mongoose;

const notificationSchema = new Schema(
	{
		recipient: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		actor: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		group: {
			type: Schema.Types.ObjectId,
			ref: 'Group',
			default: null,
			index: true,
		},
		category: {
			type: String,
			enum: Object.values(NOTIFICATION_CATEGORIES),
			default: NOTIFICATION_CATEGORIES.SYSTEM,
			index: true,
		},
		type: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		message: {
			type: String,
			required: true,
			trim: true,
		},
		icon: {
			type: String,
			default: 'bell',
		},
		color: {
			type: String,
			default: 'blue',
		},
		priority: {
			type: String,
			enum: Object.values(NOTIFICATION_PRIORITY),
			default: NOTIFICATION_PRIORITY.NORMAL,
		},
		status: {
			type: String,
			enum: Object.values(NOTIFICATION_STATUS),
			default: NOTIFICATION_STATUS.UNREAD,
			index: true,
		},
		deduplicationKey: {
			type: String,
			default: null,
			index: true,
		},
		expiresAt: {
			type: Date,
			default: null,
			index: { expires: 0 }, // MongoDB TTL index
		},
		target: {
			type: { type: String, default: 'chat' },
			tab: { type: String, default: 'chat' },
			groupId: { type: String, default: null },
			id: { type: String, default: null },
		},
		data: {
			type: Schema.Types.Mixed,
			default: {},
		},
	},
	{ timestamps: true }
);

notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, category: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, deduplicationKey: 1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
