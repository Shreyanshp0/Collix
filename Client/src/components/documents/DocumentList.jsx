import {
  AlertCircle,
  ArrowUpDown,
  Download,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import {
  formatDocumentSize,
  formatDocumentType,
  getDocumentIcon,
  getDocumentStatusPresentation,
} from '../../utils/documentStatus.js';

function formatDate(isoString) {
  if (!isoString) return 'Recently';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoString;
  }
}

function DocumentList({
  documents = [],
  loading = false,
  error = null,
  uploadProgressMap = {},
  onDeleteDocument,
  onRetry,
  enableControls = false,
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const visibleDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...documents]
      .filter((doc) => {
        const name = `${doc.originalName || ''} ${doc.name || ''}`.toLowerCase();
        return (!normalizedQuery || name.includes(normalizedQuery)) && (typeFilter === 'all' || formatDocumentType(doc.mimeType, doc.name) === typeFilter);
      })
      .sort((a, b) => {
        const aDate = new Date(a.uploadedAt || 0).getTime();
        const bDate = new Date(b.uploadedAt || 0).getTime();
        return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
      });
  }, [documents, query, sortOrder, typeFilter]);

  const handleDelete = async (doc) => {
    if (!doc || !doc.id) return;
    if (!onDeleteDocument) return;
    if (!window.confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

    setDeletingId(doc.id);
    try {
      await onDeleteDocument(doc.id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (doc) => {
    const fileUrl = doc.storage?.url || doc.url;
    if (!fileUrl) return;

    const fileName = doc.originalName || doc.name || 'document';

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Blob download failed, falling back to direct link download:', err);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.download = fileName;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
          Upload PDFs, DOCX, TXT or Markdown files to make them available in the shared workspace library.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enableControls && (
        <div className="grid gap-2 border-2 border-border bg-background p-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondaryText" strokeWidth={2} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search documents..."
              className="w-full border border-border bg-[#0f131b] py-2 pl-8 pr-2 text-xs text-primaryText outline-none placeholder:text-secondaryText focus:border-groupBlue"
            />
          </label>
          <label className="flex items-center gap-1 border border-border bg-[#0f131b] px-2 text-xs text-secondaryText">
            <Filter className="h-4 w-4" strokeWidth={2} />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="min-w-0 bg-transparent py-2 text-xs text-primaryText outline-none">
              <option value="all">All types</option>
              <option value="PDF">PDF</option>
              <option value="DOCX">DOCX</option>
              <option value="IMAGE">Images</option>
              <option value="SHEET">Spreadsheets</option>
              <option value="ARCHIVE">Archives</option>
              <option value="TXT">Text</option>
              <option value="MARKDOWN">Markdown</option>
              <option value="FILE">Other</option>
            </select>
          </label>
          <label className="flex items-center gap-1 border border-border bg-[#0f131b] px-2 text-xs text-secondaryText">
            <ArrowUpDown className="h-4 w-4" strokeWidth={2} />
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="min-w-0 bg-transparent py-2 text-xs text-primaryText outline-none">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </label>
        </div>
      )}

      {visibleDocuments.length === 0 ? (
        <div className="border-2 border-dashed border-border bg-[#0f131b] px-4 py-8 text-center text-xs text-secondaryText">
          No documents match these filters.
        </div>
      ) : visibleDocuments.map((doc) => {
        const uploaderName =
          doc.uploadedBy?.name || doc.uploadedBy?.username || (typeof doc.uploadedBy === 'string' ? doc.uploadedBy : 'User');
        const rawStatus = (doc.status || doc.processingStatus || 'uploaded').toLowerCase();
        const progress = uploadProgressMap[doc.tempId || doc.id] || 0;
        const status = getDocumentStatusPresentation(rawStatus, progress);
        const fileTypeLabel = formatDocumentType(doc.mimeType, doc.name);
        const formattedSize = formatDocumentSize(doc.size);
        const fileUrl = doc.storage?.url || doc.url;
        const DocumentIcon = getDocumentIcon(doc);
        const StatusIcon = status.Icon;

        return (
          <div key={doc.id} className="group border-2 border-border bg-[#0f131b] px-3 py-2.5 transition-colors hover:border-groupBlue/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <DocumentIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-groupBlue" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black uppercase tracking-[0.08em] text-primaryText truncate" title={doc.name}>
                    {doc.originalName || doc.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-secondaryText">
                    {formattedSize} • {formatDate(doc.uploadedAt)} • {uploaderName}
                  </p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="border border-border bg-background px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-secondaryText">{fileTypeLabel}</span>
                    <span className={`flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${status.className}`}>
                      <StatusIcon className={`h-3 w-3 ${status.spinning ? 'animate-spin' : ''}`} strokeWidth={2} />
                      {status.label}
                    </span>
                  </div>
                  {rawStatus === 'uploading' && (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-sm border border-border bg-background">
                      <div className="h-full bg-groupBlue transition-all duration-150" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {fileUrl && (
                  <>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center border-2 border-border bg-background text-primaryText hover:border-groupBlue hover:text-groupBlue transition-colors"
                      title="Preview document"
                      aria-label={`Preview ${doc.name || 'document'}`}
                    >
                      <Eye className="h-4 w-4" strokeWidth={2} />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="flex h-8 w-8 items-center justify-center border-2 border-border bg-background text-primaryText hover:border-presenceGreen hover:text-presenceGreen transition-colors"
                      title="Download document"
                      aria-label={`Download ${doc.name || 'document'}`}
                    >
                      <Download className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </>
                )}

                {onDeleteDocument && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="flex h-8 w-8 items-center justify-center border-2 border-border bg-background text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DocumentList;
