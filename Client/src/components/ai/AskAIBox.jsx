import { AtSign, Bot, FileText, Paperclip, SendHorizontal, Sparkles } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

function AskAIBox({ onAddDocuments, onOpenDocuments }) {
  const [question, setQuestion] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [attachedFileName, setAttachedFileName] = useState('');
  const textareaRef = useRef(null);

  const addAiMention = () => {
    setQuestion((current) => (current.includes('@AI') ? current : `@AI ${current}`.trim()));
  };

  const uploadFiles = (fileList) => {
    const files = Array.from(fileList || []);

    if (files.length === 0) {
      return;
    }

    const file = files[0];

    setAttachedFileName(file.name);
    setUploadProgress(0);

    window.setTimeout(() => setUploadProgress(35), 120);
    window.setTimeout(() => setUploadProgress(72), 260);
    window.setTimeout(() => {
      setUploadProgress(100);
      onAddDocuments?.([
        {
          id: `${file.name}-${file.size}`,
          name: file.name,
          size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          uploadedBy: 'You',
          uploadedAt: 'Today',
          status: 'ready',
        },
      ]);
      toast.success(`${file.name} attached and indexed in mock flow.`);
    }, 420);
  };

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 60), 180);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 180 ? 'auto' : 'hidden';
  }, [question, attachedFileName]);

  const handleAttachPdf = (event) => {
    uploadFiles(event.target.files);
    event.target.value = '';
  };

  const handleSend = () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      toast.error('Enter a question for the group or AI.');
      return;
    }

    console.log('Ask AI:', trimmedQuestion);
    toast.success('Mock AI request captured.');
    setQuestion('');
  };

  return (
    <section
      className="dashboard-shell noise-panel accent-purple border-aiPurple p-3"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        uploadFiles(event.dataTransfer.files);
      }}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        className="max-h-[180px] min-h-[60px] w-full resize-none overflow-hidden bg-transparent px-1 py-1 text-sm leading-6 text-primaryText outline-none placeholder:text-secondaryText"
        placeholder="Ask team or @AI anything..."
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-border bg-background text-primaryText">
            <Paperclip className="h-4 w-4" strokeWidth={2.25} />
            <input type="file" accept=".pdf" className="hidden" onChange={handleAttachPdf} />
          </label>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center border-2 border-border bg-background text-primaryText"
            onClick={addAiMention}
          >
            <AtSign className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center border-2 border-border bg-background text-groupBlue"
            onClick={onOpenDocuments}
            aria-label="Tracked PDFs"
          >
            <FileText className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center border-2 border-aiPurple bg-aiPurple/10 text-aiPurple"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 border-2 border-aiPurple bg-aiPurple px-4 py-2.5 text-sm font-black uppercase tracking-[0.14em] text-primaryText shadow-ai"
          onClick={handleSend}
        >
          Send
          <SendHorizontal className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-aiPurple">
          <Bot className="h-4 w-4" strokeWidth={2.25} />
          Ask AI In This Group
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondaryText">
          Shift + Enter For New Line
        </p>
      </div>

      {(attachedFileName || uploadProgress !== null) && (
        <div className="mt-3 border-t-2 border-border pt-3">
          <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.16em]">
            <span className="truncate text-primaryText">{attachedFileName || 'Uploading PDF'}</span>
            <span className="text-groupBlue">
              {uploadProgress === 100 ? 'ready' : `${uploadProgress ?? 0}%`}
            </span>
          </div>
          <div className="mt-2 h-2 border border-border bg-[#0f131b]">
            <div
              className="h-full bg-groupBlue transition-all duration-175"
              style={{ width: `${uploadProgress ?? 0}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default AskAIBox;
