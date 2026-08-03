import { ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../shared/Modal.jsx';

function SourceDrawer({ isOpen, onClose, source, documents = [] }) {
  const [copied, setCopied] = useState(false);

  if (!source) return null;

  const docName = source.name || source.filename || 'Document';
  const pageLabel = source.page != null ? `Page ${source.page}` : null;
  const chunkLabel = source.chunk != null ? `Chunk ${source.chunk}` : null;
  const similarityScorePercent =
    typeof source.similarityScore === 'number'
      ? `${Math.round(source.similarityScore * 100)}%`
      : null;

  // Find matching document from workspace documents list to get file storage URL
  const matchingDoc = documents.find(
    (d) =>
      d.id === source.documentId ||
      d.name?.toLowerCase() === docName.toLowerCase() ||
      d.originalName?.toLowerCase() === docName.toLowerCase(),
  );

  const fileUrl = matchingDoc?.storage?.url || matchingDoc?.url;

  const citationText = `${docName}${pageLabel ? `, ${pageLabel}` : ''}${chunkLabel ? ` (${chunkLabel})` : ''}`;

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(citationText);
    setCopied(true);
    toast.success('Citation copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      sectionLabel="SOURCE EVIDENCE"
      title="Source Evidence"
      subtitle="Inspect retrieved document chunk context"
    >
      <div className="space-y-4">
        {/* Document Header & Badges */}
        <div className="rounded-sm border-2 border-border bg-[#0f131b] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-black uppercase tracking-[0.1em] text-primaryText truncate">
              📄 {docName}
            </h4>
            {similarityScorePercent && (
              <span className="rounded-sm border border-aiPurple bg-aiPurple/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-aiPurple">
                {similarityScorePercent} Match
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {pageLabel && (
              <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-secondaryText">
                {pageLabel}
              </span>
            )}
            {chunkLabel && (
              <span className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-secondaryText">
                {chunkLabel}
              </span>
            )}
          </div>
        </div>

        {/* Highlighted Excerpt Snippet */}
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-aiPurple">
            Retrieved Text Excerpt
          </p>
          <div className="rounded-sm border-2 border-aiPurple/40 bg-[#12101b] p-3 text-xs leading-6 text-primaryText font-mono whitespace-pre-wrap">
            {source.snippet || 'No excerpt text available.'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={handleCopyCitation}
            className="flex items-center gap-1.5 rounded-sm border-2 border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-primaryText hover:bg-white/5 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-presenceGreen" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Citation'}</span>
          </button>

          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-sm border-2 border-aiPurple bg-aiPurple px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-white hover:bg-aiPurple/80 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open Document</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex items-center gap-1.5 rounded-sm border-2 border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-secondaryText opacity-50 cursor-not-allowed"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>File Unavailable</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default SourceDrawer;
