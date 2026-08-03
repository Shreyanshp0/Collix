import { AtSign, Bot, CheckCircle2, FileText, MessageSquare, Trash2, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ICON_MAP = {
  file: FileText,
  'file-check': FileText,
  'file-x': FileText,
  bot: Bot,
  'at-sign': AtSign,
  'user-plus': UserPlus,
  users: Users,
  'message-square': MessageSquare,
};

const COLOR_MAP = {
  purple: 'text-aiPurple border-aiPurple/40 bg-aiPurple/10',
  blue: 'text-groupBlue border-groupBlue/40 bg-groupBlue/10',
  green: 'text-presenceGreen border-presenceGreen/40 bg-presenceGreen/10',
  amber: 'text-warning border-warning/40 bg-warning/10',
  red: 'text-red-400 border-red-500/40 bg-red-500/10',
};

export default function NotificationItem({ notification, onMarkRead, onDelete, onCloseDrawer }) {
  const navigate = useNavigate();
  if (!notification) return null;

  const IconComponent = ICON_MAP[notification.icon] || MessageSquare;
  const colorClass = COLOR_MAP[notification.color] || COLOR_MAP.blue;
  const isUnread = notification.status === 'UNREAD' || !notification.isRead;

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const handleDeepLinkClick = () => {
    if (isUnread && onMarkRead) {
      onMarkRead(notification.id);
    }

    const target = notification.target || {};
    const groupId = target.groupId || notification.group?.id;

    if (groupId) {
      navigate(`/groups/${groupId}`);
    }

    onCloseDrawer?.();
  };

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-sm border-2 p-3 transition-colors ${
        isUnread
          ? 'border-border bg-[#0f131b]'
          : 'border-border/40 bg-background/50 text-secondaryText'
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${colorClass}`}
      >
        <IconComponent className="h-4 w-4" strokeWidth={2.25} />
      </div>

      <div className="min-w-0 flex-1 cursor-pointer" onClick={handleDeepLinkClick}>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-black uppercase tracking-[0.1em] text-primaryText">
            {notification.title}
          </p>
          <span className="shrink-0 text-[9px] font-bold text-secondaryText">
            {formatDate(notification.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-xs text-secondaryText leading-relaxed line-clamp-2">
          {notification.message}
        </p>

        {notification.group?.name && (
          <span className="mt-1.5 inline-block rounded-sm border border-border/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-secondaryText">
            {notification.group.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
        {isUnread && (
          <button
            type="button"
            onClick={() => onMarkRead?.(notification.id)}
            className="rounded p-1 text-secondaryText hover:text-presenceGreen"
            title="Mark as read"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete?.(notification.id)}
          className="rounded p-1 text-secondaryText hover:text-red-400"
          title="Delete notification"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
