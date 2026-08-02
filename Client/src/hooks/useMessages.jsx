import { useCallback, useEffect, useState } from 'react';
import messagesApi from '../api/messages.api.js';

export function useMessages(groupId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchInitialMessages = useCallback(async () => {
    if (!groupId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await messagesApi.list({ groupId, page: 1, limit: 30 });
      const items = data.messages || data.items || [];
      setMessages(items);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setHasNextPage(Boolean(data.hasNextPage));
    } catch (err) {
      console.error('Failed to fetch message history:', err);
      const message = err.response?.data?.message || err.message || 'Failed to load messages';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchInitialMessages();
  }, [fetchInitialMessages]);

  const loadMore = useCallback(async () => {
    if (!groupId || !hasNextPage || loadingMore || loading) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await messagesApi.list({ groupId, page: nextPage, limit: 30 });
      const olderItems = data.messages || data.items || [];
      
      setMessages((current) => {
        const existingIds = new Set(current.map((m) => m.id));
        const newOlder = olderItems.filter((m) => !existingIds.has(m.id));
        return [...newOlder, ...current];
      });

      setPage(data.page || nextPage);
      setTotalPages(data.totalPages || totalPages);
      setHasNextPage(Boolean(data.hasNextPage));
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [groupId, hasNextPage, loadingMore, loading, page, totalPages]);

  const appendMessage = useCallback((newMessage) => {
    if (!newMessage || !newMessage.id) return;
    setMessages((current) => {
      if (current.some((m) => m.id === newMessage.id)) {
        return current;
      }
      return [...current, newMessage];
    });
  }, []);

  const updateMessage = useCallback((updatedMessage) => {
    if (!updatedMessage || !updatedMessage.id) return;
    setMessages((current) =>
      current.map((m) => (m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m)),
    );
  }, []);

  const markRead = useCallback((messageId) => {
    // Stub extension point for read receipts
    console.log('markRead stub invoked for message:', messageId);
  }, []);

  return {
    messages,
    loading,
    loadingMore,
    error,
    page,
    totalPages,
    hasNextPage,
    loadMore,
    appendMessage,
    updateMessage,
    markRead,
    retry: fetchInitialMessages,
  };
}

export default useMessages;
