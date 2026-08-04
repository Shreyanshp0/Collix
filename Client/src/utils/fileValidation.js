export const FILE_VALIDATION_CONSTANTS = Object.freeze({
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024, // 20MB
  MAX_FILES_AT_ONCE: 5,
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.txt', '.md'],
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
  ],
});

export function validateFilesForUpload(fileList, existingDocuments = []) {
  const files = Array.from(fileList || []);
  if (files.length === 0) {
    return { valid: false, error: 'Please select at least one file to upload.' };
  }

  if (files.length > FILE_VALIDATION_CONSTANTS.MAX_FILES_AT_ONCE) {
    return {
      valid: false,
      error: `You can upload a maximum of ${FILE_VALIDATION_CONSTANTS.MAX_FILES_AT_ONCE} files at a time.`,
    };
  }

  const existingNames = new Set(
    (existingDocuments || []).map((d) => (d.originalName || d.name || '').toLowerCase())
  );

  const validFiles = [];

  for (const file of files) {
    if (file.size <= 0) {
      return { valid: false, error: `File "${file.name}" is empty (0 bytes).` };
    }

    if (file.size > FILE_VALIDATION_CONSTANTS.MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds the maximum allowed size of 20MB.`,
      };
    }

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!FILE_VALIDATION_CONSTANTS.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Unsupported file format for "${file.name}". Allowed formats: PDF, DOCX, TXT, MD.`,
      };
    }

    if (existingNames.has(file.name.toLowerCase())) {
      return {
        valid: false,
        error: `A document named "${file.name}" already exists in this group.`,
      };
    }

    validFiles.push(file);
  }

  return { valid: true, files: validFiles };
}
