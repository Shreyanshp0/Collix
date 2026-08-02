import { Circle } from 'lucide-react';

const statusClasses = {
  online: 'text-presenceGreen',
  away: 'text-warning',
  offline: 'text-offline',
};

function MemberList({ members = [] }) {
  return (
    <div className="w-full space-y-2">
      {members.map((member) => {
        const userObj = member.user || member;
        const name = userObj.name || userObj.username || member.name || 'Member';
        const role = member.role || 'MEMBER';
        const status = userObj.status || member.status || 'online';
        const statusClass = statusClasses[status] || statusClasses.online;

        return (
          <div
            key={member.id || userObj.id || name}
            className="flex w-full flex-col gap-2 rounded-sm border-2 border-border bg-[#0f131b] px-2 py-2"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background text-xs font-black uppercase text-primaryText">
                {name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black uppercase tracking-[0.08em] text-primaryText">
                  {name}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-secondaryText">{role}</p>
              </div>
              <div className="shrink-0 ml-2">
                <span className="whitespace-nowrap rounded-sm border-2 border-border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-primaryText">
                  {role}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-start gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
              <span className={`${statusClass} flex items-center gap-1`}>
                <Circle className={`h-2.5 w-2.5 fill-current ${statusClass}`} strokeWidth={2.25} />
                <span className="truncate">{status}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MemberList;
