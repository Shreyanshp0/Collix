export const UPLOAD_CONSTANTS = Object.freeze({
	MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
	MAX_FILES: 5,
	ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.txt', '.md', '.markdown'],
	ALLOWED_MIME_TYPES: [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'text/plain',
		'text/markdown',
		'text/x-markdown',
	],
});
