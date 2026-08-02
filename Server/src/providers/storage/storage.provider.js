export class StorageProvider {
	async uploadFile(_file, _options = {}) {
		throw new Error('Storage provider must implement uploadFile');
	}

	async deleteFile(_storageRef, _options = {}) {
		throw new Error('Storage provider must implement deleteFile');
	}
}

export default StorageProvider;
