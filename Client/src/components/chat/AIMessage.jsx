import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Modal from '../shared/Modal.jsx';
import SourceDrawer from '../ai/SourceDrawer.jsx';

const confidenceBadgeClasses = {
  HIGH: 'border-presenceGreen text-presenceGreen bg-presenceGreen/10',
  MEDIUM: 'border-warning text-warning bg-warning/10',
  LOW: 'border-secondaryText text-secondaryText bg-background',
};

function formatTime(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

function AIMessage({ messageItem, documents = [] }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  const textContent = messageItem.message || messageItem.content || '';
  const meta = messageItem.meta || messageItem.aiMetadata || {};
  const confidence = meta.confidence || { level: 'LOW', score: 0 };
  const sources = meta.sources || meta.citations || [];

  const level = confidence.level || 'LOW';
  const scorePercent =
    typeof confidence.score === 'number' && confidence.score > 0
      ? `${Math.round(confidence.score * 100)}%`
      : null;

  const badgeClass = confidenceBadgeClasses[level] || confidenceBadgeClasses.LOW;

  return (
    <div
      data-message-id={messageItem.id || messageItem._id}
      className="ml-2 w-full max-w-full rounded-sm border-2 border-aiPurple bg-[#12101b] p-3.5 shadow-ai overflow-hidden"
      style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
    >
      {/* AI Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-aiPurple/30 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-aiPurple bg-background text-aiPurple font-black text-sm">
            🤖
          </div>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-aiPurple truncate">
              {messageItem.author?.name || meta.displayName || 'Nexus AI'}
            </p>
            <span className="rounded-sm border border-aiPurple px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-aiPurple shrink-0">
              RAG Grounded
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Confidence Badge */}
          <span
            className={`rounded-sm border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${badgeClass}`}
            title="Retrieval Quality Confidence"
          >
            Confidence {level} {scorePercent ? `${scorePercent}` : ''}
          </span>

          {/* Explain Button */}
          {sources.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExplainOpen(true)}
              className="flex items-center gap-1 rounded-sm border border-aiPurple/60 bg-aiPurple/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-aiPurple hover:bg-aiPurple/20 transition-colors"
              title="Explain answer retrieval"
            >
              <HelpCircle className="h-3 w-3" />
              <span>Explain</span>
            </button>
          )}

          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondaryText ml-1">
            {formatTime(messageItem.ts || messageItem.createdAt)}
          </span>
        </div>
      </div>

      {/* Render Markdown Content */}
      <div className="prose prose-invert max-w-full mt-3 text-sm leading-6 text-primaryText font-sans space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-base [&_h1]:font-black [&_h2]:text-sm [&_h2]:font-bold [&_code]:bg-background [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-background [&_pre]:p-3 [&_pre]:rounded [&_pre]:border [&_pre]:border-border [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:p-2 [&_td]:border [&_td]:border-border [&_td]:p-2">
        <ReactMarkdown>{textContent}</ReactMarkdown>
      </div>

      {/* Sources Collapsible Accordion */}
      {sources.length > 0 && (
        <div className="mt-4 border-t border-aiPurple/40 pt-2.5">
          <button
            type="button"
            onClick={() => setSourcesOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-aiPurple hover:text-aiPurple/80 transition-colors"
          >
            <span>Sources ({sources.length})</span>
            {sourcesOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {sourcesOpen && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {sources.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSource(src)}
                  className="flex items-center gap-1 rounded-sm border border-aiPurple/60 bg-aiPurple/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primaryText hover:bg-aiPurple/30 transition-colors text-left"
                >
                  <span>📄 {src.name || src.filename || 'Document'}</span>
                  {src.page ? <span className="text-secondaryText">• Page {src.page}</span> : null}
                  {src.chunk != null ? <span className="text-secondaryText">(Chunk {src.chunk})</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Source Inspection Drawer */}
      {selectedSource && (
        <SourceDrawer
          isOpen={Boolean(selectedSource)}
          onClose={() => setSelectedSource(null)}
          source={selectedSource}
          documents={documents}
        />
      )}

      {/* Explain Modal */}
      {isExplainOpen && (
        <Modal
          isOpen={isExplainOpen}
          onClose={() => setIsExplainOpen(false)}
          size="lg"
          sectionLabel="RAG EXPLAINABILITY"
          title="Explain AI Answer Retrieval"
          subtitle="Inspection of vector search candidates and confidence score breakdown"
        >
          <div className="space-y-4">
            <div className="rounded-sm border-2 border-border bg-[#0f131b] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-primaryText">
                  Retrieval Quality Confidence
                </span>
                <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${badgeClass}`}>
                  {level} {scorePercent ? `(${scorePercent})` : ''}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-secondaryText">
                Calculated from top vector candidate similarities. High confidence indicates strong semantic alignment with indexed document text.
              </p>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-aiPurple">
                Retrieved Vector Chunks ({sources.length})
              </p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {sources.map((src, idx) => (
                  <div key={idx} className="rounded-sm border-2 border-border bg-[#0f131b] p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-black uppercase tracking-[0.1em] text-groupBlue">
                        📄 {src.name || src.filename} {src.page ? `• Page ${src.page}` : ''} {src.chunk != null ? `(Chunk ${src.chunk})` : ''}
                      </span>
                      {typeof src.similarityScore === 'number' && (
                        <span className="text-[10px] font-mono font-bold text-aiPurple">
                          Match: {Math.round(src.similarityScore * 100)}%
                        </span>
                      )}
                    </div>
                    {src.snippet && (
                      <p className="mt-1 text-xs leading-5 font-mono text-secondaryText bg-background p-2 rounded-sm border border-border">
                        {src.snippet}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AIMessage;
