import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import groupsApi from '../api/groups.api.js';
import GroupList from '../components/groups/GroupList.jsx';
import CreateGroupForm from '../components/groups/CreateGroupForm.jsx';
import Modal from '../components/shared/Modal.jsx';
import BrowseGroupsContent from '../components/groups/BrowseGroupsContent.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await groupsApi.list();
      const list = Array.isArray(data) ? data : data.groups || [];
      setGroups(list);
    } catch (error) {
      console.error('Failed to load groups:', error);
      toast.error(error.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter(
      (g) =>
        (g.name && g.name.toLowerCase().includes(q)) ||
        (g.description && g.description.toLowerCase().includes(q)),
    );
  }, [groups, search]);

  return (
    <div className="h-full flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label">MY GROUPS</p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-primaryText">My Groups</h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-secondaryText">
            <span>{groups.length} Active Workspaces</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center rounded-md border-2 border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-secondaryText" />
            <input
              aria-label="Search your groups"
              placeholder="Search your groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-2 w-48 bg-transparent text-sm outline-none sm:w-64"
            />
          </div>

          <button type="button" className="brutal-button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 text-groupBlue" />
            <span className="ml-2">Create</span>
          </button>

          <button type="button" className="rounded-md border-2 border-border bg-background px-3 py-2 text-sm font-bold uppercase tracking-[0.12em]" onClick={() => setBrowseOpen(true)}>
            Browse
          </button>
        </div>
      </header>

      <section className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length > 0 ? (
            <GroupList groups={filtered} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-md border-2 border-border bg-surface p-8 text-center shadow-panel">
              <Users className="h-12 w-12 text-secondaryText" strokeWidth={1.5} />
              <h2 className="mt-4 text-xl font-bold uppercase tracking-[0.14em] text-primaryText">
                {search ? 'No Matching Groups Found' : 'No Groups Joined Yet'}
              </h2>
              <p className="mt-2 max-w-md text-sm text-secondaryText">
                {search
                  ? 'Try searching with a different keyword.'
                  : 'Create a new group workspace or browse existing public groups to collaborate.'}
              </p>
              <div className="mt-6 flex gap-4">
                <button type="button" className="brutal-button" onClick={() => setCreateOpen(true)}>
                  Create Group
                </button>
                <button type="button" className="rounded-md border-2 border-border bg-background px-4 py-2 text-sm font-bold uppercase tracking-[0.12em]" onClick={() => setBrowseOpen(true)}>
                  Browse Groups
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="flex items-center justify-center gap-4 pt-2">
        <button type="button" className="text-sm text-secondaryText hover:text-primaryText" onClick={() => setCreateOpen(true)}>
          + Create Group
        </button>
        <button type="button" className="text-sm text-secondaryText hover:text-primaryText" onClick={() => setBrowseOpen(true)}>
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
        <CreateGroupForm
          onGroupCreated={() => {
            setCreateOpen(false);
            fetchGroups();
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={browseOpen}
        onClose={() => setBrowseOpen(false)}
        size="lg"
        sectionLabel="BROWSE GROUPS"
        title="Browse Groups"
        subtitle="Discover Collaboration Spaces"
      >
        <BrowseGroupsContent
          onGroupJoined={() => {
            setBrowseOpen(false);
            fetchGroups();
          }}
          onClose={() => setBrowseOpen(false)}
        />
      </Modal>
    </div>
  );
}

export default GroupsPage;
