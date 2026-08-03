import { Bell, CheckCheck, X } from 'lucide-react';
import NotificationItem from './NotificationItem.jsx';

const CATEGORIES = [
  { id: null, label: 'All' },
  { id: 'chat', label: 'Chat' },
  { id: 'documents', label: 'Docs' },
  { id: 'ai', label: 'AI' },
  { id: 'group', label: 'Group' },
];

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  loading = false,
  activeCategory,
  onCategoryChange,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-md flex-col border-l-2 border-border bg-[#0b0e14] shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-groupBlue" strokeWidth={2.25} />
            <div>
              <p className="section-label text-groupBlue">04 NOTIFICATION CENTER</p>
              <h3 className="text-sm font-black uppercase tracking-[0.1em] text-primaryText">
                Activity & Alerts
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primaryText hover:border-presenceGreen hover:text-presenceGreen"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark All Read</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-border bg-background text-primaryText"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 border-b border-border/40 px-4 py-2 overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id || 'all'}
                type="button"
                onClick={() => onCategoryChange?.(cat.id)}
                className={`rounded-sm border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] transition-colors ${
                  isSelected
                    ? 'border-groupBlue bg-groupBlue/10 text-groupBlue'
                    : 'border-border bg-background text-secondaryText hover:text-primaryText'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Notification List Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-xs font-bold uppercase tracking-[0.1em] text-secondaryText">
              Loading activity...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-secondaryText">
              <Bell className="h-8 w-8 opacity-40" />
              <p className="text-xs font-bold uppercase tracking-[0.1em]">No notifications</p>
              <p className="text-[11px]">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={onMarkRead}
                onDelete={onDelete}
                onCloseDrawer={onClose}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
