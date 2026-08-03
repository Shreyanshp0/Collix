import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
	{
		name: {
			type: String,
			trim: true,
			maxlength: [100, 'Name cannot exceed 100 characters'],
			default: function defaultName() {
				return this.username;
			},
		},
		username: {
			type: String,
			required: [true, 'Username is required'],
			trim: true,
			minlength: [3, 'Username must be at least 3 characters long'],
			maxlength: [50, 'Username cannot exceed 50 characters'],
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
		},
		// `passwordHash` remains the persisted name used by the existing auth service.
		// The alias exposes the requested `password` model field without serializing it.
		passwordHash: {
			type: String,
			required: [true, 'Password is required'],
			select: false,
			alias: 'password',
		},
		avatar: { type: String, trim: true, default: null },
		bio: { type: String, trim: true, maxlength: 500, default: '' },
		status: {
			type: String,
			enum: ['online', 'offline', 'away', 'busy'],
			default: 'offline',
		},
		lastSeen: { type: Date, default: null },
		isVerified: { type: Boolean, default: false },
		refreshToken: { type: String, select: false, default: null },
		notificationPreferences: {
			browser: { type: Boolean, default: true },
			categories: {
				chat: { type: Boolean, default: true },
				documents: { type: Boolean, default: true },
				ai: { type: Boolean, default: true },
				group: { type: Boolean, default: true },
				system: { type: Boolean, default: true },
			},
		},
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform(_doc, ret) {
				delete ret.password;
				delete ret.passwordHash;
				delete ret.refreshToken;
				delete ret.__v;
				return ret;
			},
		},
		toObject: {
			virtuals: true,
			transform(_doc, ret) {
				delete ret.password;
				delete ret.passwordHash;
				delete ret.refreshToken;
				delete ret.__v;
				return ret;
			},
		},
	}
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
