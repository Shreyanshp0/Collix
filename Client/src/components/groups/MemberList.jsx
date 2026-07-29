import { Circle } from 'lucide-react';

const statusClasses = {
  online: 'text-presenceGreen',
  away: 'text-warning',
  offline: 'text-offline',
};

function MemberList({ members }) {
  return (
    <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between gap-3 rounded-sm border-2 border-border bg-[#0f131b] px-3 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-border bg-background text-sm font-black uppercase text-primaryText">
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="font-black uppercase tracking-[0.1em] text-primaryText">{member.name}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondaryText">
                  {member.role}
                </p>
                <p className={`mt-1 text-xs font-bold ${statusClasses[member.status]}`}>{member.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Circle className={`h-3 w-3 fill-current ${statusClasses[member.status]}`} strokeWidth={2.25} />
              <span className="rounded-sm border-2 border-border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primaryText">
                {member.role === 'Creator' ? 'Owner' : member.status === 'offline' ? 'Viewer' : 'Contributor'}
              </span>
            </div>
          </div>
        ))}
    </div>
  );
}

export default MemberList;
