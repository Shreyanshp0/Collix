import { Hash, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function GroupCard({ group }) {
  return (
    <Link to={`/groups/${group.id}`} className="block">
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="rounded-md border-2 border-border bg-[#0f131b] p-2.5 shadow-group"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-2 border-border bg-groupBlue text-primaryText">
            <Hash className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-primaryText">{group.name}</p>
              <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primaryText">
                <Users className="h-3.5 w-3.5 text-presenceGreen" strokeWidth={2.25} />
                {group.members}
              </span>
            </div>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-secondaryText">
              {group.description}
            </p>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

export default GroupCard;
