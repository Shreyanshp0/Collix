import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import GroupList from '../components/groups/GroupList.jsx';
import CreateGroupForm from '../components/groups/CreateGroupForm.jsx';
import Modal from '../components/shared/Modal.jsx';
import BrowseGroupsContent from '../components/groups/BrowseGroupsContent.jsx';

const initialGroups = [
  {
    id: 'research-lab',
    name: 'Research Lab',
    description: 'Documents, chat, and AI context for the research group.',
    members: 8,
  },
  {
    id: 'backend-team',
    name: 'Backend Team',
    description: 'API planning, debugging, and implementation discussions.',
    members: 14,
  },
  {
    id: 'placement-prep',
    name: 'Placement Prep',
    description: 'Interview notes, revision docs, and collaborative prep.',
    members: 5,
  },
  {
    id: 'system-design',
    name: 'System Design',
    description: 'Architecture reviews, references, and design trade-offs.',
    members: 9,
  },
  {
    id: 'operating-systems',
    name: 'Operating Systems',
    description: 'Concept revision, study notes, and discussion history.',
    members: 6,
  },
];

const initialMeta = {
  'research-lab': { lastActivity: 'Sarah: Uploaded Q3_Specs.pdf', lastActiveAt: Date.now() - 2 * 60 * 1000, unread: 5, isActive: true, aiReady: true, docs: 12, messages: 47 },
  'backend-team': { lastActivity: 'Alex: Pushed API changes', lastActiveAt: Date.now() - 10 * 60 * 1000, unread: 0, isActive: false, aiReady: false, docs: 3, messages: 22 },
  'placement-prep': { lastActivity: "Meera: Shared interview notes", lastActiveAt: Date.now() - 60 * 60 * 1000, unread: 2, isActive: false, aiReady: false, docs: 1, messages: 8 },
  'system-design': { lastActivity: 'Ravi: Proposed new diagram', lastActiveAt: Date.now() - 4 * 60 * 60 * 1000, unread: 0, isActive: false, aiReady: true, docs: 7, messages: 30 },
  'operating-systems': { lastActivity: 'Priya: Added summary', lastActiveAt: Date.now() - 24 * 60 * 60 * 1000, unread: 1, isActive: false, aiReady: false, docs: 2, messages: 14 },
};

function relativeTime(ms) {
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function GroupsPage() {
  const [groups, setGroups] = useState(initialGroups);
  const [meta] = useState(initialMeta);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);

  const handleCreateGroup = (groupName, description = '') => {
    const id = groupName.toLowerCase().replace(/\s+/g, '-');

    const newGroup = {
      id,
      name: groupName,
      description: description || 'New mock group ready for chat, documents, and AI context.',
      members: 1,
    };

    setGroups((current) => [newGroup, ...current]);
    setCreateOpen(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = groups.filter((g) => g.name.toLowerCase().includes(q));

    // sort: recent activity (meta.lastActiveAt), unread (desc), alphabetical
    matched.sort((a, b) => {
      const ma = meta[a.id]?.lastActiveAt || 0;
      const mb = meta[b.id]?.lastActiveAt || 0;
      if (ma !== mb) return mb - ma; // recent first

      const ua = meta[a.id]?.unread || 0;
      const ub = meta[b.id]?.unread || 0;
      if (ua !== ub) return ub - ua;

      return a.name.localeCompare(b.name);
    });

    return matched;
  }, [groups, search, meta]);

  const totalUnread = Object.values(meta).reduce((s, m) => s + (m.unread || 0), 0);

  return (
    <div className="h-full flex flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label">MY GROUPS</p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-primaryText">My Groups</h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-secondaryText">
            <span>{groups.length} Active</span>
            <span>•</span>
            <span>{totalUnread} Unread</span>
            <span>•</span>
            <span>Updated Just Now</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center rounded-md border-2 border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-secondaryText" />
            <input
              aria-label="Search your groups"
              placeholder="Search your groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-2 w-64 bg-transparent text-sm outline-none"
            />
          </div>

          <button type="button" className="brutal-button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 text-groupBlue" />
            <span className="ml-2">Create</span>
          </button>

          <button type="button" className="rounded-md border-2 border-border bg-background px-3 py-2" onClick={() => setBrowseOpen(true)}>
            Browse
          </button>
        </div>
      </header>

      <section className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <GroupList groups={filtered} meta={meta} />
        </div>
      </section>

      <footer className="flex items-center justify-center gap-4 pt-2">
        <button type="button" className="text-sm text-secondaryText" onClick={() => setCreateOpen(true)}>
          + Create Group
        </button>
        <button type="button" className="text-sm text-secondaryText" onClick={() => setBrowseOpen(true)}>
          Browse Public Groups
        </button>
      </footer>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        size="md"
        sectionLabel="CREATE GROUP"
        title="Create Group"
        subtitle="Start a New Collaboration Space"
      >
        <CreateGroupForm onCreateGroup={handleCreateGroup} onCancel={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        isOpen={browseOpen}
        onClose={() => setBrowseOpen(false)}
        size="lg"
        sectionLabel="BROWSE GROUPS"
        title="Browse Groups"
        subtitle="Discover Collaboration Spaces"
      >
        <BrowseGroupsContent onClose={() => setBrowseOpen(false)} />
      </Modal>
    </div>
  );
}

export default GroupsPage;
