import { HelpCircle } from 'lucide-react';
import { useState } from 'react';
import Modal from '../shared/Modal.jsx';
import SourceDrawer from './SourceDrawer.jsx';

const confidenceBadgeClasses = {
  HIGH: 'border-presenceGreen text-presenceGreen bg-presenceGreen/10',
  MEDIUM: 'border-warning text-warning bg-warning/10',
  LOW: 'border-secondaryText text-secondaryText bg-background',
};

function AIResponse({ response, loading, error, documents = [] }) {
  const [selectedSource, setSelectedSource] = useState(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  if (loading) {
    return (
      <section className="rounded-md border-2 border-aiPurple bg-surface p-4 shadow-ai">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-aiPurple border-t-transparent" />
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-aiPurple">
            Searching Knowledge Base & Generating Answer...
          </span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-md border-2 border-red-500/50 bg-red-500/10 p-4 shadow-panel">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-red-400">
          AI Error: {error}
        </span>
      </section>
    );
  }

  if (!response) return null;

  const { answer, confidence, sources = [] } = response;
  const level = confidence?.level || 'LOW';
  const scorePercent =
    typeof confidence?.score === 'number' && confidence.score > 0
      ? `${Math.round(confidence.score * 100)}%`
      : null;

  const badgeClass = confidenceBadgeClasses[level] || confidenceBadgeClasses.LOW;

  return (
    <>
      <section className="rounded-md border-2 border-aiPurple bg-surface p-5 shadow-ai">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-aiPurple/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-aiPurple font-bold">✦</span>
            <p className="section-label text-aiPurple">AI Assistant</p>
            <span className="rounded-md border-2 border-aiPurple px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-aiPurple">
              RAG Grounded
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Confidence Badge */}
            <span
              className={`rounded-sm border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${badgeClass}`}
              title="Confidence derived from vector retrieval quality"
            >
              Confidence: {level} {scorePercent ? `• ${scorePercent}` : ''}
            </span>

            {/* Explain Action Button */}
            {sources && sources.length > 0 && (
              <button
                type="button"
                onClick={() => setIsExplainOpen(true)}
                className="flex items-center gap-1 rounded-sm border border-aiPurple/60 bg-aiPurple/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-aiPurple hover:bg-aiPurple/20 transition-colors"
                title="Explain retrieval reasoning"
              >
                <HelpCircle className="h-3 w-3" />
                <span>Explain</span>
              </button>
            )}
          </div>
        </div>

        {/* Answer Content */}
        <p className="mt-3 text-sm leading-6 text-primaryText whitespace-pre-wrap">{answer}</p>

        {/* Source Pills (Interactive) */}
        {sources && sources.length > 0 && (
          <div className="mt-4 border-t-2 border-aiPurple/40 pt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-aiPurple mb-2">
              Sources Referenced (Click to inspect evidence):
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {sources.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSource(src)}
                  className="flex items-center gap-1 rounded-sm border-2 border-aiPurple/60 bg-aiPurple/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primaryText hover:bg-aiPurple/30 hover:border-aiPurple transition-colors text-left"
                  title="Click to view excerpt & source details"
                >
                  <span>📄 {src.name || src.filename || 'Document'}</span>
                  {src.page ? <span className="text-secondaryText">• Page {src.page}</span> : null}
                  {src.chunk != null ? <span className="text-secondaryText">(Chunk {src.chunk})</span> : null}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Interactive Source Drawer */}
      {selectedSource && (
        <SourceDrawer
          isOpen={Boolean(selectedSource)}
          onClose={() => setSelectedSource(null)}
          source={selectedSource}
          documents={documents}
        />
      )}

      {/* Explain Answer Modal */}
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
            {/* Confidence Breakdown Card */}
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

            {/* Chunks Retrieval Breakdown */}
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
    </>
  );
}

export default AIResponse;
