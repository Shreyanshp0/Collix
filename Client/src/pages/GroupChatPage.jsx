import { Activity, FileText, Hash, Lock, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import AskAIBox from '../components/ai/AskAIBox.jsx';
import MessageList from '../components/chat/MessageList.jsx';
import DocumentList from '../components/documents/DocumentList.jsx';
import AddMemberForm from '../components/groups/AddMemberForm.jsx';
import GroupList from '../components/groups/GroupList.jsx';
import MemberList from '../components/groups/MemberList.jsx';

const sideGroups = [
  {
    id: 'research-lab',
    name: 'Research Lab',
    description: 'AI-grounded project discussion',
    members: 8,
  },
  {
    id: 'backend-team',
    name: 'Backend Team',
    description: 'REST, sockets, and storage',
    members: 14,
  },
  {
    id: 'placement-prep',
    name: 'Placement Prep',
    description: 'Interview prep and shared notes',
    members: 5,
  },
  {
    id: 'system-design',
    name: 'System Design',
    description: 'Architecture and references',
    members: 9,
  },
  {
    id: 'operating-systems',
    name: 'Operating Systems',
    description: 'Revision docs and discussion',
    members: 6,
  },
  {
    id: 'browse-groups',
    name: 'Browse Groups',
    description: 'Discover additional groups',
    members: 18,
  },
];

const members = [
  { id: '1', name: 'You', role: 'Admin', status: 'online' },
  { id: '2', name: 'Sarah', role: 'Developer', status: 'online' },
  { id: '3', name: 'Mike', role: 'DevOps', status: 'away' },
  { id: '4', name: 'Priya', role: 'Designer', status: 'online' },
  { id: '5', name: 'Alex', role: 'Data Scientist', status: 'online' },
  { id: '6', name: 'John', role: 'PM', status: 'offline' },
];

function GroupChatPage() {
  const { groupId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);

  const handleAddDocuments = (newDocuments) => {
    setDocuments((current) => [...newDocuments, ...current]);
  };

  return (
    <div className="h-full overflow-hidden">
      <div className="flex h-full gap-4 overflow-hidden">
        <aside className="hidden h-full w-72 shrink-0 flex-col gap-4 xl:flex">
          <section className="dashboard-shell noise-panel flex min-h-0 flex-1 flex-col p-3">
            <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
              <p className="section-label text-groupBlue">01 Groups</p>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center border-2 border-border bg-background text-primaryText"
              >
                <Plus className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              <GroupList groups={sideGroups} />
              <button type="button" className="brutal-button mt-4 w-full">
                Browse Groups
              </button>
            </div>
          </section>

          <section className="dashboard-shell noise-panel border-groupBlue p-3 accent-blue">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Workspace Isolation</p>
                <p className="mt-3 text-lg font-black uppercase tracking-[0.12em] text-groupBlue">Enforced</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-sm border-2 border-border bg-background text-groupBlue">
                <Lock className="h-5 w-5" strokeWidth={2.25} />
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-secondaryText">
              Group-scoped context remains visually explicit in this Phase 1 shell.
            </p>
          </section>
        </aside>

        <main className="flex min-w-0 flex-[0_1_72%] flex-col overflow-hidden">
          <section className="dashboard-shell noise-panel flex min-h-0 flex-1 flex-col overflow-hidden accent-purple">
            <div className="flex flex-wrap items-center gap-3 border-b border-border/40 p-3">
              <div className="flex h-11 w-11 items-center justify-center border-2 border-border bg-groupBlue text-primaryText">
                <Hash className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1 border-2 border-border bg-[#0f131b] px-4 py-3 shadow-group">
                <p className="truncate text-lg font-black uppercase tracking-[0.14em] text-primaryText">
                  {groupId?.replace(/-/g, ' ') || 'Launch Strategy'}
                </p>
              </div>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center border-2 border-border bg-[#0f131b] text-groupBlue"
                onClick={() => setIsDocumentsModalOpen(true)}
                aria-label="Tracked PDFs"
              >
                <FileText className="h-4 w-4" strokeWidth={2.25} />
              </button>
              <div className="hidden items-center gap-2 border-2 border-border bg-[#0f131b] px-4 py-3 lg:flex">
                <Activity className="h-4 w-4 text-presenceGreen" strokeWidth={2.25} />
                <span className="text-xs font-black uppercase tracking-[0.18em] text-presenceGreen">Online</span>
              </div>
            </div>

            <MessageList documents={documents} />
            <div className="shrink-0 p-3 pt-0">
              <AskAIBox onAddDocuments={handleAddDocuments} />
            </div>
          </section>
        </main>

        <aside className="hidden h-full w-80 shrink-0 xl:flex">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            <section className="dashboard-shell noise-panel flex min-h-0 flex-1 flex-col p-3">
              <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-3">
                <p className="section-label text-aiPurple">03 Active Members ({members.length})</p>
                <span className="text-xs uppercase tracking-[0.2em] text-secondaryText">Presence</span>
              </div>
              <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
                <MemberList members={members} />
              </div>
            </section>
            <AddMemberForm />
          </div>
        </aside>
      </div>

      {isDocumentsModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="dashboard-shell flex h-full max-h-[560px] w-full max-w-2xl flex-col overflow-hidden p-0 accent-blue">
            <div className="flex items-center justify-between gap-3 border-b-2 border-border px-5 py-4">
              <div>
                <p className="section-label text-groupBlue">Tracked PDFs</p>
                <p className="mt-2 text-lg font-black uppercase tracking-[0.12em] text-primaryText">
                  Group Documents
                </p>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center border-2 border-border bg-background text-primaryText"
                onClick={() => setIsDocumentsModalOpen(false)}
              >
                <X className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <DocumentList documents={documents} />
            </div>
          </div>
        </div>
      )}
      </div>
  );
}

export default GroupChatPage;
