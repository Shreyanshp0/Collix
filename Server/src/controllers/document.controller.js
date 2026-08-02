import asyncHandler from '../utils/asyncHandler.js';
import { created, success } from '../utils/response.js';
import { uploadDocument, listDocuments, getDocument, deleteDocument } from '../services/document.service.js';
import { validateUploadRequest } from '../validators/document.validator.js';

const create = asyncHandler(async (req, res) => {
	const files = validateUploadRequest(req);
	const documents = await uploadDocument({ userId: req.user._id, groupId: req.params.groupId, files });
	return created(res, { message: 'Documents uploaded successfully', data: { documents } });
});

const list = asyncHandler(async (req, res) => {
	const documents = await listDocuments({ userId: req.user._id, groupId: req.params.groupId });
	return success(res, { message: 'Documents fetched successfully', data: { documents } });
});

const getById = asyncHandler(async (req, res) => {
	const document = await getDocument({ userId: req.user._id, documentId: req.params.documentId });
	return success(res, { message: 'Document fetched successfully', data: { document } });
});

const remove = asyncHandler(async (req, res) => {
	await deleteDocument({ userId: req.user._id, documentId: req.params.documentId });
	return success(res, { message: 'Document deleted successfully', data: {} });
});

export { create, getById, list, remove };
