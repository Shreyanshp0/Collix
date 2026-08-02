import mongoose from 'mongoose';

const { Schema } = mongoose;

const vectorMetadataSchema = new Schema(
	{
		groupId: { type: Schema.Types.ObjectId, required: true, index: true },
		sourceType: { type: String, required: true, trim: true, maxlength: 64, default: 'unknown' },
		sourceId: { type: String, required: true, trim: true, maxlength: 255 },
		contentType: { type: String, trim: true, maxlength: 32, default: 'text' },
		text: { type: String, required: true },
		chunkIndex: { type: Number, default: 0, min: 0 },
		documentId: { type: Schema.Types.ObjectId, default: null },
		messageId: { type: Schema.Types.ObjectId, default: null },
		aiMessageId: { type: Schema.Types.ObjectId, default: null },
		transcriptId: { type: Schema.Types.ObjectId, default: null },
		filename: { type: String, trim: true, maxlength: 255 },
		mimeType: { type: String, trim: true, maxlength: 150 },
		metadata: { type: Schema.Types.Mixed, default: {} },
	},
	{ timestamps: true }
);

vectorMetadataSchema.index({ groupId: 1, sourceType: 1, sourceId: 1, chunkIndex: 1 });

const VectorMetadata = mongoose.models.VectorMetadata || mongoose.model('VectorMetadata', vectorMetadataSchema);

export default VectorMetadata;
