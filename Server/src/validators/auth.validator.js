import { ValidationError } from '../utils/AppError.js';

export function validateRegistrationInput({ username, email, password }) {
	if (typeof username !== 'string' || username.trim().length < 3) {
		throw new ValidationError('Username must be at least 3 characters long');
	}
	if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
		throw new ValidationError('A valid email address is required');
	}
	if (typeof password !== 'string' || password.length < 8) {
		throw new ValidationError('Password must be at least 8 characters long');
	}
}

export function validateLoginInput({ email, password }) {
	if (typeof email !== 'string' || !email.trim()) {
		throw new ValidationError('Email is required');
	}
	if (typeof password !== 'string' || !password) {
		throw new ValidationError('Password is required');
	}
}
