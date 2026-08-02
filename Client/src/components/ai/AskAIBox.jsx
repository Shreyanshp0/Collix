import { SendHorizontal } from 'lucide-react';
import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function AskAIBox({ onAddDocuments, onOpenDocuments, activeGroupId }) {
  const [question, setQuestion] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploadProgressMap, setUploadProgressMap] = useState({});
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const plusMenuRef = useRef(null);
  const firstMenuItemRef = useRef(null);
  const [plusOpen, setPlusOpen] = useState(false);

  const MIN_TEXTAREA = 24; // px for one line visual
  const MAX_TEXTAREA = 140; // px approx 4-5 lines

  const addAiMention = () => {
    setQuestion((current) => (current.includes('@AI') ? current : `@AI ${current}`.trim()));
    setPlusOpen(false);
  };

  const uploadFiles = (fileList) => {
    const files = Array.from(fileList || []);

    if (files.length === 0) return;

    files.forEach((file) => {
      const id = `${file.name}-${file.size}-${Date.now()}`;
      setAttachedFiles((c) => [{ id, name: file.name, size: file.size }, ...c]);
      setUploadProgressMap((m) => ({ ...m, [id]: 0 }));

      // Mock progress and indexing
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
        toast.success(`${file.name} attached and indexed in mock flow.`);
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
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion && attachedFiles.length === 0) {
      toast.error('Enter a question or attach a PDF.');
      return;
    }

    console.log('Ask AI:', trimmedQuestion, attachedFiles);
    toast.success('Mock AI request captured.');
    setQuestion('');
    setAttachedFiles([]);
    setUploadProgressMap({});
    setPlusOpen(false);
  };

  // Close plus menu on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setPlusOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);

    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Focus first menu item when opening for keyboard accessibility
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
      {/* Attachment chips above composer */}
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
        placeholder="Ask team or @AI anything..."
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
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
            className="flex h-10 w-10 items-center justify-center border-2 border-border bg-background text-primaryText"
            title="Quick actions"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setPlusOpen((s) => !s);
              }
            }}
          >
            +
          </button>

          {plusOpen && (
            <div className="absolute left-0 bottom-[110%] z-50 w-44 rounded-sm border-2 border-border bg-[#0f131b] p-2 shadow-group">
              <button
                ref={firstMenuItemRef}
                type="button"
                className="block w-full text-left px-2 py-2 text-sm font-black uppercase tracking-[0.12em] text-primaryText"
                onClick={() => {
                  fileInputRef.current?.click();
                  setPlusOpen(false);
                }}
              >
                Upload PDF
              </button>
              <button
                type="button"
                className="block w-full text-left px-2 py-2 text-sm font-black uppercase tracking-[0.12em] text-primaryText"
                onClick={() => {
                  onOpenDocuments?.();
                  setPlusOpen(false);
                }}
              >
                Open Documents
              </button>
              <button
                type="button"
                className="block w-full text-left px-2 py-2 text-sm font-black uppercase tracking-[0.12em] text-primaryText"
                onClick={() => {
                  addAiMention();
                }}
              >
                Mention AI
              </button>
              <button
                type="button"
                className="block w-full text-left px-2 py-2 text-sm font-black uppercase tracking-[0.12em] text-primaryText"
                onClick={() => {
                  setPlusOpen(false);
                  // Simulate asking group AI by sending current question
                  handleSend();
                }}
              >
                Ask Group AI
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 border-2 border-aiPurple bg-aiPurple px-3 h-10 text-sm font-black uppercase tracking-[0.12em] text-primaryText shadow-ai"
            onClick={handleSend}
            style={{ height: '40px' }}
          >
            Send
            <SendHorizontal className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-end">
        <p className="text-[10px] text-secondaryText">Shift + Enter for new line</p>
      </div>

      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleAttachPdf} />
    </section>
  );
}

export default AskAIBox;
