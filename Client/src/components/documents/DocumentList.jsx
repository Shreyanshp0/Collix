import { AlertCircle, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

const statusBadgeClasses = {
  ready: 'border-presenceGreen text-presenceGreen bg-presenceGreen/10',
  processing: 'border-warning text-warning bg-warning/10',
  queued: 'border-groupBlue text-groupBlue bg-groupBlue/10',
  uploaded: 'border-border text-secondaryText bg-background',
  failed: 'border-red-400 text-red-400 bg-red-400/10',
};

function formatSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatType(mimeType, name = '') {
  const filename = name.toLowerCase();
  if (mimeType?.includes('pdf') || filename.endsWith('.pdf')) return 'PDF';
  if (mimeType?.includes('word') || filename.endsWith('.docx') || filename.endsWith('.doc')) return 'DOCX';
  if (mimeType?.includes('markdown') || filename.endsWith('.md')) return 'MARKDOWN';
  if (mimeType?.includes('text') || filename.endsWith('.txt')) return 'TXT';
  return 'FILE';
}

function formatDate(isoString) {
  if (!isoString) return 'Recently';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return isoString;
  }
}

function DocumentList({
  documents = [],
  loading = false,
  error = null,
  onDeleteDocument,
  onRetry,
}) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (doc) => {
    if (!doc || !doc.id) return;
    if (!window.confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

    setDeletingId(doc.id);
    try {
      await onDeleteDocument?.(doc.id);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border-2 border-red-500/40 bg-red-500/10 p-6 text-center shadow-panel">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-red-400">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 flex items-center gap-2 rounded-md border-2 border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primaryText"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-sm border-2 border-border bg-[#0f131b] px-4 py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-border bg-background">
          <FileText className="h-5 w-5 text-groupBlue" strokeWidth={2.25} />
        </div>
        <h4 className="mt-3 text-sm font-black uppercase tracking-[0.12em] text-primaryText">
          No documents uploaded yet
        </h4>
        <p className="mt-1 max-w-sm text-xs leading-5 text-secondaryText">
          Upload PDFs, DOCX, TXT or Markdown files to make them searchable by team collaboration spaces.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const uploaderName =
          doc.uploadedBy?.name || doc.uploadedBy?.username || doc.uploadedBy || 'User';
        const rawStatus = (doc.status || doc.processingStatus || 'uploaded').toLowerCase();
        const badgeClass = statusBadgeClasses[rawStatus] || statusBadgeClasses.uploaded;
        const fileTypeLabel = formatType(doc.mimeType, doc.name);
        const formattedSize = formatSize(doc.size);

        return (
          <div key={doc.id} className="border-2 border-border bg-[#0f131b] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-black uppercase tracking-[0.08em] text-primaryText truncate">
                    {doc.name}
                  </p>
                  <span className="rounded-sm border border-border bg-background px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-secondaryText">
                    {fileTypeLabel}
                  </span>
                  <span className="text-[10px] font-bold text-secondaryText">
                    {formattedSize}
                  </span>
                </div>

                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-secondaryText">
                  {uploaderName} • {formatDate(doc.uploadedAt)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`rounded-sm border px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${badgeClass}`}>
                  {rawStatus}
                </span>

                <button
                  type="button"
                  onClick={() => handleDelete(doc)}
                  disabled={deletingId === doc.id}
                  className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-border bg-background text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  title="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DocumentList;
