import mongoose from 'mongoose';

const { Schema } = mongoose;

const groupMemberSchema = new Schema(
	{
		group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		role: {
			type: String,
			enum: ['owner', 'admin', 'moderator', 'member'],
			default: 'member',
		},
		nickname: { type: String, trim: true, maxlength: 80, default: null },
		joinedAt: { type: Date, default: Date.now },
		muted: { type: Boolean, default: false },
		banned: { type: Boolean, default: false },
		lastReadMessage: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
	},
	{ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

groupMemberSchema.index({ group: 1, user: 1 }, { unique: true });
groupMemberSchema.index({ user: 1, banned: 1, group: 1 });
groupMemberSchema.index({ group: 1, role: 1, banned: 1 });

const GroupMember = mongoose.models.GroupMember || mongoose.model('GroupMember', groupMemberSchema);

export default GroupMember;
