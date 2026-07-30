import { Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function GroupListItem({ group, meta = {} }) {
  const { lastActivity, lastActiveAt, unread = 0, isActive = false, aiReady = false, docs = 0, messages = 0 } = meta || {};

  const relative = (ms) => {
    if (!ms) return 'Unknown';
    const diff = Date.now() - ms;
    const mins = Math.round(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
    const days = Math.round(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <Link to={`/groups/${group.id}`} className="block h-full">
      <motion.article
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className="flex h-full flex-col justify-between rounded-md border-2 border-border bg-[#0f131b] p-3 shadow-group hover:shadow-lg hover:-translate-y-1 transition-transform duration-150"
      >
        <div>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-2 ${isActive ? 'border-groupBlue' : 'border-border'} bg-groupBlue text-primaryText`}>
              <span className="text-sm font-black uppercase">{group.name.charAt(0)}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black uppercase tracking-[0.06em] text-primaryText truncate">{group.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black uppercase ${aiReady ? 'text-aiPurple' : 'text-secondaryText'}`}>{aiReady ? 'AI READY' : 'CHAT ONLY'}</span>
                </div>
              </div>

              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-secondaryText truncate">{group.description}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-secondaryText">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-primaryText">📄</span>
                <span>{docs} Docs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primaryText">💬</span>
                <span>{messages} Messages</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-presenceGreen" strokeWidth={2.25} />
                <span>{group.members} Members</span>
              </div>
            </div>

            <div>
              {unread > 0 && (
                <span className="rounded-sm border-2 border-border bg-groupBlue px-2 py-1 text-xs font-black text-primaryText">{unread} unread</span>
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-secondaryText">
            <div className="font-black uppercase">Latest</div>
            <div className="mt-1 truncate">{lastActivity}</div>
            <div className="mt-1 opacity-60">{relative(lastActiveAt)}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" className="brutal-button text-xs">Ask AI</button>
            <button type="button" className="brutal-button text-xs">View Chat</button>
            <button type="button" className="rounded-md border-2 border-border bg-background px-3 py-2 text-xs" onClick={(e) => { e.preventDefault(); alert('Upload (mock)'); }}>Upload</button>
          </div>
          <div className="text-xs text-secondaryText">&nbsp;</div>
        </div>
      </motion.article>
    </Link>
  );
}

export default GroupListItem;
