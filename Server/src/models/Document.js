import mongoose from 'mongoose';

const { Schema } = mongoose;

const documentMetadataSchema = new Schema(
	{
		pageCount: { type: Number, min: 0 },
		language: { type: String, trim: true, maxlength: 32 },
		chunkCount: { type: Number, min: 0 },
		embeddingModel: { type: String, trim: true, maxlength: 128 },
		summary: { type: String, trim: true, maxlength: 20000 },
	},
	{ _id: false, strict: false }
);

const documentSchema = new Schema(
	{
		group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
		uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		name: { type: String, required: true, trim: true, maxlength: 255 },
		originalName: { type: String, required: true, trim: true, maxlength: 255 },
		mimeType: { type: String, required: true, trim: true, maxlength: 150 },
		size: { type: Number, required: true, min: 0 },
		storage: {
			provider: { type: String, required: true, trim: true, maxlength: 64 },
			key: { type: String, required: true, trim: true },
			url: { type: String, required: true, trim: true },
			bucket: { type: String, trim: true, default: null },
		},
		processingStatus: {
			type: String,
			enum: ['uploaded', 'queued', 'processing', 'ready', 'failed'],
			default: 'uploaded',
		},
		vectorIds: { type: [String], default: [] },
		metadata: { type: documentMetadataSchema, default: () => ({}) },
		version: { type: Number, default: 1, min: 1 },
		deletedAt: { type: Date, default: null },
		uploadedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

documentSchema.virtual('groupId').get(function groupId() {
	return this.group?._id || this.group || null;
});

documentSchema.index({ group: 1, uploadedAt: -1 });
documentSchema.index({ group: 1, processingStatus: 1 });
documentSchema.index({ uploadedBy: 1, uploadedAt: -1 });

const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);

export default Document;
