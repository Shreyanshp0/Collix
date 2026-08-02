import { loginUser, registerUser, sanitizeUser, searchUsers } from '../services/auth.service.js';
import { NotImplementedError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { created, success } from '../utils/response.js';
import { toRealtimeUserDto, toUserDto } from '../mappers/user.mapper.js';
import { validateLoginInput, validateRegistrationInput } from '../validators/auth.validator.js';

const register = asyncHandler(async (req, res) => {
	const { username, email, password, avatar } = req.body || {};
	validateRegistrationInput({ username, email, password });
	const result = await registerUser({ username, email, password, avatar });
	return created(res, { message: 'User registered successfully', data: { token: result.token, user: toUserDto(result.user) } });
});

const login = asyncHandler(async (req, res) => {
	const { email, password } = req.body || {};
	validateLoginInput({ email, password });
	const result = await loginUser({ email, password });
	return success(res, { message: 'Login successful', data: { token: result.token, user: toUserDto(result.user) } });
});

const getProfile = asyncHandler(async (req, res) => {
	return success(res, { message: 'Authenticated user fetched successfully', data: { user: toUserDto(sanitizeUser(req.user)) } });
});

const search = asyncHandler(async (req, res) => {
	const { q, groupId } = req.query;
	const users = await searchUsers({ query: q, currentUserId: req.user._id, groupId });
	return success(res, { message: 'Users fetched successfully', data: { users: users.map(toRealtimeUserDto) } });
});

const refresh = asyncHandler(async () => { throw new NotImplementedError('Refresh token authentication'); });
const logout = asyncHandler(async () => { throw new NotImplementedError('Logout'); });

export { getProfile, login, logout, refresh, register, search };
export { getProfile as me };
