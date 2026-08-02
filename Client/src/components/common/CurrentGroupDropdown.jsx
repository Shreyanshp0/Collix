import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from '../shared/Modal.jsx';
import BrowseGroupsContent from '../groups/BrowseGroupsContent.jsx';
import CreateGroupForm from '../groups/CreateGroupForm.jsx';
import { initialGroups } from '../../lib/groups.js';

function slugify(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function usePersistedGroups() {
  const key = 'mockGroups_v1';
  const [groups, setGroups] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    return initialGroups;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(groups));
    } catch (e) {}
  }, [groups]);

  return [groups, setGroups];
}

export default function CurrentGroupDropdown() {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = usePersistedGroups();
  const [showBrowse, setShowBrowse] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentId = pathname.split('/groups/')[1];

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleSelect = (group) => {
    setOpen(false);
    // navigate immediately
    navigate(`/groups/${group.id}`);
  };

  const handleCreate = (name, description) => {
    const id = slugify(name || `group-${Date.now()}`);
    const g = { id, name, description, members: 1, docs: 0, messages: 0, aiReady: false };
    setGroups((s) => [g, ...s]);
    setShowCreate(false);
    navigate(`/groups/${id}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="hidden min-w-[260px] items-center justify-start gap-3 rounded-md border-2 border-border px-3 py-2 text-left md:flex bg-[#0f131b]"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-border bg-groupBlue text-primaryText">
          {currentId ? groups.find((g) => g.id === currentId)?.name.charAt(0) : 'G'}
        </div>
        <div className="min-w-0">
          <p className="section-label text-primaryText">{currentId ? groups.find((g) => g.id === currentId)?.name : 'Launch Strategy'}</p>
          <p className="truncate text-xs uppercase tracking-[0.22em] text-secondaryText">Current Group</p>
        </div>
        <ChevronDown className="ml-auto h-4 w-4 text-primaryText" strokeWidth={2.25} />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-80 border-2 border-border bg-[#0f131b] shadow-panel">
          <div className="max-h-64 overflow-y-auto">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => handleSelect(g)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left uppercase font-bold tracking-[0.08em] ${
                  g.id === currentId ? 'bg-surface text-primaryText' : 'text-primaryText'
                }`}
              >
                <span className="w-3">{g.id === currentId ? '✓' : ''}</span>
                <span className="truncate">{g.name}</span>
              </button>
            ))}
          </div>

          <div className="border-t-2 border-border p-2">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setShowBrowse(true); setOpen(false); }} className="rounded-md border-2 border-border bg-background px-3 py-2 text-sm">
                Browse Groups
              </button>
              <button type="button" onClick={() => { setShowCreate(true); setOpen(false); }} className="brutal-button px-3 py-2 text-sm">
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {showBrowse && (
        <Modal isOpen={showBrowse} onClose={() => setShowBrowse(false)} size="md" sectionLabel="BROWSE" title="Browse Groups">
          <BrowseGroupsContent onClose={() => setShowBrowse(false)} />
        </Modal>
      )}

      {showCreate && (
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="sm" sectionLabel="CREATE" title="Create Group">
          <CreateGroupForm onCreateGroup={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
    </div>
  );
}
