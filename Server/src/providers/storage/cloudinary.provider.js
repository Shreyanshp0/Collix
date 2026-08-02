import cloudinary from 'cloudinary';
import { DependencyError } from '../../utils/AppError.js';

cloudinary.v2.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryStorageProvider {
	async uploadFile(file, options = {}) {
		if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
			throw new DependencyError('Cloudinary credentials are not configured');
		}

		if (!file?.buffer) {
			throw new DependencyError('Cloudinary upload requires a buffered file');
		}

		return new Promise((resolve, reject) => {
			const uploadStream = cloudinary.v2.uploader.upload_stream(
				{
					resource_type: 'raw', 
					folder: options.folder || 'collix/documents',
					public_id: options.publicId,
					overwrite: false,
					use_filename: true,
					unique_filename: true,
				},
				(error, result) => {
					if (error) {
						reject(error);
						return;
					}

					resolve({
						provider: 'cloudinary',
						url: result?.secure_url || result?.url,
						key: result?.public_id,
						publicId: result?.public_id,
						bucket: result?.resource_type,
						metadata: result,
					});
				}
			);

			uploadStream.end(file.buffer);
		});
	}

	async deleteFile(storageRef) {
		if (!storageRef?.key) {
			return null;
		}

		return new Promise((resolve, reject) => {
			cloudinary.v2.uploader.destroy(storageRef.key, { resource_type: 'raw' }, (error, result) => {
				if (error) {
					reject(error);
					return;
				}
				resolve(result);
			});
		});
	}
}

export default new CloudinaryStorageProvider();
