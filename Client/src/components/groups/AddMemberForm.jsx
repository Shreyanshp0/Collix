import { Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../shared/Modal.jsx';

const suggestedUsers = ['rahul', 'mira', 'aman', 'shreyansh'];

function AddMemberForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [inviteValue, setInviteValue] = useState('');
  const [role, setRole] = useState('Contributor');

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleInvite = () => {
    const trimmedValue = inviteValue.trim();

    if (!trimmedValue) {
      toast.error('Enter an email or username.');
      return;
    }

    console.log('Invite member:', { value: trimmedValue, role });
    toast.success(`Mock invite sent to ${trimmedValue}`);
    setInviteValue('');
    setRole('Contributor');
    closeModal();
  };

  return (
    <>
      <button type="button" className="brutal-button w-full" onClick={() => setIsOpen(true)}>
        <UserPlus className="h-4 w-4" strokeWidth={2.25} />
        Invite Member
      </button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        size="md"
        sectionLabel="INVITE MEMBER"
        title="Invite Member"
        subtitle="Add People To This Group"
        footer={(
          <div className="flex items-center justify-between">
            <div>
              <button type="button" className="rounded-md border-2 border-border bg-background px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] text-primaryText" onClick={closeModal}>
                Cancel
              </button>
            </div>
            <div>
              <button type="button" className="brutal-button" onClick={handleInvite}>
                Invite
              </button>
            </div>
          </div>
        )}
      >
        <div className="space-y-4">
          <label className="block">
            <span className="section-label text-primaryText">Search</span>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondaryText" strokeWidth={2.25} />
              <input
                type="text"
                className="brutal-input pl-10"
                placeholder="Search users"
                value={inviteValue}
                onChange={(event) => setInviteValue(event.target.value)}
              />
            </div>
          </label>

          <label className="mt-0 block">
            <span className="section-label text-primaryText">Email / Username</span>
            <input
              type="text"
              className="brutal-input mt-2"
              placeholder="jane@example.com"
              value={inviteValue}
              onChange={(event) => setInviteValue(event.target.value)}
            />
          </label>

          <label className="mt-0 block">
            <span className="section-label text-primaryText">Role Selector</span>
            <select
              className="brutal-input mt-2"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option>Contributor</option>
              <option>Viewer</option>
              <option>Owner</option>
            </select>
          </label>

          <div>
            <p className="section-label text-primaryText">Suggested Users</p>
            <div className="mt-3 space-y-2">
              {suggestedUsers.map((user) => (
                <button
                  key={user}
                  type="button"
                  className="flex w-full items-center justify-between border-2 border-border bg-[#0f131b] px-3 py-2 text-left"
                  onClick={() => setInviteValue(user)}
                >
                  <span className="text-sm font-black uppercase tracking-[0.08em] text-primaryText">{user}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondaryText">Select</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default AddMemberForm;
