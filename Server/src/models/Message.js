import mongoose from 'mongoose';

const { Schema } = mongoose;

export const attachmentSchema = new Schema(
	{
		type: {
			type: String,
			required: true,
			enum: ['image', 'pdf', 'docx', 'xlsx', 'pptx', 'audio', 'video', 'zip'],
		},
		name: { type: String, required: true, trim: true, maxlength: 255 },
		url: { type: String, required: true, trim: true },
		mimeType: { type: String, required: true, trim: true, maxlength: 150 },
		size: { type: Number, required: true, min: 0 },
	},
	{ _id: false }
);

const reactionSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		emoji: { type: String, required: true, trim: true, maxlength: 32 },
		createdAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const mentionSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		createdAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const readReceiptSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		readAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const aiMetadataSchema = new Schema(
	{
		provider: { type: String, trim: true },
		model: { type: String, trim: true },
		sources: { type: [Schema.Types.Mixed], default: [] },
		retrievedChunks: { type: [Schema.Types.Mixed], default: [] },
		confidence: { type: Number, min: 0, max: 1 },
		processingTime: { type: Number, min: 0 },
	},
	{ _id: false, strict: false }
);

const messageSchema = new Schema(
	{
		group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
		sender: { type: Schema.Types.ObjectId, ref: 'User', default: null },
		message: {
			type: String,
			trim: true,
			maxlength: [10000, 'Message cannot exceed 10000 characters'],
			default: '',
			validate: {
				validator(value) {
					return !['text', 'system', 'ai'].includes(this.type) || value.length > 0;
				},
				message: 'Text, system, and AI messages cannot be empty',
			},
		},
		type: {
			type: String,
			enum: ['text', 'image', 'document', 'audio', 'video', 'system', 'ai'],
			default: 'text',
		},
		attachments: { type: [attachmentSchema], default: [] },
		replyTo: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
		mentions: { type: [mentionSchema], default: [] },
		reactions: { type: [reactionSchema], default: [] },
		readBy: { type: [readReceiptSchema], default: [] },
		edited: { type: Boolean, default: false },
		deleted: { type: Boolean, default: false },
		editedAt: { type: Date, default: null },
		deletedAt: { type: Date, default: null },
		aiMetadata: { type: aiMetadataSchema, default: undefined },
	},
	{ timestamps: true, strict: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ replyTo: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
