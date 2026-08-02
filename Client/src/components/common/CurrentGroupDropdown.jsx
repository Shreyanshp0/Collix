import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import groupsApi from '../../api/groups.api.js';
import Modal from '../shared/Modal.jsx';
import BrowseGroupsContent from '../groups/BrowseGroupsContent.jsx';
import CreateGroupForm from '../groups/CreateGroupForm.jsx';

export default function CurrentGroupDropdown() {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const currentId = pathname.split('/groups/')[1];

  const fetchJoinedGroups = async () => {
    try {
      const data = await groupsApi.list();
      const list = Array.isArray(data) ? data : data.groups || [];
      setGroups(list);
    } catch (error) {
      console.error('Failed to load dropdown groups:', error);
    }
  };

  useEffect(() => {
    fetchJoinedGroups();
  }, [pathname]);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const currentGroup = groups.find((g) => g.id === currentId);
  const displayName = currentGroup?.name || (currentId ? currentId.replace(/-/g, ' ') : 'Select Group');

  const handleSelect = (group) => {
    setOpen(false);
    navigate(`/groups/${group.id}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="hidden min-w-[260px] items-center justify-start gap-3 rounded-md border-2 border-border px-3 py-2 text-left md:flex bg-[#0f131b]"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-border bg-groupBlue text-primaryText font-black uppercase">
          {displayName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="section-label text-primaryText truncate">{displayName}</p>
          <p className="truncate text-xs uppercase tracking-[0.22em] text-secondaryText">Current Group</p>
        </div>
        <ChevronDown className="ml-auto h-4 w-4 text-primaryText" strokeWidth={2.25} />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-80 border-2 border-border bg-[#0f131b] shadow-panel">
          <div className="max-h-64 overflow-y-auto">
            {groups.length === 0 ? (
              <div className="p-4 text-center text-xs text-secondaryText uppercase tracking-[0.08em]">
                No joined groups yet
              </div>
            ) : (
              groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSelect(g)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left uppercase font-bold tracking-[0.08em] ${
                    g.id === currentId ? 'bg-surface text-primaryText' : 'text-primaryText hover:bg-white/5'
                  }`}
                >
                  <span className="w-3">{g.id === currentId ? '✓' : ''}</span>
                  <span className="truncate">{g.name}</span>
                </button>
              ))
            )}
          </div>

          <div className="border-t-2 border-border p-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setShowBrowse(true); setOpen(false); }}
                className="rounded-md border-2 border-border bg-background px-3 py-2 text-sm font-bold uppercase tracking-[0.08em]"
              >
                Browse Groups
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(true); setOpen(false); }}
                className="brutal-button px-3 py-2 text-sm"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {showBrowse && (
        <Modal isOpen={showBrowse} onClose={() => setShowBrowse(false)} size="md" sectionLabel="BROWSE" title="Browse Groups">
          <BrowseGroupsContent
            onGroupJoined={() => {
              setShowBrowse(false);
              fetchJoinedGroups();
            }}
            onClose={() => setShowBrowse(false)}
          />
        </Modal>
      )}

      {showCreate && (
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} size="sm" sectionLabel="CREATE" title="Create Group">
          <CreateGroupForm
            onGroupCreated={(newGroup) => {
              setShowCreate(false);
              fetchJoinedGroups();
              if (newGroup?.id) {
                navigate(`/groups/${newGroup.id}`);
              }
            }}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}
    </div>
  );
}
