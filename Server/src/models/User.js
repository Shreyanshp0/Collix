import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: [true, 'Username is required'],
			unique: true,
			trim: true,
			minlength: [3, 'Username must be at least 3 characters long'],
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
		},
		passwordHash: {
			type: String,
			required: [true, 'Password hash is required'],
			select: false,
		},
		avatar: {
			type: String,
			default: null,
			trim: true,
		},
	},
	{
		timestamps: true,
	}
);

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

userSchema.set('toJSON', {
	transform: (doc, ret) => {
		delete ret.passwordHash;
		delete ret.__v;
		return ret;
	},
});

const User = mongoose.model('User', userSchema);

export default User;