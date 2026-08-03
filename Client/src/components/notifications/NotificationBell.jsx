import { Bell } from 'lucide-react';
import { useState } from 'react';
import useNotifications from '../../hooks/useNotifications.jsx';
import NotificationDrawer from './NotificationDrawer.jsx';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    activeCategory,
    setActiveCategory,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-sm border-2 border-border bg-background text-primaryText hover:border-groupBlue"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={2.25} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-border bg-red-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        loading={loading}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        onDelete={deleteNotification}
      />
    </>
  );
}
