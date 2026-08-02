import { Plus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import groupsApi from '../../api/groups.api.js';

function CreateGroupForm({ onGroupCreated, onCancel }) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateGroup = async () => {
    const trimmedName = groupName.trim();

    if (!trimmedName) {
      toast.error('Enter a group name.');
      return;
    }

    setSubmitting(true);
    try {
      const group = await groupsApi.create({
        name: trimmedName,
        description: description.trim(),
      });
      toast.success(`Created group: ${group.name || trimmedName}`);
      setGroupName('');
      setDescription('');
      onGroupCreated?.(group);
    } catch (error) {
      console.error('Group creation error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to create group';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Plus className="h-5 w-5 text-groupBlue" strokeWidth={2.25} />
        <div>
          <p className="section-label text-groupBlue">Create Group</p>
          <h3 className="mt-1 text-sm font-bold uppercase tracking-[0.08em] text-primaryText">Start a new group</h3>
        </div>
      </div>

      <p className="text-sm leading-6 text-secondaryText">
        Enter details to create a collaboration space. You will automatically be set as the group owner.
      </p>

      <div className="grid gap-3">
        <input
          type="text"
          className="brutal-input"
          placeholder="Group name"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          disabled={submitting}
        />
        <input
          type="text"
          className="brutal-input"
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          className="rounded-md border-2 border-border bg-background px-4 py-2 text-sm font-bold uppercase tracking-[0.08em]"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="brutal-button"
          onClick={handleCreateGroup}
          disabled={submitting}
        >
          {submitting ? 'Creating...' : 'Create'}
        </button>
      </div>
    </div>
  );
}

export default CreateGroupForm;
