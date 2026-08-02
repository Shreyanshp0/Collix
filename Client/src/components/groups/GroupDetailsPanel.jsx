import { useState } from 'react';
import Modal from '../shared/Modal.jsx';
import DocumentList from '../documents/DocumentList.jsx';
import { initialGroups } from '../../lib/groups.js';

function TagPill({ children }) {
  return (
    <span className="inline-block mr-1 mb-1 rounded-sm border-2 border-border bg-background px-2 py-1 text-xs font-bold uppercase tracking-[0.06em] text-primaryText">{children}</span>
  );
}

export default function GroupDetailsPanel({ activeGroupId, onCollapse, loading = false, documents = [], members = [] }) {
  const [showDocs, setShowDocs] = useState(false);
  const group = initialGroups.find((g) => g.id === activeGroupId) || initialGroups[0];

  const memberCount = (members && members.length) || group.members || 0;
  const docCount = documents ? documents.filter((d) => d.groupId === activeGroupId).length : (group.docs || 0);

  const recentDocs = documents ? documents.filter((d) => d.groupId === activeGroupId).slice(0, 3) : [];

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return iso || 'Unknown';
    }
  };

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
                <div className="mt-1 text-xs uppercase tracking-[0.06em] text-secondaryText">{group.description || 'No description provided.'}</div>
                <div className="mt-1 text-xs text-secondaryText">{memberCount} Members • {docCount} Documents</div>
                <div className="mt-1 text-xs text-secondaryText">Created • {group.createdAt ? formatDate(group.createdAt) : 'Unknown'}</div>
              </div>
            </div>
          </div>

          {/* Card 2: Recent Activity (documents-driven) */}
          <div className="rounded-sm border-2 border-border bg-[#0f131b] px-2 py-1.5">
            <div className="text-xs font-black uppercase tracking-[0.08em] text-primaryText">RECENT ACTIVITY</div>
            <div className="mt-1 space-y-1 text-sm text-secondaryText">
              {recentDocs.length === 0 ? (
                <div className="text-secondaryText">No recent activity.</div>
              ) : (
                recentDocs.map((d) => (
                  <div key={d.id} className="flex items-center gap-2">
                    <span>📄</span>
                    <button type="button" onClick={() => setShowDocs(true)} className="text-secondaryText truncate text-sm">{d.name}</button>
                    <span className="ml-2 text-[11px] text-secondaryText">{d.uploadedAt ? (typeof d.uploadedAt === 'string' && d.uploadedAt.length > 10 ? new Date(d.uploadedAt).toLocaleString() : d.uploadedAt) : ''}</span>
                  </div>
                ))
              )}
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
