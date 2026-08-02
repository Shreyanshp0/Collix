import multer from 'multer';
import { UPLOAD_CONSTANTS } from '../constants/upload.js';
import { ValidationError } from '../utils/AppError.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
	const mimeType = file.mimetype?.toLowerCase();

	if (!UPLOAD_CONSTANTS.ALLOWED_EXTENSIONS.includes(extension)) {
		return cb(new ValidationError('Unsupported file extension'));
	}

	if (!UPLOAD_CONSTANTS.ALLOWED_MIME_TYPES.includes(mimeType)) {
		return cb(new ValidationError('Unsupported file type'));
	}

	cb(null, true);
};

const upload = multer({
	storage,
	limits: {
		fileSize: UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES,
		files: UPLOAD_CONSTANTS.MAX_FILES,
	},
	fileFilter,
});

export const uploadDocuments = upload.array('documents', UPLOAD_CONSTANTS.MAX_FILES);
export default uploadDocuments;
