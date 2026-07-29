import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

function AddMemberForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [inviteValue, setInviteValue] = useState('');

  const handleInvite = () => {
    const trimmedValue = inviteValue.trim();

    if (!trimmedValue) {
      toast.error('Enter an email or username.');
      return;
    }

    console.log('Invite member:', trimmedValue);
    toast.success(`Mock invite sent to ${trimmedValue}`);
    setInviteValue('');
    setIsOpen(false);
  };

  return (
    <section className="dashboard-shell noise-panel p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-border bg-background">
          <UserPlus className="h-4 w-4 text-groupBlue" strokeWidth={2.25} />
        </div>
        <div>
          <p className="section-label text-groupBlue">Add Member</p>
          <h2 className="mt-2 text-base font-black uppercase tracking-[0.12em] text-primaryText">
            Invite To Group
          </h2>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-secondaryText">
        Creator-added members are part of V1. This UI is mocked until the backend add-member endpoint is wired.
      </p>
      <button type="button" className="brutal-button mt-4 w-full" onClick={() => setIsOpen(true)}>
        Add Member
      </button>

      {isOpen && (
        <div className="mt-4 rounded-md border-2 border-border bg-[#0f131b] p-4">
          <label className="block">
            <span className="section-label text-primaryText">Email Or Username</span>
            <input
              type="text"
              className="brutal-input mt-3"
              placeholder="jane@example.com"
              value={inviteValue}
              onChange={(event) => setInviteValue(event.target.value)}
            />
          </label>
          <div className="mt-4 flex gap-3">
            <button type="button" className="brutal-button flex-1" onClick={handleInvite}>
              Invite
            </button>
            <button
              type="button"
              className="flex-1 rounded-md border-2 border-border bg-background px-4 py-3 text-sm font-bold uppercase tracking-[0.22em] text-primaryText"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default AddMemberForm;
