import { SendHorizontal } from 'lucide-react';
import { useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import useSocket from '../../hooks/useSocket.jsx';

function AskAIBox({ onAddDocuments, onOpenDocuments, onAskAi, activeGroupId }) {
  const { socket, isConnected } = useSocket();
  const [question, setQuestion] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploadProgressMap, setUploadProgressMap] = useState({});
  const [sending, setSending] = useState(false);

  const isTypingRef = useRef(false);
  const inactivityTimerRef = useRef(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const plusMenuRef = useRef(null);
  const firstMenuItemRef = useRef(null);
  const [plusOpen, setPlusOpen] = useState(false);

  const MIN_TEXTAREA = 24;
  const MAX_TEXTAREA = 140;

  const stopTyping = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;
      if (socket && isConnected && activeGroupId) {
        socket.emit('typing:stop', { groupId: activeGroupId });
      }
    }
  }, [socket, isConnected, activeGroupId]);

  const handleInputChange = (event) => {
    const val = event.target.value;
    setQuestion(val);

    const trimmed = val.trim();
    if (!trimmed) {
      stopTyping();
      return;
    }

    if (!isTypingRef.current && socket && isConnected && activeGroupId) {
      isTypingRef.current = true;
      socket.emit('typing:start', { groupId: activeGroupId });
    }

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const addAiMention = () => {
    setQuestion((current) => (current.includes('@AI') ? current : `@AI ${current}`.trim()));
    setPlusOpen(false);
    textareaRef.current?.focus();
  };

  const uploadFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const id = `${file.name}-${file.size}-${Date.now()}`;
      setAttachedFiles((c) => [{ id, name: file.name, size: file.size }, ...c]);
      setUploadProgressMap((m) => ({ ...m, [id]: 0 }));

      window.setTimeout(() => setUploadProgressMap((m) => ({ ...m, [id]: 35 })), 120);
      window.setTimeout(() => setUploadProgressMap((m) => ({ ...m, [id]: 72 })), 260);
      window.setTimeout(() => {
        setUploadProgressMap((m) => ({ ...m, [id]: 100 }));
        onAddDocuments?.([
          {
            id: `${file.name}-${file.size}`,
            name: file.name,
            size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
            uploadedBy: 'You',
            uploadedAt: new Date().toISOString(),
            status: 'ready',
            groupId: activeGroupId,
          },
        ]);
        toast.success(`${file.name} attached.`);
      }, 420);
    });
  };

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, MIN_TEXTAREA), MAX_TEXTAREA);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA ? 'auto' : 'hidden';
  }, [question, attachedFiles.length]);

  const handleAttachPdf = (event) => {
    uploadFiles(event.target.files);
    event.target.value = '';
  };

  const handleRemoveAttachment = (id) => {
    setAttachedFiles((current) => current.filter((f) => f.id !== id));
    setUploadProgressMap((m) => {
      const copy = { ...m };
      delete copy[id];
      return copy;
    });
  };

  const handleSend = () => {
    stopTyping();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion && attachedFiles.length === 0) {
      toast.error('Enter a message or attach a file.');
      return;
    }

    if (!activeGroupId) {
      toast.error('No active group selected.');
      return;
    }

    // AI Query handler if input has @AI mention or onAskAi is present
    if (trimmedQuestion.startsWith('@AI') || trimmedQuestion.startsWith('@ai')) {
      const queryText = trimmedQuestion.replace(/^@ai\s*/i, '').trim();
      if (!queryText) {
        toast.error('Please type a question after @AI.');
        return;
      }
      if (onAskAi) {
        onAskAi(queryText);
        setQuestion('');
        setPlusOpen(false);
        return;
      }
    }

    // Realtime Socket Message Send Flow
    if (socket && isConnected && attachedFiles.length === 0) {
      setSending(true);
      socket.emit(
        'message:send',
        {
          groupId: activeGroupId,
          message: trimmedQuestion,
          type: 'text',
        },
        (response) => {
          setSending(false);
          if (response?.error) {
            toast.error(response.error.message || 'Failed to send message');
          } else {
            setQuestion('');
          }
        },
      );
      return;
    }

    if (onAskAi && trimmedQuestion) {
      onAskAi(trimmedQuestion);
      setQuestion('');
      setAttachedFiles([]);
      setUploadProgressMap({});
      setPlusOpen(false);
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setPlusOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => {
      document.removeEventListener('click', onDocClick);
      stopTyping();
    };
  }, [stopTyping]);

  useEffect(() => {
    if (plusOpen) {
      setTimeout(() => {
        firstMenuItemRef.current?.focus();
      }, 10);
    }
  }, [plusOpen]);

  return (
    <section
      className="dashboard-shell noise-panel accent-purple border-aiPurple px-2 py-2 min-h-[80px]"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        uploadFiles(event.dataTransfer.files);
      }}
    >
      {attachedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {attachedFiles.map((f) => (
            <div key={f.id} className="flex items-center gap-2 rounded-sm border-2 border-border bg-[#0f131b] px-2 py-1 text-xs font-bold uppercase tracking-[0.12em]">
              <span>📄</span>
              <span className="max-w-[160px] truncate">{f.name}</span>
              <span className="text-groupBlue">{uploadProgressMap[f.id] === 100 ? 'READY' : `${uploadProgressMap[f.id] ?? 0}%`}</span>
              <button type="button" onClick={() => handleRemoveAttachment(f.id)} className="ml-1 text-secondaryText">✕</button>
            </div>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        rows={1}
        className="w-full resize-none overflow-hidden bg-transparent px-1 py-1 text-sm leading-6 text-primaryText outline-none placeholder:text-secondaryText"
        placeholder="Type a message or @AI..."
        value={question}
        onChange={handleInputChange}
        onBlur={stopTyping}
        disabled={sending}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      <div className="mt-1 flex items-center justify-between">
        <div className="relative" ref={plusMenuRef}>
          <button
            type="button"
            aria-expanded={plusOpen}
            onClick={() => setPlusOpen((s) => !s)}
            className="flex h-10 w-10 items-center justify-center border-2 border-border bg-background text-primaryText font-bold"
            title="Quick actions"
          >
            +
          </button>

          {plusOpen && (
            <div className="absolute left-0 bottom-[110%] z-50 w-44 rounded-sm border-2 border-border bg-[#0f131b] p-2 shadow-group">
              <button
                ref={firstMenuItemRef}
                type="button"
                className="block w-full text-left px-2 py-2 text-sm font-black uppercase tracking-[0.12em] text-primaryText hover:bg-white/5"
                onClick={() => {
                  fileInputRef.current?.click();
                  setPlusOpen(false);
                }}
              >
                Upload PDF
              </button>
              <button
                type="button"
                className="block w-full text-left px-2 py-2 text-sm font-black uppercase tracking-[0.12em] text-primaryText hover:bg-white/5"
                onClick={() => {
                  onOpenDocuments?.();
                  setPlusOpen(false);
                }}
              >
                Open Documents
              </button>
              <button
                type="button"
                className="block w-full text-left px-2 py-2 text-sm font-black uppercase tracking-[0.12em] text-primaryText hover:bg-white/5"
                onClick={() => {
                  addAiMention();
                }}
              >
                Mention AI
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            multiple
            className="hidden"
            onChange={handleAttachPdf}
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="brutal-button flex items-center gap-2"
        >
          <span>{sending ? 'Sending...' : 'Send'}</span>
          <SendHorizontal className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>
    </section>
  );
}

export default AskAIBox;
