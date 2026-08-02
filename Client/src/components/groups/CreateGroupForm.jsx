import { Lock, Globe, Plus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import groupsApi from '../../api/groups.api.js';

function CreateGroupForm({ onGroupCreated, onCancel }) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
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
        visibility,
      });
      toast.success(`Created group: ${group.name || trimmedName}`);
      setGroupName('');
      setDescription('');
      setVisibility('private');
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
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.12em] text-secondaryText mb-1">
            Group Name
          </label>
          <input
            type="text"
            className="brutal-input w-full"
            placeholder="e.g. Frontend Engineering"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.12em] text-secondaryText mb-1">
            Description
          </label>
          <input
            type="text"
            className="brutal-input w-full"
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="mt-2 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-[0.12em] text-secondaryText">
            Visibility
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-sm border-2 p-3 transition-colors ${
                visibility === 'private'
                  ? 'border-groupBlue bg-[#0f131b]'
                  : 'border-border bg-background'
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={visibility === 'private'}
                onChange={() => setVisibility('private')}
                className="mt-0.5 accent-groupBlue"
                disabled={submitting}
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold uppercase text-xs text-primaryText">
                  <Lock className="h-3.5 w-3.5 text-groupBlue" />
                  <span>Private</span>
                </div>
                <p className="text-[11px] leading-4 text-secondaryText">
                  Only invited members can join.
                </p>
              </div>
            </label>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-sm border-2 p-3 transition-colors ${
                visibility === 'public'
                  ? 'border-groupBlue bg-[#0f131b]'
                  : 'border-border bg-background'
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === 'public'}
                onChange={() => setVisibility('public')}
                className="mt-0.5 accent-groupBlue"
                disabled={submitting}
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold uppercase text-xs text-primaryText">
                  <Globe className="h-3.5 w-3.5 text-presenceGreen" />
                  <span>Public</span>
                </div>
                <p className="text-[11px] leading-4 text-secondaryText">
                  Anyone can discover and join.
                </p>
              </div>
            </label>
          </div>
        </div>
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
