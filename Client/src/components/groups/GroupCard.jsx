import { ChevronRight, Hash, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function GroupCard({ group }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-md border-2 border-border bg-[#0f131b] p-3 shadow-group"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm border-2 border-border bg-groupBlue font-black uppercase text-primaryText">
          <Hash className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black uppercase tracking-[0.08em] text-primaryText">
            {group.name}
          </p>
          <p className="truncate text-[11px] uppercase tracking-[0.18em] text-secondaryText">
            {group.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-sm border border-border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primaryText sm:flex">
            <Users className="h-3.5 w-3.5 text-presenceGreen" strokeWidth={2.25} />
            {group.members}
          </div>
          <Link
            to={`/groups/${group.id}`}
            className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-border bg-background text-primaryText"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export default GroupCard;
