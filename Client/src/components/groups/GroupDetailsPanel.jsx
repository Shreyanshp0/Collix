import { useState } from 'react';
import Modal from '../shared/Modal.jsx';
import DocumentList from '../documents/DocumentList.jsx';
import { initialGroups } from '../../lib/groups.js';

function TagPill({ children }) {
  return (
    <span className="inline-block mr-1 mb-1 rounded-sm border-2 border-border bg-background px-2 py-1 text-xs font-bold uppercase tracking-[0.06em] text-primaryText">{children}</span>
  );
}

export default function GroupDetailsPanel({ activeGroupId, onCollapse, loading = false }) {
  const [showDocs, setShowDocs] = useState(false);
  const group = initialGroups.find((g) => g.id === activeGroupId) || initialGroups[0];

  return (
    <section className="dashboard-shell noise-panel flex min-h-0 flex-1 flex-col px-2 py-2">
      <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
        <p className="section-label text-groupBlue">01 GROUP OVERVIEW</p>
        {onCollapse && (
          <button type="button" onClick={onCollapse} className="rounded-sm border-2 border-border bg-background px-2 py-1 text-xs font-black uppercase tracking-[0.08em]">
            Collapse
          </button>
        )}
      </div>

      <div className="scroll-panel mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-2">
          {/* Card 1: Group Overview (compact) */}
          <div className="rounded-sm border-2 border-border bg-[#0f131b] px-2 py-1.5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-border bg-groupBlue text-primaryText font-black">{group.name.charAt(0)}</div>
              <div className="min-w-0">
                <div className="text-sm font-black uppercase tracking-[0.12em] text-primaryText">{group.name}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.06em] text-secondaryText">{group.description}</div>
                <div className="mt-1 text-xs text-secondaryText">{group.members} Members • {group.docs} Docs</div>
              </div>
            </div>
          </div>

          {/* Card 2: AI Knowledge Status (hero, compact) */}
          <div className="rounded-sm border-2 border-border bg-[#0f131b] px-2 py-1.5">
            <div className="text-xs font-black uppercase tracking-[0.08em] text-primaryText">AI STATUS</div>
            <div className="mt-1">
              <div className="text-sm font-black uppercase tracking-[0.06em] text-aiPurple">{group.aiReady ? '● AI READY' : '● CHAT ONLY'}</div>
              <div className="mt-1 text-xs text-secondaryText">Knowledge {group.contextHealthy ? 'Healthy' : 'Syncing...'}</div>
              <div className="mt-1 text-xs text-secondaryText">{group.docs} PDFs • {group.lastIndexed ? Math.round((Date.now() - group.lastIndexed) / 60000) + 'm' : 'N/A'} ago</div>
            </div>
          </div>

          {/* Card 3: Tech Stack / Tags */}
          <div className="rounded-sm border-2 border-border bg-[#0f131b] px-2 py-1.5">
            <div className="text-xs font-black uppercase tracking-[0.08em] text-primaryText">TECH STACK</div>
            <div className="mt-2 flex flex-wrap">
              {(group.tags || []).slice(0, 8).map((t) => (
                <TagPill key={t}>{t}</TagPill>
              ))}
            </div>
          </div>

          {/* Card 4: Recent Activity (compact) */}
          <div className="rounded-sm border-2 border-border bg-[#0f131b] px-2 py-1.5">
            <div className="text-xs font-black uppercase tracking-[0.08em] text-primaryText">RECENT ACTIVITY</div>
            <div className="mt-1 space-y-1 text-sm text-secondaryText">
              {(group.recentFiles || []).slice(0, 3).map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <span>📄</span>
                  <button type="button" onClick={() => setShowDocs(true)} className="text-secondaryText truncate text-sm">{f}</button>
                </div>
              ))}

              {(group.pinned || []).slice(0, 3).map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <span>📌</span>
                  <div className="text-secondaryText truncate text-sm">{p}</div>
                </div>
              ))}

              <div className="mt-1 text-xs text-secondaryText">🤖 AI answered {Math.max(0, Math.floor((group.messages || 0) / 10))} Qs today</div>
            </div>
          </div>
        </div>
      </div>

      {showDocs && (
        <Modal isOpen={showDocs} onClose={() => setShowDocs(false)} size="md" sectionLabel="TRACKED PDFs" title="Tracked PDFs">
          <DocumentList documents={(group.recentFiles || []).map((name) => ({ name }))} />
        </Modal>
      )}
    </section>
  );
}
