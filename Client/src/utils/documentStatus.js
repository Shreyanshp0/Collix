import {
  AlertCircle,
  Archive,
  CircleCheck,
  File,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Sheet,
} from 'lucide-react';

export const DOCUMENT_STATUS = Object.freeze({
  UPLOADING: 'uploading',
  UPLOADED: 'uploaded',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
});

export const statusBadgeClasses = {
  uploading: 'border-groupBlue text-groupBlue bg-groupBlue/10',
  uploaded: 'border-border text-secondaryText bg-background',
  queued: 'border-groupBlue text-groupBlue bg-groupBlue/10',
  processing: 'border-aiPurple text-aiPurple bg-aiPurple/10',
  ready: 'border-presenceGreen text-presenceGreen bg-presenceGreen/10',
  failed: 'border-red-400 text-red-400 bg-red-400/10',
};

export function getDocumentStatusPresentation(rawStatus, progress = 0) {
  const status = (rawStatus || DOCUMENT_STATUS.UPLOADED).toLowerCase();

  if (status === DOCUMENT_STATUS.UPLOADING) {
    return {
      status,
      label: progress > 0 ? `Uploading... ${progress}%` : 'Uploading...',
      Icon: LoaderCircle,
      className: statusBadgeClasses.uploading,
      spinning: true,
      isTerminal: false,
    };
  }

  if (status === DOCUMENT_STATUS.READY) {
    return {
      status,
      label: '✓ AI Indexed',
      Icon: CircleCheck,
      className: statusBadgeClasses.ready,
      spinning: false,
      isTerminal: true,
    };
  }

  if (status === DOCUMENT_STATUS.FAILED) {
    return {
      status,
      label: 'AI Index Failed',
      Icon: AlertCircle,
      className: statusBadgeClasses.failed,
      spinning: false,
      isTerminal: true,
    };
  }

  if (status === DOCUMENT_STATUS.PROCESSING) {
    return {
      status,
      label: 'AI Indexing...',
      Icon: LoaderCircle,
      className: statusBadgeClasses.processing,
      spinning: true,
      isTerminal: false,
    };
  }

  if (status === DOCUMENT_STATUS.QUEUED) {
    return {
      status,
      label: 'AI Queued',
      Icon: LoaderCircle,
      className: statusBadgeClasses.queued,
      spinning: true,
      isTerminal: false,
    };
  }

  return {
    status: DOCUMENT_STATUS.UPLOADED,
    label: 'Awaiting AI',
    Icon: LoaderCircle,
    className: statusBadgeClasses.uploaded,
    spinning: true,
    isTerminal: false,
  };
}

export function getDocumentIcon(doc) {
  const name = (doc?.originalName || doc?.name || '').toLowerCase();
  const mimeType = (doc?.mimeType || '').toLowerCase();
  if (mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) return ImageIcon;
  if (mimeType.includes('sheet') || /\.(xlsx|xls|csv)$/.test(name)) return Sheet;
  if (mimeType.includes('zip') || /\.(zip|rar|7z|tar|gz)$/.test(name)) return Archive;
  if (mimeType.includes('word') || /\.(docx?|odt)$/.test(name)) return File;
  return FileText;
}

export function formatDocumentSize(bytes) {
  if (typeof bytes === 'string') return bytes;
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDocumentType(mimeType, name = '') {
  const filename = name.toLowerCase();
  if (mimeType?.includes('pdf') || filename.endsWith('.pdf')) return 'PDF';
  if (mimeType?.includes('word') || filename.endsWith('.docx') || filename.endsWith('.doc')) return 'DOCX';
  if (mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(filename)) return 'IMAGE';
  if (mimeType?.includes('sheet') || /\.(xlsx|xls|csv)$/.test(filename)) return 'SHEET';
  if (mimeType?.includes('zip') || /\.(zip|rar|7z|tar|gz)$/.test(filename)) return 'ARCHIVE';
  if (mimeType?.includes('markdown') || filename.endsWith('.md')) return 'MARKDOWN';
  if (mimeType?.includes('text') || filename.endsWith('.txt')) return 'TXT';
  return 'FILE';
}
