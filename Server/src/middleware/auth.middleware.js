import sendErrorResponse from '../utils/errorResponse.js';
import { getUserById, verifyToken } from '../services/auth.service.js';

async function authenticate(req, res, next) {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return sendErrorResponse(res, 401, 'Unauthorized');
		}

		const token = authHeader.slice(7).trim();

		if (!token) {
			return sendErrorResponse(res, 401, 'Unauthorized');
		}

		let decoded;

		try {
			decoded = verifyToken(token);
		} catch (error) {
			return sendErrorResponse(res, 401, 'Unauthorized');
		}

		const user = await getUserById(decoded.userId);

		if (!user) {
			return sendErrorResponse(res, 401, 'Unauthorized');
		}

		req.user = user;
		return next();
	} catch (error) {
		return sendErrorResponse(res, 401, 'Unauthorized');
	}
}

export default authenticate;