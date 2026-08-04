import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import documentsApi from '../api/documents.api.js';
import useAuth from './useAuth.jsx';
import useSocket from './useSocket.jsx';
import { DOCUMENT_STATUS } from '../utils/documentStatus.js';
import { validateFilesForUpload } from '../utils/fileValidation.js';
import logger from '../utils/logger.js';

export function useDocuments(groupId) {
  const { user: currentUser } = useAuth();
  const { socket, isConnected } = useSocket();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgressMap, setUploadProgressMap] = useState({});
  const [ariaAnnouncement, setAriaAnnouncement] = useState('');

  const previousStatusMapRef = useRef(new Map());

  const announce = useCallback((message) => {
    setAriaAnnouncement(message);
  }, []);

  // Fetch initial documents
  const fetchDocuments = useCallback(async () => {
    if (!groupId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const docs = await documentsApi.list(groupId);
      const items = Array.isArray(docs) ? docs : [];
      setDocuments(items);

      // Track initial statuses
      items.forEach((d) => {
        if (d.id) {
          previousStatusMapRef.current.set(d.id, d.status || d.processingStatus);
        }
      });
    } catch (err) {
      logger.error('Failed to fetch group documents', { groupId, error: err.message });
      const message = err.response?.data?.message || err.message || 'Failed to load documents';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Unified real upload handler with upfront validation & optimistic UI
  const uploadDocuments = useCallback(
    async (fileList) => {
      if (!groupId) {
        toast.error('No active group selected.');
        return false;
      }

      const validation = validateFilesForUpload(fileList, documents);
      if (!validation.valid) {
        toast.error(validation.error);
        announce(validation.error);
        return false;
      }

      const filesToUpload = validation.files;

      // 1. Create optimistic document objects with client-generated tempIds
      const optimisticItems = filesToUpload.map((file) => {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        return {
          id: tempId,
          tempId,
          isOptimistic: true,
          name: file.name,
          originalName: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
          uploadedBy: {
            id: currentUser?.id || currentUser?._id,
            name: currentUser?.name || currentUser?.username || 'You',
          },
          status: DOCUMENT_STATUS.UPLOADING,
          processingStatus: DOCUMENT_STATUS.UPLOADING,
          groupId,
        };
      });

      // 2. Immutable state update: prepend optimistic documents
      setDocuments((current) => [...optimisticItems, ...current]);

      // 3. Initialize progress state for each tempId
      setUploadProgressMap((currentMap) => {
        const copy = { ...currentMap };
        optimisticItems.forEach((item) => {
          copy[item.tempId] = 0;
        });
        return copy;
      });

      announce(`Started uploading ${filesToUpload.length} file(s).`);

      try {
        // 4. Axios upload request with progress callback
        const uploadedDocs = await documentsApi.upload({
          groupId,
          files: filesToUpload,
          onProgress: (percent) => {
            setUploadProgressMap((currentMap) => {
              const copy = { ...currentMap };
              optimisticItems.forEach((item) => {
                copy[item.tempId] = percent;
              });
              return copy;
            });
          },
        });

        const serverDocs = Array.isArray(uploadedDocs) ? uploadedDocs : [];
        const tempIdSet = new Set(optimisticItems.map((i) => i.tempId));

        // 5. Immutable replacement of optimistic items with real server DTOs
        setDocuments((current) => {
          // Remove all optimistic items matching this upload batch
          const filtered = current.filter((doc) => !tempIdSet.has(doc.id) && !tempIdSet.has(doc.tempId));
          const existingIds = new Set(filtered.map((d) => d.id));
          const newUniqueDocs = serverDocs.filter((d) => !existingIds.has(d.id));
          return [...newUniqueDocs, ...filtered];
        });

        // 6. Clean up progress state for completed tempIds
        setUploadProgressMap((currentMap) => {
          const copy = { ...currentMap };
          tempIdSet.forEach((tId) => {
            delete copy[tId];
          });
          return copy;
        });

        const successMessage = `Uploaded ${serverDocs.length} document${serverDocs.length > 1 ? 's' : ''}!`;
        toast.success(successMessage);
        announce(successMessage);
        return true;
      } catch (err) {
        logger.error('Document upload failed', { groupId, error: err.message });
        const tempIdSet = new Set(optimisticItems.map((i) => i.tempId));

        // Revert optimistic items immutably
        setDocuments((current) =>
          current.filter((doc) => !tempIdSet.has(doc.id) && !tempIdSet.has(doc.tempId))
        );

        setUploadProgressMap((currentMap) => {
          const copy = { ...currentMap };
          tempIdSet.forEach((tId) => {
            delete copy[tId];
          });
          return copy;
        });

        const errorMessage = err.response?.data?.message || err.message || 'Upload failed. Please try again.';
        toast.error(errorMessage);
        announce(`Upload failed: ${errorMessage}`);
        return false;
      }
    },
    [groupId, documents, currentUser, announce]
  );

  // Optimistic document deletion with rollback
  const deleteDocument = useCallback(
    async (documentId) => {
      if (!documentId) return;
      const targetDoc = documents.find((d) => d.id === documentId);
      const docName = targetDoc?.originalName || targetDoc?.name || 'Document';

      // Immutable optimistic removal
      setDocuments((current) => current.filter((d) => d.id !== documentId));

      try {
        await documentsApi.remove(documentId);
        toast.success(`Deleted "${docName}"`);
        announce(`Deleted ${docName}`);
      } catch (err) {
        logger.error('Failed to delete document', { documentId, error: err.message });
        // Rollback immutably if targetDoc exists
        if (targetDoc) {
          setDocuments((current) => [targetDoc, ...current]);
        }
        const message = err.response?.data?.message || err.message || 'Failed to delete document';
        toast.error(message);
        announce(`Failed to delete ${docName}`);
      }
    },
    [documents, announce]
  );

  // Socket real-time event listeners with strict cleanup
  useEffect(() => {
    if (!socket || !groupId || !isConnected) return;

    const handleDocumentCreated = (payload) => {
      const newDoc = payload?.document || payload;
      if (!newDoc || (!newDoc.id && !newDoc._id)) return;
      const targetGroupId = newDoc.groupId || newDoc.group;
      if (targetGroupId && targetGroupId.toString() !== groupId.toString()) return;

      const docId = newDoc.id || newDoc._id;

      setDocuments((current) => {
        // If already exists by id, ignore duplicate
        if (current.some((d) => d.id === docId)) {
          return current;
        }

        // Check if there is a matching optimistic item by name & size or tempId
        const matchIndex = current.findIndex(
          (d) =>
            d.isOptimistic &&
            ((d.name === newDoc.name && d.size === newDoc.size) || d.tempId === newDoc.tempId)
        );

        if (matchIndex !== -1) {
          const copy = [...current];
          copy[matchIndex] = newDoc;
          return copy;
        }

        return [newDoc, ...current];
      });

      if (newDoc.uploadedBy?.id !== (currentUser?.id || currentUser?._id)) {
        toast.info(`New document uploaded: ${newDoc.originalName || newDoc.name}`);
        announce(`New document uploaded: ${newDoc.originalName || newDoc.name}`);
      }
    };

    const handleDocumentUpdated = (payload) => {
      if (!payload || (!payload.documentId && !payload.id)) return;
      const docId = (payload.documentId || payload.id).toString();
      const targetGroupId = payload.groupId || payload.group;
      if (targetGroupId && targetGroupId.toString() !== groupId.toString()) return;

      setDocuments((current) =>
        current.map((doc) => {
          if (doc.id === docId) {
            const nextStatus = payload.status || payload.processingStatus || doc.status;
            const updated = {
              ...doc,
              status: nextStatus,
              processingStatus: nextStatus,
              metadata: { ...(doc.metadata || {}), ...(payload.metadata || {}) },
            };

            const prevStatus = previousStatusMapRef.current.get(docId);
            if (prevStatus !== nextStatus) {
              previousStatusMapRef.current.set(docId, nextStatus);
              const docName = doc.originalName || doc.name || 'Document';

              if (nextStatus === DOCUMENT_STATUS.READY) {
                toast.success(`✓ AI indexing completed for "${docName}"`);
                announce(`AI indexing completed for ${docName}`);
              } else if (nextStatus === DOCUMENT_STATUS.FAILED) {
                toast.error(`❌ AI indexing failed for "${docName}"`);
                announce(`AI indexing failed for ${docName}`);
              }
            }

            return updated;
          }
          return doc;
        })
      );
    };

    const handleDocumentDeleted = (payload) => {
      const docId = payload?.documentId || payload?.id;
      if (!docId) return;
      const targetGroupId = payload.groupId || payload.group;
      if (targetGroupId && targetGroupId.toString() !== groupId.toString()) return;

      setDocuments((current) => current.filter((d) => d.id !== docId.toString()));
    };

    const handleReconnect = () => {
      logger.info('Socket reconnected, resynchronizing documents', { groupId });
      fetchDocuments();
    };

    // Guarantee clean listener registration
    socket.off('document:created', handleDocumentCreated);
    socket.off('document:updated', handleDocumentUpdated);
    socket.off('document:deleted', handleDocumentDeleted);
    socket.off('connect', handleReconnect);

    socket.on('document:created', handleDocumentCreated);
    socket.on('document:updated', handleDocumentUpdated);
    socket.on('document:deleted', handleDocumentDeleted);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('document:created', handleDocumentCreated);
      socket.off('document:updated', handleDocumentUpdated);
      socket.off('document:deleted', handleDocumentDeleted);
      socket.off('connect', handleReconnect);
    };
  }, [socket, groupId, isConnected, currentUser, announce, fetchDocuments]);

  // Non-blocking background polling fallback when active documents are in non-terminal processing states
  useEffect(() => {
    if (!groupId) return;

    const hasActiveProcessing = documents.some((doc) => {
      const s = (doc.status || doc.processingStatus || '').toLowerCase();
      return (
        s === DOCUMENT_STATUS.UPLOADING ||
        s === DOCUMENT_STATUS.UPLOADED ||
        s === DOCUMENT_STATUS.QUEUED ||
        s === DOCUMENT_STATUS.PROCESSING
      );
    });

    if (!hasActiveProcessing) return;

    const intervalId = setInterval(async () => {
      try {
        const latestDocs = await documentsApi.list(groupId);
        if (Array.isArray(latestDocs)) {
          setDocuments((current) => {
            const tempItems = current.filter((d) => d.isOptimistic);
            const latestIds = new Set(latestDocs.map((d) => d.id));
            const remainingTemp = tempItems.filter((t) => !latestIds.has(t.id));

            // Merge non-optimistic latestDocs with remaining temp items
            return [...remainingTemp, ...latestDocs];
          });
        }
      } catch (err) {
        logger.warn('Background document status polling failed', { error: err.message });
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [groupId, documents]);

  return {
    documents,
    loading,
    error,
    uploadProgressMap,
    ariaAnnouncement,
    uploadDocuments,
    deleteDocument,
    refetchDocuments: fetchDocuments,
  };
}

export default useDocuments;
