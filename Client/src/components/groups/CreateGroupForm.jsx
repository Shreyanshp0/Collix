import { Plus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

function CreateGroupForm({ onCreateGroup }) {
  const [groupName, setGroupName] = useState('');

  const handleCreateGroup = () => {
    const trimmedName = groupName.trim();

    if (!trimmedName) {
      toast.error('Enter a group name.');
      return;
    }

    onCreateGroup?.(trimmedName);
    console.log('Create group:', trimmedName);
    toast.success(`Created mock group: ${trimmedName}`);
    setGroupName('');
  };

  return (
    <section className="brutal-panel shadow-group">
      <div className="flex items-center gap-3">
        <Plus className="h-5 w-5 text-groupBlue" strokeWidth={2.25} />
        <div>
          <p className="section-label text-groupBlue">Create Group</p>
          <h2 className="mt-2 text-lg font-bold uppercase tracking-[0.12em] text-primaryText">
            Start A New Group
          </h2>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-secondaryText">
        Group creation is part of V1. This UI is mocked until the backend group creation endpoint is connected.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          className="brutal-input"
          placeholder="Enter group name"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
        />
        <button type="button" className="brutal-button" onClick={handleCreateGroup}>
          Create
        </button>
      </div>
    </section>
  );
}

export default CreateGroupForm;
