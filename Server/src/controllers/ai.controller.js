import aiOrchestrator from '../services/rag/aiOrchestrator.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/AppError.js';
import { success } from '../utils/response.js';

export const askAi = asyncHandler(async (req, res) => {
	const { groupId, question, options } = req.body;
	const userId = req.user?._id;

	if (!groupId) throw new ValidationError('groupId is required in request body');
	if (!question || typeof question !== 'string' || !question.trim()) {
		throw new ValidationError('question text is required in request body');
	}

	const result = await aiOrchestrator.ask({
		groupId,
		question: question.trim(),
		userId,
		options: options || {},
	});

	return success(res, {
		message: 'AI query processed successfully',
		data: {
			message: result.message,
			citations: result.citations,
			aiMetadata: result.aiMetadata,
		},
	});
});
