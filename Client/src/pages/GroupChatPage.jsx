import { Activity, Hash, FileText, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import groupsApi from '../api/groups.api.js';
import AskAIBox from '../components/ai/AskAIBox.jsx';
import MessageList from '../components/chat/MessageList.jsx';
import DocumentList from '../components/documents/DocumentList.jsx';
import AddMemberForm from '../components/groups/AddMemberForm.jsx';
import GroupDetailsPanel from '../components/groups/GroupDetailsPanel.jsx';
import MemberList from '../components/groups/MemberList.jsx';
import Modal from '../components/shared/Modal.jsx';

function GroupChatPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);

  const fetchGroupDetails = async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      const data = await groupsApi.getById(groupId);
      const groupData = data.group || data;
      const membersData = data.members || groupData.members || [];
      setGroup(groupData);
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to fetch group details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const handleAddDocuments = (newDocuments) => {
    setDocuments((current) => [...newDocuments, ...current]);
  };

  const gridColsClass = detailsCollapsed
    ? 'xl:grid-cols-[64px_minmax(0,1fr)_minmax(260px,18%)]'
    : 'xl:grid-cols-[minmax(260px,18%)_minmax(0,1fr)_minmax(260px,18%)]';

  const groupDisplayName = group?.name || groupId?.replace(/-/g, ' ') || 'Group Chat';

  return (
    <div className="h-full overflow-hidden">
      <div className={`grid h-full grid-cols-1 gap-2 overflow-hidden ${gridColsClass}`}>
        {detailsCollapsed ? (
          <aside className="hidden xl:flex min-h-0 w-16 flex-col items-center gap-3 px-1 py-3">
            <button
              type="button"
              onClick={() => setDetailsCollapsed(false)}
              className="flex h-12 w-12 items-center justify-center rounded-sm border-2 border-border bg-background font-black uppercase text-primaryText"
              aria-label="Open sidebar"
            >
              {groupDisplayName.charAt(0)}
            </button>
            <button type="button" className="flex h-12 w-12 items-center justify-center rounded-sm border-2 border-border bg-background text-primaryText">
              <FileText className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <button type="button" className="flex h-12 w-12 items-center justify-center rounded-sm border-2 border-border bg-background text-primaryText">
              <Users className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </aside>
        ) : (
          <aside className="hidden xl:flex min-h-0 min-w-0 flex-col">
            <GroupDetailsPanel
              activeGroupId={groupId}
              group={group}
              onCollapse={() => setDetailsCollapsed(true)}
              loading={loading}
              documents={documents}
              members={members}
            />
          </aside>
        )}

        <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <section className="dashboard-shell noise-panel accent-purple flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-border/40 px-3 py-1">
              <div className="flex h-8 w-8 items-center justify-center border-2 border-border bg-groupBlue text-primaryText">
                <Hash className="h-3.5 w-3.5" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1 border-2 border-border bg-[#0f131b] px-3 py-2 shadow-group">
                <p className="truncate text-base font-black uppercase tracking-[0.14em] text-primaryText">
                  {loading ? 'Loading workspace...' : groupDisplayName}
                </p>
              </div>
              <div className="hidden items-center gap-2 border-2 border-border bg-[#0f131b] px-2 py-1.5 lg:flex">
                <Activity className="h-4 w-4 text-presenceGreen" strokeWidth={2.25} />
                <span className="text-xs font-black uppercase tracking-[0.18em] text-presenceGreen">Active</span>
              </div>
            </div>

            <MessageList
              documents={documents}
              activeGroupKey={groupId}
            />

            <div className="shrink-0 px-3 pb-2">
              <AskAIBox
                onAddDocuments={handleAddDocuments}
                onOpenDocuments={() => setIsDocumentsModalOpen(true)}
                activeGroupId={groupId}
              />
            </div>
          </section>
        </main>

        <aside className="hidden xl:flex min-h-0 min-w-0 flex-col">
          <section className="dashboard-shell noise-panel flex min-h-0 flex-1 flex-col px-2 py-3">
            <div className="border-b border-border/40 pb-3">
              <p className="section-label text-aiPurple">
                03 Active Members ({members.length})
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-secondaryText">
                Presence
              </p>
            </div>
            <div className="mt-3 min-h-0 flex-1 pr-2">
              <div className="scroll-panel h-full overflow-y-auto">
                <MemberList members={members} />
              </div>
            </div>
            <div className="mt-2 shrink-0">
              <AddMemberForm groupId={groupId} onMemberAdded={fetchGroupDetails} />
            </div>
          </section>
        </aside>
      </div>

      {isDocumentsModalOpen && (
        <Modal
          isOpen={isDocumentsModalOpen}
          onClose={() => setIsDocumentsModalOpen(false)}
          size="lg"
          sectionLabel="TRACKED PDFs"
          title="Tracked PDFs"
          subtitle="Group Documents"
        >
          <DocumentList documents={documents} />
        </Modal>
      )}
    </div>
  );
}

export default GroupChatPage;