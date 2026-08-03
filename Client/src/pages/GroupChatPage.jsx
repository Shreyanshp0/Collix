import { Activity, Hash, FileText, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import aiApi from '../api/ai.api.js';
import documentsApi from '../api/documents.api.js';
import groupsApi from '../api/groups.api.js';
import useAuth from '../hooks/useAuth.jsx';
import useMessages from '../hooks/useMessages.jsx';
import useSocket from '../hooks/useSocket.jsx';
import AskAIBox from '../components/ai/AskAIBox.jsx';
import MessageList from '../components/chat/MessageList.jsx';
import TypingIndicator from '../components/chat/TypingIndicator.jsx';
import DocumentList from '../components/documents/DocumentList.jsx';
import DocumentUpload from '../components/documents/DocumentUpload.jsx';
import AddMemberForm from '../components/groups/AddMemberForm.jsx';
import GroupDetailsPanel from '../components/groups/GroupDetailsPanel.jsx';
import MemberList from '../components/groups/MemberList.jsx';
import Modal from '../components/shared/Modal.jsx';

function GroupChatPage() {
  const { groupId } = useParams();
  const { user: currentUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const safetyTimeoutRef = useRef(null);

  const [aiLoading, setAiLoading] = useState(false);

  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);

  const handleAskAi = async (questionText) => {
    if (!groupId || !questionText) return;
    setAiLoading(true);

    try {
      const data = await aiApi.ask({ groupId, question: questionText });
      if (data?.message) {
        appendMessage(data.message);
      }
    } catch (err) {
      console.error('AI Q&A Error:', err);
      const message = err.response?.data?.message || err.message || 'Failed to process AI question';
      toast.error(message);
    } finally {
      setAiLoading(false);
    }
  };

  const {
    messages,
    loading: messagesLoading,
    loadingMore,
    error: messagesError,
    hasNextPage,
    loadMore,
    appendMessage,
    updateMessage,
    retry: retryMessages,
  } = useMessages(groupId);

  // Fetch live documents for the active group
  const fetchGroupDocuments = useCallback(async () => {
    if (!groupId) return;
    setDocumentsLoading(true);
    setDocumentsError(null);
    try {
      const docs = await documentsApi.list(groupId);
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error('Failed to fetch group documents:', err);
      const message = err.response?.data?.message || err.message || 'Failed to load documents';
      setDocumentsError(message);
    } finally {
      setDocumentsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupDocuments();
  }, [fetchGroupDocuments]);

  // Optimistically append uploaded documents without refetching GET
  const handleAddDocuments = (newDocuments) => {
    if (!Array.isArray(newDocuments) || newDocuments.length === 0) return;
    setDocuments((current) => {
      const existingIds = new Set(current.map((d) => d.id));
      const filteredNew = newDocuments.filter((d) => !existingIds.has(d.id));
      return [...filteredNew, ...current];
    });
  };

  // Optimistically delete document with rollback on API failure
  const handleDeleteDocument = async (documentId) => {
    if (!documentId) return;
    const previousDocs = [...documents];
    setDocuments((current) => current.filter((d) => d.id !== documentId));

    try {
      await documentsApi.remove(documentId);
      toast.success('Document deleted successfully');
    } catch (err) {
      console.error('Failed to delete document:', err);
      setDocuments(previousDocs); // Rollback on error
      const message = err.response?.data?.message || err.message || 'Failed to delete document';
      toast.error(message);
    }
  };

  // Clear typing users on room change or disconnect
  useEffect(() => {
    setTypingUsers([]);
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  }, [groupId, isConnected]);

  // Group room join/leave socket lifecycle and real-time message subscription
  useEffect(() => {
    if (!socket || !groupId || !isConnected) return;

    socket.emit('group:join', { groupId });

    const handleNewMessage = (payload) => {
      if (!payload) return;
      if (payload.groupId && payload.groupId !== groupId) return;
      appendMessage(payload);
    };

    socket.off('new-message', handleNewMessage);
    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.emit('group:leave', { groupId });
    };
  }, [socket, groupId, isConnected, appendMessage]);

  // Ephemeral Real-time User Presence Subscription
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlePresenceUpdate = (payload) => {
      if (!payload) return;
      const targetUserId = payload.user?.id || payload.user?._id || payload.userId;
      if (!targetUserId) return;

      setMembers((currentMembers) => {
        const isMember = currentMembers.some(
          (m) => (m.user?.id || m.user?._id || m.id || m._id) === targetUserId,
        );

        if (!isMember && payload.user) {
          return [
            ...currentMembers,
            {
              id: targetUserId,
              role: 'MEMBER',
              status: payload.status || 'online',
              user: payload.user,
            },
          ];
        }

        return currentMembers.map((m) => {
          const memberUserId = m.user?.id || m.user?._id || m.id || m._id;
          if (memberUserId === targetUserId) {
            const newStatus = payload.status || 'online';
            return {
              ...m,
              status: newStatus,
              user: m.user ? { ...m.user, status: newStatus } : { id: targetUserId, status: newStatus },
            };
          }
          return m;
        });
      });
    };

    socket.off('presence:update', handlePresenceUpdate);
    socket.on('presence:update', handlePresenceUpdate);

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, [socket, isConnected]);

  // Ephemeral Real-time Typing Indicator Subscription
  useEffect(() => {
    if (!socket || !isConnected || !groupId) return;

    const handleTyping = (payload) => {
      if (!payload) return;
      if (payload.groupId && payload.groupId !== groupId) return;

      const rawUsers = payload.users || [];
      const currentUserId = currentUser?.id || currentUser?._id;

      const activeTypers = rawUsers.filter(
        (u) => (u.id || u._id) !== currentUserId,
      );

      setTypingUsers(activeTypers);

      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
      if (activeTypers.length > 0) {
        safetyTimeoutRef.current = setTimeout(() => {
          setTypingUsers([]);
        }, 4000);
      }
    };

    socket.off('typing', handleTyping);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('typing', handleTyping);
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
    };
  }, [socket, isConnected, groupId, currentUser]);

  // Real-time Read Receipt Subscription
  useEffect(() => {
    if (!socket || !isConnected || !groupId) return;

    const handleMessageRead = (payload) => {
      if (!payload) return;
      if (payload.groupId && payload.groupId !== groupId) return;

      const { messageId, readBy } = payload;
      if (!messageId || !Array.isArray(readBy)) return;

      const targetMsg = messages.find((m) => m.id === messageId);
      const existingReadBy = targetMsg?.meta?.readBy || [];

      const mergedReadBy = [...existingReadBy];
      readBy.forEach((userObj) => {
        const uId = userObj.id || userObj._id;
        if (uId && !mergedReadBy.some((r) => (r.id || r._id) === uId)) {
          mergedReadBy.push(userObj);
        }
      });

      updateMessage({
        id: messageId,
        meta: {
          ...(targetMsg?.meta || {}),
          readBy: mergedReadBy,
        },
      });
    };

    socket.off('message:read', handleMessageRead);
    socket.on('message:read', handleMessageRead);

    return () => {
      socket.off('message:read', handleMessageRead);
    };
  }, [socket, isConnected, groupId, messages, updateMessage]);

  const fetchGroupDetails = useCallback(async () => {
    if (!groupId) return;
    try {
      setLoading(true);
      const data = await groupsApi.getById(groupId);
      const groupData = data.group || data;
      const membersData = data.members || groupData.members || [];
      setGroup(groupData);
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to fetch group details:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  const gridColsClass = detailsCollapsed
    ? 'xl:grid-cols-[64px_minmax(0,1fr)_minmax(260px,18%)]'
    : 'xl:grid-cols-[minmax(260px,18%)_minmax(0,1fr)_minmax(260px,18%)]';

  const groupDisplayName = group?.name || groupId?.replace(/-/g, ' ') || 'Group Chat';

  return (
    <div className="h-full overflow-hidden">
      <div className={`grid h-full grid-cols-1 gap-2 overflow-hidden ${gridColsClass}`}>
        {detailsCollapsed ? (
          <aside className="hidden xl:flex min-h-0 w-16 flex-col items-center gap-3 px-1 py-3">
            <button
              type="button"
              onClick={() => setDetailsCollapsed(false)}
              className="flex h-12 w-12 items-center justify-center rounded-sm border-2 border-border bg-background font-black uppercase text-primaryText"
              aria-label="Open sidebar"
            >
              {groupDisplayName.charAt(0)}
            </button>
            <button type="button" className="flex h-12 w-12 items-center justify-center rounded-sm border-2 border-border bg-background text-primaryText">
              <FileText className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <button type="button" className="flex h-12 w-12 items-center justify-center rounded-sm border-2 border-border bg-background text-primaryText">
              <Users className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </aside>
        ) : (
          <aside className="hidden xl:flex min-h-0 min-w-0 flex-col">
            <GroupDetailsPanel
              activeGroupId={groupId}
              group={group}
              onCollapse={() => setDetailsCollapsed(true)}
              loading={loading}
              documents={documents}
              members={members}
              onDeleteDocument={handleDeleteDocument}
            />
          </aside>
        )}

        <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <section className="dashboard-shell noise-panel accent-purple flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-border/40 px-3 py-1">
              <div className="flex h-8 w-8 items-center justify-center border-2 border-border bg-groupBlue text-primaryText">
                <Hash className="h-3.5 w-3.5" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1 border-2 border-border bg-[#0f131b] px-3 py-2 shadow-group">
                <p className="truncate text-base font-black uppercase tracking-[0.14em] text-primaryText">
                  {loading ? 'Loading workspace...' : groupDisplayName}
                </p>
              </div>
              <div className="hidden items-center gap-2 border-2 border-border bg-[#0f131b] px-2 py-1.5 lg:flex">
                <Activity className="h-4 w-4 text-presenceGreen" strokeWidth={2.25} />
                <span className="text-xs font-black uppercase tracking-[0.18em] text-presenceGreen">
                  {isConnected ? 'Live WSS' : 'Connecting...'}
                </span>
              </div>
            </div>

            <MessageList
              messages={messages}
              loading={messagesLoading}
              loadingMore={loadingMore}
              error={messagesError}
              hasNextPage={hasNextPage}
              onLoadMore={loadMore}
              onRetry={retryMessages}
              documents={documents}
              activeGroupKey={groupId}
            />

            {typingUsers.length > 0 && (
              <div className="shrink-0 px-3 pb-1">
                <TypingIndicator users={typingUsers} />
              </div>
            )}

            {aiLoading && (
              <div className="shrink-0 px-3 pb-1">
                <div className="flex items-center gap-2 rounded-sm border border-aiPurple/50 bg-[#12101b] px-3 py-1.5 text-xs text-aiPurple font-bold">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-aiPurple border-t-transparent" />
                  <span>🤖 Nexus AI is analyzing knowledge base & writing answer...</span>
                </div>
              </div>
            )}

            <div className="shrink-0 px-3 pb-2">
              <AskAIBox
                onAddDocuments={handleAddDocuments}
                onOpenDocuments={() => setIsDocumentsModalOpen(true)}
                onAskAi={handleAskAi}
                activeGroupId={groupId}
              />
            </div>
          </section>
        </main>

        <aside className="hidden xl:flex min-h-0 min-w-0 flex-col">
          <section className="dashboard-shell noise-panel flex min-h-0 flex-1 flex-col px-2 py-3">
            <div className="border-b border-border/40 pb-3">
              <p className="section-label text-aiPurple">
                03 Active Members ({members.length})
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-secondaryText">
                Presence
              </p>
            </div>
            <div className="mt-3 min-h-0 flex-1 pr-2">
              <div className="scroll-panel h-full overflow-y-auto">
                <MemberList members={members} />
              </div>
            </div>
            <div className="mt-2 shrink-0">
              <AddMemberForm groupId={groupId} onMemberAdded={fetchGroupDetails} />
            </div>
          </section>
        </aside>
      </div>

      {isDocumentsModalOpen && (
        <Modal
          isOpen={isDocumentsModalOpen}
          onClose={() => setIsDocumentsModalOpen(false)}
          size="lg"
          sectionLabel="GROUP DOCUMENTS"
          title="Group Documents"
          subtitle="Upload and view team PDF / DOCX files"
        >
          <div className="space-y-4">
            <DocumentUpload groupId={groupId} onAddDocuments={handleAddDocuments} />
            <DocumentList
              documents={documents}
              loading={documentsLoading}
              error={documentsError}
              onDeleteDocument={handleDeleteDocument}
              onRetry={fetchGroupDocuments}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default GroupChatPage;