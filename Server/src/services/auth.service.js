import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

function getJwtSecret() {
	const jwtSecret = process.env.JWT_SECRET;

	if (!jwtSecret) {
		throw new Error('JWT_SECRET is not defined');
	}

	return jwtSecret;
}

function sanitizeUser(user) {
	if (!user) {
		return null;
	}

	const plainUser = typeof user.toObject === 'function' ? user.toObject() : { ...user };
	delete plainUser.passwordHash;
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
	return jwt.sign({ userId: user._id.toString() }, getJwtSecret(), {
		expiresIn: TOKEN_EXPIRY,
	});
}

function verifyToken(token) {
	return jwt.verify(token, getJwtSecret());
}

async function registerUser({ username, email, password, avatar }) {
	const normalizedEmail = email.toLowerCase();
	const existingUser = await User.findOne({
		$or: [{ username }, { email: normalizedEmail }],
	});

	if (existingUser) {
		if (existingUser.username === username) {
			const error = new Error('Username already exists');
			error.statusCode = 409;
			throw error;
		}

		const error = new Error('Email already exists');
		error.statusCode = 409;
		throw error;
	}

	const passwordHash = await hashPassword(password);

	const user = await User.create({
		username,
		email: normalizedEmail,
		passwordHash,
		avatar,
	});

	const token = generateToken(user);

	return {
		token,
		user: sanitizeUser(user),
	};
}

async function loginUser({ email, password }) {
	const normalizedEmail = email.toLowerCase();
	const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

	if (!user) {
		const error = new Error('Invalid email or password');
		error.statusCode = 401;
		throw error;
	}

	const isPasswordValid = await comparePassword(password, user.passwordHash);

	if (!isPasswordValid) {
		const error = new Error('Invalid email or password');
		error.statusCode = 401;
		throw error;
	}

	const token = generateToken(user);

	return {
		token,
		user: sanitizeUser(user),
	};
}

async function getUserById(userId) {
	return User.findById(userId);
}

export {
	comparePassword,
	generateToken,
	getUserById,
	hashPassword,
	loginUser,
	registerUser,
	sanitizeUser,
	verifyToken,
};