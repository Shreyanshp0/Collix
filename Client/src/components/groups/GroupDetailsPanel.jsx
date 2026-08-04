import { useState } from 'react';
import {
  Bot,
  Eye,
  FolderOpen,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AISettingsModal from './AISettingsModal.jsx';
import groupsApi from '../../api/groups.api.js';
import {
  formatDocumentSize,
  getDocumentIcon,
  getDocumentStatusPresentation,
} from '../../utils/documentStatus.js';

export default function GroupDetailsPanel({
  activeGroupId,
  group,
  onCollapse,
  documents = [],
  members = [],
  onOpenDocuments,
}) {
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const navigate = useNavigate();

  const groupName = group?.name || activeGroupId?.replace(/-/g, ' ') || 'Group';
  const description = group?.description || 'No description provided.';
  const memberCount = (members && members.length) || group?.memberCount || 0;
  const docCount = documents.length;
  const visibility = group?.visibility === 'public' ? 'PUBLIC' : 'PRIVATE';
  const aiDomain = group?.aiConfiguration?.workspaceDomain || 'general';
  const aiPersona = group?.aiConfiguration?.persona || 'mentor';

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return iso || 'Unknown';
    }
  };

  const formatDocumentDate = (iso) => {
    if (!iso) return 'Recently';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getUploaderName = (document) =>
    document.uploadedBy?.name ||
    document.uploadedBy?.username ||
    (typeof document.uploadedBy === 'string' ? document.uploadedBy : 'A group member');

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

          <section className="border-2 border-border bg-[#0f131b] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-groupBlue">
                <FolderOpen className="h-4 w-4" strokeWidth={2.25} />
                <span>Shared Documents</span>
              </div>
              <span className="border border-groupBlue/70 bg-groupBlue/10 px-1.5 py-0.5 text-[10px] font-black text-groupBlue">
                {docCount}
              </span>
            </div>

            {docCount === 0 ? (
              <button
                type="button"
                onClick={onOpenDocuments}
                className="mt-3 flex w-full flex-col items-start gap-2 border border-dashed border-border px-3 py-3 text-left transition-colors hover:border-groupBlue hover:bg-groupBlue/5"
              >
                <FolderOpen className="h-5 w-5 text-groupBlue" strokeWidth={2} />
                <span className="text-xs font-bold text-primaryText">No documents yet</span>
                <span className="text-[10px] leading-4 text-secondaryText">Upload your first document to build the group&apos;s AI knowledge base.</span>
                <span className="border border-groupBlue px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-groupBlue">Upload document</span>
              </button>
            ) : (
              <div className="scroll-panel mt-2 max-h-[286px] space-y-1 overflow-y-auto pr-1">
                {documents.slice(0, 6).map((document) => {
                  const DocumentIcon = getDocumentIcon(document);
                  const indexing = getDocumentStatusPresentation(document.processingStatus || document.status);
                  const fileUrl = document.storage?.url || document.url;
                  const StatusIcon = indexing.Icon;

                  return (
                    <div key={document.id} className="group flex items-start gap-2 border border-transparent px-1.5 py-1.5 transition-all hover:border-groupBlue/60 hover:bg-groupBlue/5">
                      <button
                        type="button"
                        onClick={onOpenDocuments}
                        className="flex min-w-0 flex-1 items-start gap-2 text-left"
                        title={`Open ${document.name || 'document'} details`}
                      >
                        <DocumentIcon className="mt-0.5 h-4 w-4 shrink-0 text-groupBlue" strokeWidth={2} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-primaryText">{document.originalName || document.name || 'Untitled document'}</span>
                          <span className="block truncate text-[10px] text-secondaryText">{formatDocumentSize(document.size)} • {formatDocumentDate(document.uploadedAt)} • {getUploaderName(document)}</span>
                          <span className={`mt-0.5 flex items-center gap-1 text-[10px] font-bold ${indexing.className}`}>
                            <StatusIcon className={`h-3 w-3 ${indexing.spinning ? 'animate-spin' : ''}`} strokeWidth={2} />
                            {indexing.label}
                          </span>
                        </span>
                      </button>
                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 hidden h-7 w-7 items-center justify-center border border-border bg-background text-secondaryText transition-colors hover:border-groupBlue hover:text-groupBlue group-hover:flex focus:flex"
                          title="Preview document"
                          aria-label={`Preview ${document.name || 'document'}`}
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={onOpenDocuments}
              className="mt-3 w-full border-t border-border/60 pt-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-groupBlue transition-colors hover:text-primaryText"
            >
              View All →
            </button>
          </section>

          {/* AI Workspace Card */}
          <div className="rounded-sm border-2 border-border bg-[#0f131b] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-aiPurple">
                <Bot className="h-4 w-4" />
                <span>AI Workspace Persona</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAiSettings(true)}
                className="rounded-sm border border-border bg-background px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-primaryText hover:border-aiPurple"
              >
                Configure
              </button>
            </div>
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-primaryText">
              {aiDomain} • {aiPersona}
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

      {showAiSettings && (
        <AISettingsModal
          isOpen={showAiSettings}
          onClose={() => setShowAiSettings(false)}
          groupId={activeGroupId}
        />
      )}
    </section>
  );
}
