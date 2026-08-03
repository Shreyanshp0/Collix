import { useCallback, useEffect, useState } from 'react';
import notificationsApi from '../api/notifications.api.js';
import useSocket from './useSocket.jsx';

export function useNotifications() {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async (category = activeCategory) => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({ category, limit: 50 });
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications list:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Request HTML5 Browser Notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Socket.IO Notifications Listener
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (notification) => {
      if (!notification || !notification.id) return;

      setNotifications((current) => {
        if (current.some((n) => n.id === notification.id)) {
          return current.map((n) => (n.id === notification.id ? notification : n));
        }
        return [notification, ...current];
      });

      // Browser Notification if tab is hidden
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const n = new Notification(notification.title || 'Collix Notification', {
            body: notification.message || '',
            icon: '/favicon.ico',
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
        } catch (e) {
          console.error('Browser Notification error:', e);
        }
      }
    };

    const handleUnreadCount = (payload) => {
      if (typeof payload?.count === 'number') {
        setUnreadCount(payload.count);
      }
    };

    const handleUpdated = (notification) => {
      if (!notification?.id) return;
      setNotifications((current) => current.map((item) => (item.id === notification.id ? notification : item)));
    };

    const handleRead = (payload) => {
      if (!payload?.id) return;
      setNotifications((current) =>
        current.map((n) => (n.id === payload.id ? { ...n, status: 'READ', isRead: true } : n)),
      );
    };

    const handleReadAll = () => {
      setNotifications((current) =>
        current.map((n) => ({ ...n, status: 'READ', isRead: true })),
      );
      setUnreadCount(0);
    };

    const handleDelete = (payload) => {
      if (!payload?.id) return;
      setNotifications((current) => current.filter((n) => n.id !== payload.id));
    };

    socket.off('notification:new', handleNewNotification);
    socket.off('notification:updated', handleUpdated);
    socket.off('notification:unread-count', handleUnreadCount);
    socket.off('notification:read', handleRead);
    socket.off('notification:read-all', handleReadAll);
    socket.off('notification:deleted', handleDelete);

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:updated', handleUpdated);
    socket.on('notification:unread-count', handleUnreadCount);
    socket.on('notification:read', handleRead);
    socket.on('notification:read-all', handleReadAll);
    socket.on('notification:deleted', handleDelete);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:updated', handleUpdated);
      socket.off('notification:unread-count', handleUnreadCount);
      socket.off('notification:read', handleRead);
      socket.off('notification:read-all', handleReadAll);
      socket.off('notification:deleted', handleDelete);
    };
  }, [socket, isConnected]);

  const markRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, status: 'READ', isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead(activeCategory);
      setNotifications((current) =>
        current.map((n) => ({ ...n, status: 'READ', isRead: true })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsApi.remove(id);
      setNotifications((current) => current.filter((n) => n.id !== id));
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    activeCategory,
    setActiveCategory,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  };
}

export default useNotifications;
