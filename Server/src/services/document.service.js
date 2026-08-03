import documentProcessor from './rag/documentProcessor.service.js';
import Document from '../models/Document.js';
import GroupMember from '../models/GroupMember.js';
import Group from '../models/Group.js';
import { AuthorizationError, ConflictError, DependencyError, NotFoundError, ValidationError } from '../utils/AppError.js';
import { DOCUMENT_PROCESSING_STATUS, DOCUMENT_PROCESSING_STATUS_VALUES } from '../constants/documentStatus.js';
import { UPLOAD_CONSTANTS } from '../constants/upload.js';
import storageProvider from '../providers/storage/storage.provider.js';
import { toDocumentDto } from '../mappers/document.mapper.js';
import { GROUP_ROLES } from '../constants/roles.js';
import defaultLogger, { assertLogger } from '../utils/logger.js';
import eventBus from './eventBus.service.js';

function getId(value) {
	return value?.toString?.() || value?._id?.toString?.() || value;
}

function buildDocumentMetadata(file) {
	return {
		originalName: file.originalname,
		name: file.originalname,
		size: file.size,
		mimeType: file.mimetype,
	};
}

async function ensureGroupAccess({ userId, groupId }) {
	if (!userId || !groupId) {
		throw new ValidationError('User and group context are required');
	}

	const group = await Group.findById(groupId).lean();
	if (!group) {
		throw new NotFoundError('Group');
	}

	const membership = await GroupMember.findOne({ group: groupId, user: userId, banned: false }).lean();
	if (!membership) {
		throw new AuthorizationError('You do not have access to this group');
	}

	return { group, membership };
}

export function createDocumentService({ provider = storageProvider, logger = defaultLogger } = {}) {
	assertLogger(logger);

	async function uploadDocument({ userId, groupId, files }) {
		if (!Array.isArray(files) || files.length === 0) {
			throw new ValidationError('At least one document is required');
		}

		if (files.length > UPLOAD_CONSTANTS.MAX_FILES) {
			throw new ValidationError(`You can upload up to ${UPLOAD_CONSTANTS.MAX_FILES} files at once`);
		}

		const { group, membership } = await ensureGroupAccess({ userId, groupId });
		if (!membership || ![GROUP_ROLES.OWNER, GROUP_ROLES.ADMIN, GROUP_ROLES.MODERATOR, GROUP_ROLES.MEMBER].includes(membership.role)) {
			throw new AuthorizationError('You do not have permission to upload documents to this group');
		}

		const createdDocs = [];
		for (const file of files) {
			const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
			const mimeType = file.mimetype?.toLowerCase();

			if (!UPLOAD_CONSTANTS.ALLOWED_EXTENSIONS.includes(extension)) {
				throw new ValidationError(`Unsupported file extension: ${extension}`);
			}

			if (!UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES.includes(mimeType)) {
				throw new ValidationError(`Unsupported MIME type: ${mimeType}`);
			}

			if (file.size > UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES) {
				throw new ValidationError(`File size exceeds the maximum of ${UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES} bytes`);
			}

			logger.info('Document upload started', {
				groupId: groupId.toString(),
				userId: userId.toString(),
				filename: file.originalname,
				size: file.size,
			});

			try {
				const storageResult = await provider.uploadFile(file, { folder: `collix/groups/${groupId}` });
				const document = await Document.create({
					group: groupId,
					uploadedBy: userId,
					name: file.originalname,
					originalName: file.originalname,
					mimeType,
					size: file.size,
					storage: {
						provider: storageResult.provider,
						key: storageResult.key,
						url: storageResult.url,
						bucket: storageResult.bucket,
					},
					processingStatus: DOCUMENT_PROCESSING_STATUS.UPLOADED,
					metadata: {
						...buildDocumentMetadata(file),
						processingError: null,
						vectorized: false,
						indexedAt: null,
						vectorizedAt: null,
						embeddingVersion: null,
						chunkCount: 0,
					},
					version: 1,
				});

				await document.populate('uploadedBy', 'name username avatar');

				logger.info('Document upload completed', {
					groupId: groupId.toString(),
					userId: userId.toString(),
					filename: file.originalname,
					documentId: document._id.toString(),
				});

				eventBus.publish('DOCUMENT_UPLOADED', {
					documentId: document._id.toString(),
					groupId: groupId.toString(),
					uploadedBy: userId.toString(),
					uploaderName: document.uploadedBy?.name || 'A group member',
					filename: file.originalname,
				});

				createdDocs.push(document);

				try {
					documentProcessor.enqueueDocument(document._id);
				} catch (queueErr) {
					logger.error('Failed to enqueue document for knowledge processing', {
						documentId: document._id.toString(),
						error: queueErr?.message || queueErr,
					});
				}
			} catch (uploadErr) {
				logger.error('Document upload failed', {
					groupId: groupId.toString(),
					userId: userId.toString(),
					filename: file.originalname,
					error: uploadErr?.message || uploadErr,
				});
				throw uploadErr;
			}
		}

		return createdDocs.map((document) => toDocumentDto(document));
	}

	async function listDocuments({ userId, groupId }) {
		await ensureGroupAccess({ userId, groupId });
		const documents = await Document.find({ group: groupId })
			.populate('uploadedBy', 'name username avatar')
			.sort({ uploadedAt: -1 })
			.lean();
		return documents.map((document) => toDocumentDto(document));
	}

	async function getDocument({ userId, documentId }) {
		const document = await Document.findById(documentId)
			.populate('uploadedBy', 'name username avatar')
			.lean();
		if (!document) {
			throw new NotFoundError('Document');
		}
		await ensureGroupAccess({ userId, groupId: document.group });
		return toDocumentDto(document);
	}

	async function deleteDocument({ userId, documentId }) {
		const document = await Document.findById(documentId);
		if (!document) {
			throw new NotFoundError('Document');
		}

		const { membership } = await ensureGroupAccess({ userId, groupId: document.group });
		const isUploader = getId(document.uploadedBy) === getId(userId);
		const canDelete = isUploader || [GROUP_ROLES.OWNER, GROUP_ROLES.ADMIN].includes(membership.role);

		if (!canDelete) {
			throw new AuthorizationError('You do not have permission to delete this document');
		}

		if (document.storage?.key) {
			try {
				await provider.deleteFile(document.storage);
			} catch (error) {
				logger.error('Failed to delete document from storage provider', { error, documentId, key: document.storage.key });
			}
		}

		await Document.deleteOne({ _id: documentId });
		return { success: true };
	}

	return { deleteDocument, getDocument, listDocuments, uploadDocument };
}

const documentService = createDocumentService();
export const { deleteDocument, getDocument, listDocuments, uploadDocument } = documentService;
export default documentService;
