import { AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import groupsApi from '../../api/groups.api.js';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

function BrowseGroupsContent({ onGroupJoined, onClose }) {
  const [browseGroups, setBrowseGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [joiningId, setJoiningId] = useState(null);

  const fetchBrowseGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await groupsApi.browse();
      const groupsList = Array.isArray(data) ? data : data.groups || [];
      setBrowseGroups(groupsList);
    } catch (err) {
      console.error('Failed to fetch browse groups:', err);
      const message = err.response?.data?.message || err.message || 'Failed to load public groups';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrowseGroups();
  }, []);

  const filtered = browseGroups.filter((g) =>
    (g.name || '').toLowerCase().includes(q.trim().toLowerCase()),
  );

  const handleJoin = async (group) => {
    // Optimistic removal of group card from browse modal list
    const originalList = [...browseGroups];
    setBrowseGroups((current) => current.filter((g) => g.id !== group.id));
    setJoiningId(group.id);

    try {
      await groupsApi.join(group.id);
      toast.success(`Joined group: ${group.name}`);
      onGroupJoined?.(group);
    } catch (err) {
      console.error('Failed to join group:', err);
      // Restore card on error
      setBrowseGroups(originalList);
      const message =
        err.response?.data?.message || err.message || 'Failed to join group';
      toast.error(message);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search public groups..."
          className="brutal-input w-full"
        />
      </div>

      {loading ? (
        <div className="py-8">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-md border-2 border-red-500/40 bg-red-500/10 p-4 text-center">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-red-400">{error}</p>
          <button
            type="button"
            onClick={fetchBrowseGroups}
            className="mt-3 flex items-center gap-2 rounded-md border-2 border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primaryText"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-2 border-border bg-[#0f131b] px-4 py-8 text-center text-sm font-bold uppercase tracking-[0.12em] text-secondaryText">
          No public groups available to join.
        </div>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1 scroll-panel">
          {filtered.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-sm border-2 border-border bg-[#11161f] px-3 py-2">
              <div className="min-w-0 flex-1 pr-2">
                <div className="truncate text-sm font-black uppercase text-primaryText">{g.name}</div>
                <div className="truncate text-xs text-secondaryText">{g.description || 'Public workspace group'}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="brutal-button"
                  onClick={() => handleJoin(g)}
                  disabled={joiningId === g.id}
                >
                  {joiningId === g.id ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-md border-2 border-border bg-background px-4 py-2 text-sm font-bold uppercase tracking-[0.08em]"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default BrowseGroupsContent;
