import { Check, Search, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import authApi from '../../api/auth.api.js';
import groupsApi from '../../api/groups.api.js';
import Modal from '../shared/Modal.jsx';

function AddMemberForm({ groupId, onMemberAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [role, setRole] = useState('member'); // Normalized lowercase role enum ('member', 'admin', 'moderator')
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const closeModal = () => {
    setIsOpen(false);
    setQuery('');
    setSelectedUser(null);
    setRole('member');
    setSearchResults([]);
    setSearching(false);
  };

  // 300ms debounced user search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await authApi.searchUsers({ query: trimmed, groupId });
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (err) {
        console.error('Failed to search users:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, groupId]);

  const handleAddMember = async () => {
    if (!selectedUser || !selectedUser.id) {
      toast.error('Search and select a user to add.');
      return;
    }

    if (!groupId) {
      toast.error('No active group selected.');
      return;
    }

    setSubmitting(true);
    try {
      await groupsApi.addMember({
        groupId,
        userId: selectedUser.id,
        role, // Send normalized lowercase role enum ('member', 'admin', 'moderator')
      });
      toast.success(`Added ${selectedUser.name || selectedUser.username} to group!`);
      closeModal();
      onMemberAdded?.();
    } catch (error) {
      console.error('Add member error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to add member';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" className="brutal-button w-full" onClick={() => setIsOpen(true)}>
        <UserPlus className="h-4 w-4" strokeWidth={2.25} />
        Add Member
      </button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="md"
        sectionLabel="ADD MEMBER"
        title="Add Member"
        subtitle="Add People To This Group"
        footer={(
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              className="rounded-md border-2 border-border bg-background px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] text-primaryText"
              onClick={closeModal}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="brutal-button"
              onClick={handleAddMember}
              disabled={submitting || !selectedUser}
            >
              {submitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-primaryText mb-2">
              Find User
            </label>

            {/* Selected User Pill */}
            {selectedUser ? (
              <div className="flex items-center justify-between rounded-sm border-2 border-groupBlue bg-[#0f131b] p-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background text-xs font-black uppercase text-primaryText">
                    {selectedUser.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase text-primaryText">
                      {selectedUser.name || selectedUser.username}
                    </p>
                    <p className="text-xs text-secondaryText">@{selectedUser.username}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-sm border border-border px-2 py-1 text-xs font-bold text-secondaryText hover:text-primaryText"
                >
                  Change
                </button>
              </div>
            ) : (
              /* User Search Input */
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondaryText" strokeWidth={2.25} />
                <input
                  type="text"
                  className="brutal-input w-full pl-10"
                  placeholder="Search by name or @username..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  disabled={submitting}
                />

                {/* Dropdown Results Picker */}
                {query.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-[110%] z-50 max-h-48 overflow-y-auto rounded-sm border-2 border-border bg-[#0f131b] p-1 shadow-group scroll-panel">
                    {searching ? (
                      <div className="px-3 py-4 text-center text-xs font-bold uppercase tracking-[0.12em] text-secondaryText">
                        Searching users...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs font-bold uppercase tracking-[0.12em] text-secondaryText">
                        No users found
                      </div>
                    ) : (
                      searchResults.map((userItem) => (
                        <button
                          key={userItem.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-sm p-2 text-left hover:bg-white/5"
                          onClick={() => {
                            setSelectedUser(userItem);
                            setQuery('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-xs font-black text-primaryText uppercase">
                              {(userItem.name || userItem.username || 'U').charAt(0)}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-black uppercase text-primaryText truncate">
                                {userItem.name || userItem.username}
                              </p>
                              <p className="text-[10px] text-secondaryText truncate">@{userItem.username}</p>
                            </div>
                          </div>
                          <Check className="h-4 w-4 text-groupBlue opacity-0 hover:opacity-100" />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-primaryText mb-2">
              Group Role
            </label>
            <select
              className="brutal-input w-full uppercase"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={submitting}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default AddMemberForm;
