import { Router } from 'express';
import authenticate from '../middleware/auth.middleware.js';
import { uploadDocuments } from '../middleware/multer.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { create, getById, list, remove } from '../controllers/document.controller.js';
import { validateDocumentParams, validateDocumentPayload } from '../validators/document.validator.js';

const router = Router();

/**
 * POST /api/v1/groups/:groupId/documents
 * Upload one or more documents to a group.
 */
router.post('/groups/:groupId/documents', authenticate, uploadDocuments, validate({ params: validateDocumentParams }), create);

/**
 * GET /api/v1/groups/:groupId/documents
 * List documents belonging to a group.
 */
router.get('/groups/:groupId/documents', authenticate, validate({ params: validateDocumentParams, query: validateDocumentPayload }), list);

/**
 * GET /api/v1/documents/:documentId
 * Fetch a single document by id.
 */
router.get('/documents/:documentId', authenticate, validate({ params: validateDocumentParams }), getById);

/**
 * DELETE /api/v1/documents/:documentId
 * Delete a document from storage and metadata.
 */
router.delete('/documents/:documentId', authenticate, validate({ params: validateDocumentParams }), remove);

export default router;