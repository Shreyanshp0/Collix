import { AlertCircle, RefreshCw, Smile, ThumbsUp } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import useAuth from '../../hooks/useAuth.jsx';
import useSocket from '../../hooks/useSocket.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import ReadReceipt from './ReadReceipt.jsx';

const BOTTOM_THRESHOLD = 100; // px threshold for smart scroll

import AIMessage from './AIMessage.jsx';

function formatTime(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

function MessageList({
  messages = [],
  loading = false,
  loadingMore = false,
  error = null,
  hasNextPage = false,
  onLoadMore,
  onRetry,
  documents = [],
  activeGroupKey,
}) {
  const { user: currentUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const containerRef = useRef(null);
  const initialScrollDoneRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);
  const previousCountRef = useRef(messages.length);
  const pendingReadSetRef = useRef(new Set());
  const [newMessageCount, setNewMessageCount] = useState(0);

  const isNearBottom = () => {
    const container = containerRef.current;
    if (!container) return true;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= BOTTOM_THRESHOLD;
  };

  const scrollToBottom = (behavior = 'auto') => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  };

  // Reset flags when group workspace changes
  useLayoutEffect(() => {
    initialScrollDoneRef.current = false;
    previousCountRef.current = messages.length;
    pendingReadSetRef.current.clear();
    setNewMessageCount(0);
  }, [activeGroupKey, messages.length]);

  // One-time auto-scroll to bottom after initial message history load
  useLayoutEffect(() => {
    if (!loading && !error && messages.length > 0 && !initialScrollDoneRef.current) {
      scrollToBottom('auto');
      initialScrollDoneRef.current = true;
      shouldStickToBottomRef.current = true;
      previousCountRef.current = messages.length;
    }
  }, [loading, error, messages, activeGroupKey]);

  // Track scroll position to update sticky scroll intent
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const pinned = isNearBottom();
      shouldStickToBottomRef.current = pinned;
      if (pinned) {
        setNewMessageCount(0);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Smart scroll when live messages arrive
  useEffect(() => {
    if (!initialScrollDoneRef.current) return;

    const previousCount = previousCountRef.current;
    const currentCount = messages.length;

    if (currentCount > previousCount) {
      const addedCount = currentCount - previousCount;
      if (shouldStickToBottomRef.current) {
        scrollToBottom('smooth');
      } else {
        setNewMessageCount((c) => c + addedCount);
      }
    }
    previousCountRef.current = currentCount;
  }, [messages]);

  // IntersectionObserver Viewport Detection for Read Receipts
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !socket || !isConnected || !activeGroupKey) return;

    const currentUserId = currentUser?.id || currentUser?._id;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const msgId = entry.target.getAttribute('data-message-id');
          if (!msgId) return;

          const targetMsg = messages.find((m) => m.id === msgId);
          if (!targetMsg) return;

          const authorId = targetMsg.author?.id || targetMsg.author?._id;
          // Rule 1: Skip own messages
          if (authorId && currentUserId && authorId === currentUserId) return;

          // Rule 2: Skip if already in pending read set
          if (pendingReadSetRef.current.has(msgId)) return;

          // Rule 3: Skip if current user is already in readBy array
          const readBy = targetMsg.meta?.readBy || [];
          if (readBy.some((u) => (u.id || u._id) === currentUserId)) return;

          // Emit read receipt and mark in pending set
          pendingReadSetRef.current.add(msgId);
          socket.emit('message:read', {
            groupId: activeGroupKey,
            messageId: msgId,
          });
        });
      },
      {
        root: container,
        threshold: 0.5,
      },
    );

    const messageNodes = container.querySelectorAll('[data-message-id]');
    messageNodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
    };
  }, [messages, socket, isConnected, activeGroupKey, currentUser]);

  const docItems = useMemo(
    () =>
      documents.map((document) => ({
        id: document.id,
        type: 'document',
        document,
      })),
    [documents],
  );

  const currentUserId = currentUser?.id || currentUser?._id;

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div ref={containerRef} className="scroll-panel h-full overflow-y-auto px-2 py-1">
        <div className="flex min-h-full flex-col justify-end gap-2">
          {/* Top Pagination Anchor & Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center py-2">
              <button
                type="button"
                className="rounded-md border-2 border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primaryText hover:bg-surface disabled:opacity-50"
                onClick={onLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading Older Messages...' : 'Load Older Messages'}
              </button>
            </div>
          )}

          {/* Initial Loading Spinner */}
          {loading ? (
            <div className="py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            /* Error State with Retry Button */
            <div className="flex flex-col items-center justify-center rounded-md border-2 border-red-500/40 bg-red-500/10 p-6 text-center shadow-panel">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-red-400">{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 flex items-center gap-2 rounded-md border-2 border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-primaryText"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          ) : messages.length === 0 && docItems.length === 0 ? (
            /* Empty Conversation State */
            <div className="border-2 border-border bg-[#0f131b] px-4 py-6 text-center text-sm leading-6 text-secondaryText">
              No messages yet in this group. Start the conversation!
            </div>
          ) : (
            /* Message List Items */
            <>
              {messages.map((item) => {
                const authorId = item.author?.id || item.author?._id;
                const authorName = item.author?.name || item.author?.username || 'User';
                const isAI =
                  item.type === 'ai' ||
                  item.meta?.type === 'ai' ||
                  item.meta?.ai ||
                  item.author?.type === 'ai' ||
                  item.author?.name === 'Nexus AI' ||
                  item.author?.name === 'Collix AI';
                const isOwnMessage = Boolean(currentUserId && authorId === currentUserId);

                if (isAI) {
                  return (
                    <AIMessage
                      key={item.id || item._id}
                      messageItem={item}
                      documents={documents}
                    />
                  );
                }

                return (
                  <div key={item.id} data-message-id={item.id} className="group">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-groupBlue bg-background text-xs font-black uppercase text-primaryText">
                        {authorName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-black uppercase tracking-[0.12em] text-groupBlue">
                            {authorName}
                          </p>
                          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondaryText">
                            {formatTime(item.ts)}
                          </span>
                          <ReadReceipt readBy={item.meta?.readBy || []} isOwnMessage={isOwnMessage} />
                        </div>
                        <div className="mt-1 inline-block max-w-[720px] border-2 border-border bg-[#11161f] px-3 py-2 text-sm leading-6 text-primaryText shadow-[4px_4px_0px_0px_#000]">
                          {item.message}
                        </div>
                        <div className="mt-1 flex items-center gap-2 opacity-0 transition-opacity duration-175 group-hover:opacity-100 group-focus-within:opacity-100">
                          <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center border border-border bg-background text-secondaryText"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2.25} />
                          </button>
                          <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center border border-border bg-background text-secondaryText"
                          >
                            <Smile className="h-3.5 w-3.5" strokeWidth={2.25} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Document Attachments */}
              {docItems.map((docItem) => {
                const docUploaderName =
                  typeof docItem.document.uploadedBy === 'object'
                    ? docItem.document.uploadedBy?.name ||
                      docItem.document.uploadedBy?.username ||
                      docItem.document.uploadedBy?.id ||
                      'User'
                    : docItem.document.uploadedBy || 'User';

                return (
                  <div
                    key={docItem.id}
                    className="ml-3 border-2 border-border bg-[#11161f] p-4 shadow-[4px_4px_0px_0px_#3B82F6]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-black uppercase tracking-[0.12em] text-groupBlue">
                        PDF Attached
                      </p>
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondaryText">
                        {formatTime(docItem.document.uploadedAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-bold text-primaryText">{docItem.document.name}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-secondaryText">
                      <span>Uploaded By: {docUploaderName}</span>
                      <span className="border border-border px-2 py-1 text-groupBlue">
                        {docItem.document.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {newMessageCount > 0 && (
        <button
          type="button"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 border-2 border-border bg-groupBlue px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-primaryText shadow-group"
          onClick={() => {
            setNewMessageCount(0);
            shouldStickToBottomRef.current = true;
            scrollToBottom('smooth');
          }}
        >
          ↓ {newMessageCount} New Message{newMessageCount > 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}

export default MessageList;
