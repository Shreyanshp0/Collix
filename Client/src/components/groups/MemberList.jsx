import { Circle } from 'lucide-react';

const statusClasses = {
  online: 'text-presenceGreen',
  away: 'text-warning',
  offline: 'text-offline',
};

function MemberList({ members }) {
  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between gap-3 rounded-sm border-2 border-border bg-[#0f131b] px-3 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background text-xs font-black uppercase text-primaryText">
              {member.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black uppercase tracking-[0.08em] text-primaryText">
                {member.name}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondaryText">
                  {member.role}
                </p>
                <span
                  className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusClasses[member.status]}`}
                >
                  <Circle className={`h-2.5 w-2.5 fill-current ${statusClasses[member.status]}`} strokeWidth={2.25} />
                  {member.status}
                </span>
              </div>
            </div>
          </div>
          <span className="shrink-0 rounded-sm border-2 border-border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-primaryText">
            {member.role === 'Admin' ? 'Owner' : member.status === 'offline' ? 'Viewer' : 'Contributor'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default MemberList;
