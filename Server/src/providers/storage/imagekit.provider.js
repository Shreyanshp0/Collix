import ImageKit from 'imagekit';
import { DependencyError, ValidationError } from '../../utils/AppError.js';

function getImageKitInstance() {
	if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
		throw new DependencyError('ImageKit credentials are not configured in environment variables');
	}

	return new ImageKit({
		publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
		privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
		urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
	});
}

class ImageKitStorageProvider {
	async uploadFile(file, options = {}) {
		const imagekit = getImageKitInstance();

		if (!file || !file.buffer) {
			throw new ValidationError('File buffer is required for document upload');
		}
		if (!file.originalname || typeof file.originalname !== 'string') {
			throw new ValidationError('File originalname is required');
		}
		if (!file.mimetype || typeof file.mimetype !== 'string') {
			throw new ValidationError('File mimetype is required');
		}
		if (typeof file.size !== 'number' || file.size <= 0) {
			throw new ValidationError('File size must be a positive number');
		}

		return new Promise((resolve, reject) => {
			imagekit.upload(
				{
					file: file.buffer,
					fileName: file.originalname,
					folder: options.folder || '/collix/documents',
					useUniqueFileName: true,
				},
				(error, result) => {
					if (error) {
						reject(new DependencyError(`ImageKit storage upload failed: ${error.message || 'Storage error'}`));
						return;
					}

					resolve({
						provider: 'imagekit',
						url: result.url,
						key: result.fileId,
						publicId: result.fileId,
						bucket: 'imagekit',
						metadata: result,
					});
				}
			);
		});
	}

	async deleteFile(storageRef) {
		const fileId = storageRef?.key || (typeof storageRef === 'string' ? storageRef : null);
		if (!fileId) {
			return null;
		}

		const imagekit = getImageKitInstance();

		return new Promise((resolve, reject) => {
			imagekit.deleteFile(fileId, (error, result) => {
				if (error) {
					reject(new DependencyError(`ImageKit storage deletion failed: ${error.message || 'Storage error'}`));
					return;
				}
				resolve(result);
			});
		});
	}
}

export default new ImageKitStorageProvider();
