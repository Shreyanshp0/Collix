import { Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import groupsApi from '../../api/groups.api.js';
import Modal from '../shared/Modal.jsx';

function AddMemberForm({ groupId, onMemberAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [submitting, setSubmitting] = useState(false);

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleAddMember = async () => {
    const trimmedId = userId.trim();

    if (!trimmedId) {
      toast.error('Enter a User ID or email.');
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
        userId: trimmedId,
        role,
      });
      toast.success('Member added successfully!');
      setUserId('');
      setRole('MEMBER');
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
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        )}
      >
        <div className="space-y-4">
          <label className="block">
            <span className="section-label text-primaryText">User ID</span>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondaryText" strokeWidth={2.25} />
              <input
                type="text"
                className="brutal-input pl-10"
                placeholder="User ID (MongoDB ObjectId)"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                disabled={submitting}
              />
            </div>
          </label>

          <label className="block">
            <span className="section-label text-primaryText">Role</span>
            <select
              className="brutal-input mt-2"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              disabled={submitting}
            >
              <option value="MEMBER">MEMBER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="MODERATOR">MODERATOR</option>
            </select>
          </label>
        </div>
      </Modal>
    </>
  );
}

export default AddMemberForm;
