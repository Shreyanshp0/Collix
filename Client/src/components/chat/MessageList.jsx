import { Smile, ThumbsUp } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const conversation = [
  {
    id: '1',
    type: 'message',
    name: 'Alex',
    time: '10:14 AM',
    accent: 'text-groupBlue',
    message: 'Did we finalize the EC2 pipeline for the production deployment?',
  },
  {
    id: '1-ai',
    type: 'ai',
    time: '10:14 AM',
  },
  {
    id: '2',
    type: 'message',
    name: 'Sarah',
    time: '10:15 AM',
    accent: 'text-groupBlue',
    message: "Perfect, I'll update the infrastructure diagram.",
  },
];

const BOTTOM_THRESHOLD = 40;

function MessageList({ documents = [], activeGroupKey }) {
  const containerRef = useRef(null);
  const initializedRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);
  const previousCountRef = useRef(0);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const items = useMemo(
    () => [
      ...conversation,
      ...documents.map((document) => ({
        id: document.id,
        type: 'document',
        document,
      })),
    ],
    [documents],
  );

  const isNearBottom = () => {
    const container = containerRef.current;

    if (!container) {
      return true;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    return distanceFromBottom <= BOTTOM_THRESHOLD;
  };

  const scrollToBottom = (behavior = 'auto') => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  };

  useLayoutEffect(() => {
    initializedRef.current = false;
    previousCountRef.current = items.length;
    setNewMessageCount(0);
  }, [activeGroupKey, items.length]);

  useLayoutEffect(() => {
    if (!initializedRef.current) {
      scrollToBottom('auto');
      initializedRef.current = true;
      shouldStickToBottomRef.current = true;
    }
  }, [activeGroupKey, items.length]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const handleScroll = () => {
      const pinned = isNearBottom();
      shouldStickToBottomRef.current = pinned;

      if (pinned) {
        setNewMessageCount(0);
      }
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [activeGroupKey]);

  useEffect(() => {
    const previousCount = previousCountRef.current;
    const nextCount = items.length;

    if (nextCount > previousCount) {
      const addedCount = nextCount - previousCount;

      if (shouldStickToBottomRef.current) {
        scrollToBottom('smooth');
      } else {
        setNewMessageCount((current) => current + addedCount);
      }
    }

    previousCountRef.current = nextCount;
  }, [items]);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div ref={containerRef} className="scroll-panel h-full overflow-y-auto px-2 py-1">
        <div className="flex min-h-full flex-col justify-end gap-2">
          <div data-pagination-anchor="top" />

          {items.length === 0 ? (
            <div className="border-2 border-border bg-[#0f131b] px-3 py-3 text-sm leading-6 text-secondaryText">
              No messages yet. Start the conversation or ask AI something in this group.
            </div>
          ) : (
            items.map((item) => {
              if (item.type === 'message') {
                return (
                  <div key={item.id} className="group">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-groupBlue bg-background text-xs font-black uppercase text-primaryText">
                        {item.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <p className={`text-sm font-black uppercase tracking-[0.12em] ${item.accent}`}>
                            {item.name}
                          </p>
                          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondaryText">
                            {item.time}
                          </span>
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
              }

              if (item.type === 'ai') {
                return (
                  <div key={item.id} className="ml-2 border-2 border-aiPurple bg-[#12101b] p-3 shadow-ai">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-aiPurple bg-background text-aiPurple">
                          ✦
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black uppercase tracking-[0.12em] text-aiPurple">
                            AI Assistant
                          </p>
                          <span className="border border-aiPurple px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-aiPurple">
                            RAG Grounded
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondaryText">{item.time}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-primaryText">
                      Yes, per Section 8 of the 03 Launch Strategy document, we will use a single EC2 instance
                      with Docker containerization for the initial deployment.
                    </p>
                    <div className="mt-2 inline-flex flex-wrap items-center gap-2 border border-aiPurple px-2 py-1 text-xs font-bold text-secondaryText">
                      <span className="text-aiPurple">Source:</span>
                      <span className="uppercase tracking-[0.16em] text-primaryText">q3_specs.pdf</span>
                      <span>(Section 8.2)</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="ml-3 border-2 border-border bg-[#11161f] p-4 shadow-[4px_4px_0px_0px_#3B82F6]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-groupBlue">
                      PDF Attached
                    </p>
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondaryText">
                      {item.document.uploadedAt}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-primaryText">{item.document.name}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-secondaryText">
                    <span>Uploaded By: {item.document.uploadedBy}</span>
                    <span className="border border-border px-2 py-1 text-groupBlue">
                      {item.document.status}
                    </span>
                  </div>
                </div>
              );
            })
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
          ↓ {newMessageCount} New Messages
        </button>
      )}
    </div>
  );
}

export default MessageList;
