import mongoose from 'mongoose';

const { Schema } = mongoose;

const groupSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, 'Group name is required'],
			trim: true,
			maxlength: [120, 'Group name cannot exceed 120 characters'],
		},
		description: { type: String, trim: true, maxlength: 2000, default: '' },
		image: { type: String, trim: true, default: null },
		owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		visibility: {
			type: String,
			enum: ['public', 'private'],
			default: 'private',
		},
		createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		archived: { type: Boolean, default: false, index: true },
		aiConfiguration: {
			workspaceDomain: { type: String, default: 'general' },
			persona: { type: String, default: 'mentor' },
			responseStyle: { type: String, default: 'balanced' },
			defaultMode: { type: String, default: 'hybrid' },
			creativity: { type: String, default: 'medium' },
			additionalInstructions: { type: String, default: '' },
			capabilities: { type: Schema.Types.Mixed, default: {} },
			metadata: { type: Schema.Types.Mixed, default: {} },
		},
		promptTemplate: { type: Schema.Types.ObjectId, ref: 'PromptTemplate', default: null, index: true },
	},
	{ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

groupSchema.index({ visibility: 1, archived: 1, createdAt: -1 });
groupSchema.index({ createdBy: 1, createdAt: -1 });

const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);

export default Group;
