import { LayoutPanelLeft, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import CreateGroupForm from '../components/groups/CreateGroupForm.jsx';
import GroupList from '../components/groups/GroupList.jsx';

const initialGroups = [
  {
    id: 'research-lab',
    name: 'Research Lab',
    description: 'Documents, chat, and AI context for the research group.',
    members: 8,
  },
  {
    id: 'backend-team',
    name: 'Backend Team',
    description: 'API planning, debugging, and implementation discussions.',
    members: 14,
  },
  {
    id: 'placement-prep',
    name: 'Placement Prep',
    description: 'Interview notes, revision docs, and collaborative prep.',
    members: 5,
  },
  {
    id: 'system-design',
    name: 'System Design',
    description: 'Architecture reviews, references, and design trade-offs.',
    members: 9,
  },
  {
    id: 'operating-systems',
    name: 'Operating Systems',
    description: 'Concept revision, study notes, and discussion history.',
    members: 6,
  },
  {
    id: 'browse-groups',
    name: 'Browse Groups',
    description: 'Discover and join additional available groups.',
    members: 18,
  },
];

function GroupsPage() {
  const [groups, setGroups] = useState(initialGroups);

  const handleCreateGroup = (groupName) => {
    const id = groupName.toLowerCase().replace(/\s+/g, '-');

    setGroups((current) => [
      {
        id,
        name: groupName,
        description: 'New mock group ready for chat, documents, and AI context.',
        members: 1,
      },
      ...current,
    ]);
  };

  return (
    <div className="space-y-6">
      <section className="brutal-panel shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label text-groupBlue">03 Groups</p>
            <h1 className="mt-3 text-3xl font-bold uppercase tracking-[0.14em] text-primaryText sm:text-4xl">
              Choose Your Active Collaboration Space
            </h1>
          </div>
          <div className="flex gap-3">
            <div className="rounded-md border-2 border-border bg-background px-4 py-3">
              <div className="flex items-center gap-2">
                <LayoutPanelLeft className="h-4 w-4 text-groupBlue" strokeWidth={2.25} />
                <span className="section-label text-primaryText">Responsive Layout</span>
              </div>
            </div>
            <div className="rounded-md border-2 border-border bg-background px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-presenceGreen" strokeWidth={2.25} />
                <span className="section-label text-primaryText">Mock Protected Route</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CreateGroupForm onCreateGroup={handleCreateGroup} />

      <section className="space-y-4">
        <div>
          <p className="section-label">Active Groups</p>
          <p className="mt-2 text-sm leading-6 text-secondaryText">
            Each group is a single collaboration space with its own members, chat, uploaded PDFs, and AI context.
          </p>
        </div>
        <GroupList groups={groups} />
      </section>
    </div>
  );
}

export default GroupsPage;
