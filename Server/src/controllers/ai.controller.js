import { NotImplementedError } from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const create = asyncHandler(async () => {
	throw new NotImplementedError('AI HTTP operations');
});
