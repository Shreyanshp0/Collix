import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import GroupMember from '../models/GroupMember.js';
import { AuthenticationError, ConflictError } from '../utils/AppError.js';
import defaultLogger, { assertLogger } from '../utils/logger.js';
import { validateLoginInput, validateRegistrationInput } from '../validators/auth.validator.js';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

function getJwtSecret() {
	if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined');
	return process.env.JWT_SECRET;
}

function normalizeEmail(email) {
	return email.trim().toLowerCase();
}

function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function sanitizeUser(user) {
	if (!user) return null;
	const plainUser = typeof user.toObject === 'function' ? user.toObject() : { ...user };
	delete plainUser.password;
	delete plainUser.passwordHash;
	delete plainUser.refreshToken;
	delete plainUser.__v;
	return plainUser;
}

async function hashPassword(password) {
	return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, passwordHash) {
	return bcrypt.compare(password, passwordHash);
}

function generateToken(user) {
	return jwt.sign({ userId: user._id.toString() }, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
	return jwt.verify(token, getJwtSecret());
}

export function createAuthService({ logger = defaultLogger } = {}) {
	assertLogger(logger);

	async function registerUser({ username, email, password, avatar }) {
		validateRegistrationInput({ username, email, password });
		const normalizedUsername = username.trim();
		const normalizedEmail = normalizeEmail(email);
		const existingUser = await User.findOne({
			$or: [{ username: normalizedUsername }, { email: normalizedEmail }],
		}).lean();

		if (existingUser) {
			throw new ConflictError(existingUser.username === normalizedUsername ? 'Username already exists' : 'Email already exists');
		}

		try {
			const user = await User.create({
				username: normalizedUsername,
				email: normalizedEmail,
				passwordHash: await hashPassword(password),
				avatar: typeof avatar === 'string' ? avatar.trim() || null : undefined,
			});
			return { token: generateToken(user), user: sanitizeUser(user) };
		} catch (error) {
			if (error?.code === 11000) throw new ConflictError('Username or email already exists');
			logger.error('User registration failed', { error, username: normalizedUsername });
			throw error;
		}
	}

	async function loginUser({ email, password }) {
		validateLoginInput({ email, password });
		const user = await User.findOne({ email: normalizeEmail(email) }).select('+passwordHash');
		if (!user || !(await comparePassword(password, user.passwordHash))) {
			throw new AuthenticationError('Invalid email or password');
		}
		return { token: generateToken(user), user: sanitizeUser(user) };
	}

	async function getUserById(userId) {
		return User.findById(userId);
	}

	async function searchUsers({ query, currentUserId, groupId, limit = 10 }) {
		if (!query || typeof query !== 'string' || query.trim().length < 2) {
			return [];
		}

		const safeQuery = escapeRegex(query.trim());
		const excludeUserIds = [currentUserId];

		if (groupId) {
			const existingMembers = await GroupMember.find({ group: groupId }).select('user').lean();
			existingMembers.forEach((m) => {
				if (m.user) excludeUserIds.push(m.user);
			});
		}

		const users = await User.find({
			_id: { $nin: excludeUserIds },
			$or: [
				{ name: { $regex: safeQuery, $options: 'i' } },
				{ username: { $regex: safeQuery, $options: 'i' } },
			],
		})
			.select('_id name username avatar')
			.limit(limit)
			.lean();

		return users;
	}

	return { getUserById, loginUser, registerUser, searchUsers };
}

const authService = createAuthService();

export const { getUserById, loginUser, registerUser, searchUsers } = authService;
export { comparePassword, generateToken, hashPassword, sanitizeUser, verifyToken };
