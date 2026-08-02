import { Plus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

function CreateGroupForm({ onCreateGroup, onCancel }) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateGroup = () => {
    const trimmedName = groupName.trim();

    if (!trimmedName) {
      toast.error('Enter a group name.');
      return;
    }

    onCreateGroup?.(trimmedName, description);
    toast.success(`Created mock group: ${trimmedName}`);
    setGroupName('');
    setDescription('');
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
        This UI is mocked until the backend group creation endpoint is connected.
      </p>

      <div className="grid gap-2">
        <input
          type="text"
          className="brutal-input"
          placeholder="Group name"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
        />
        <input
          type="text"
          className="brutal-input"
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="mt-2 flex items-center gap-2 justify-end">
        <button type="button" className="rounded-md border-2 border-border bg-background px-3 py-2 text-sm" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="brutal-button" onClick={handleCreateGroup}>
          Create
        </button>
      </div>
    </div>
  );
}

export default CreateGroupForm;
