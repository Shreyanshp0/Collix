import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../shared/Modal.jsx';
import DocumentList from '../documents/DocumentList.jsx';
import groupsApi from '../../api/groups.api.js';

export default function GroupDetailsPanel({
  activeGroupId,
  group,
  onCollapse,
  loading = false,
  documents = [],
  members = [],
}) {
  const [showDocs, setShowDocs] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const navigate = useNavigate();

  const groupName = group?.name || activeGroupId?.replace(/-/g, ' ') || 'Group';
  const description = group?.description || 'No description provided.';
  const memberCount = (members && members.length) || group?.memberCount || 0;
  const docCount = documents ? documents.filter((d) => d.groupId === activeGroupId).length : 0;
  const visibility = group?.visibility === 'public' ? 'PUBLIC' : 'PRIVATE';

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return iso || 'Unknown';
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeGroupId) return;
    if (!window.confirm(`Are you sure you want to leave ${groupName}?`)) return;

    setLeaving(true);
    try {
      await groupsApi.leave(activeGroupId);
      toast.success(`Left group: ${groupName}`);
      navigate('/groups', { replace: true });
    } catch (error) {
      console.error('Leave group error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to leave group';
      toast.error(message);
    } finally {
      setLeaving(false);
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
          {/* Card 1: Group Overview */}
          <div className="rounded-sm border-2 border-border bg-[#0f131b] px-3 py-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-2 border-border bg-groupBlue text-primaryText font-black uppercase">
                {groupName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-sm font-black uppercase tracking-[0.12em] text-primaryText truncate">{groupName}</div>
                  <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] border rounded-sm ${
                    visibility === 'PUBLIC' ? 'border-presenceGreen text-presenceGreen' : 'border-groupBlue text-groupBlue'
                  }`}>
                    {visibility}
                  </span>
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.06em] text-secondaryText leading-relaxed">{description}</div>
                <div className="mt-2 text-xs text-secondaryText font-bold">{memberCount} Members • {docCount} Documents</div>
                <div className="mt-1 text-xs text-secondaryText">Created • {group?.createdAt ? formatDate(group.createdAt) : 'Recently'}</div>
              </div>
            </div>
          </div>

          {/* Action: Leave Group */}
          <div className="rounded-sm border-2 border-border bg-[#0f131b] p-2">
            <button
              type="button"
              onClick={handleLeaveGroup}
              disabled={leaving}
              className="flex w-full items-center justify-center gap-2 rounded-sm border-2 border-red-500/50 bg-red-500/10 py-2 text-xs font-bold uppercase tracking-[0.12em] text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} />
              {leaving ? 'Leaving...' : 'Leave Group'}
            </button>
          </div>
        </div>
      </div>

      {showDocs && (
        <Modal isOpen={showDocs} onClose={() => setShowDocs(false)} size="md" sectionLabel="TRACKED PDFs" title="Tracked PDFs">
          <DocumentList documents={documents} />
        </Modal>
      )}
    </section>
  );
}
