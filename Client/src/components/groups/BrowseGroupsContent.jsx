import { useState } from 'react';

const publicGroups = [
  { id: 'public-ai', name: 'AI Enthusiasts', description: 'Public group for AI discussions', members: 120 },
  { id: 'public-design', name: 'Design Circle', description: 'Open design reviews and feedback', members: 48 },
  { id: 'public-devops', name: 'DevOps Corner', description: 'Tools, infra, CI/CD', members: 64 },
];

function BrowseGroupsContent({ onClose }) {
  const [q, setQ] = useState('');

  const filtered = publicGroups.filter((g) => g.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search public groups"
          className="brutal-input w-full"
        />
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2">
        {filtered.map((g) => (
          <div key={g.id} className="flex items-center justify-between rounded-sm border-2 border-border bg-[#11161f] px-3 py-2">
            <div>
              <div className="text-sm font-black uppercase text-primaryText">{g.name}</div>
              <div className="text-xs text-secondaryText">{g.description}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-secondaryText">👥 {g.members}</div>
              <button type="button" className="brutal-button" onClick={() => alert(`Joined ${g.name} (mock)`)}>
                Join
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button type="button" className="rounded-md border-2 border-border bg-background px-3 py-2" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default BrowseGroupsContent;
