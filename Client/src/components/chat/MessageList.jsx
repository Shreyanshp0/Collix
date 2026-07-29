import { Smile, ThumbsUp } from 'lucide-react';

const conversation = [
  {
    id: '1',
    name: 'Alex',
    time: '10:14 AM',
    accent: 'text-groupBlue',
    message: 'Did we finalize the EC2 pipeline for the production deployment?',
  },
  {
    id: '2',
    name: 'Sarah',
    time: '10:15 AM',
    accent: 'text-groupBlue',
    message: "Perfect, I'll update the infrastructure diagram.",
  },
];

function MessageList({ documents = [] }) {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-4">
      <div className="space-y-5">
        {conversation.map((item) => (
          <div key={item.id}>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-groupBlue bg-background text-sm font-black uppercase text-primaryText">
                {item.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <p className={`text-sm font-black uppercase tracking-[0.12em] ${item.accent}`}>{item.name}</p>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondaryText">
                    {item.time}
                  </span>
                </div>
                <div className="mt-2 inline-block max-w-[520px] border-2 border-border bg-[#11161f] px-4 py-3 text-sm leading-7 text-primaryText shadow-[4px_4px_0px_0px_#000]">
                  {item.message}
                </div>
                <div className="mt-3 flex items-center gap-2 text-secondaryText">
                  <button type="button" className="flex h-8 w-8 items-center justify-center border border-border bg-background">
                    <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                  <button type="button" className="flex h-8 w-8 items-center justify-center border border-border bg-background">
                    <Smile className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            </div>

            {item.id === '1' && (
              <div className="mt-5 ml-3 border-2 border-aiPurple bg-[#12101b] p-4 shadow-ai">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-aiPurple bg-background text-aiPurple">
                      ✦
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black uppercase tracking-[0.12em] text-aiPurple">AI Assistant</p>
                      <span className="border border-aiPurple px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-aiPurple">
                        RAG Grounded
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondaryText">
                    10:14 AM
                  </span>
                </div>
                <p className="mt-4 max-w-[560px] text-sm leading-7 text-primaryText">
                  Yes, per Section 8 of the 03 Launch Strategy document, we will use a single EC2 instance
                  with Docker containerization for the initial deployment.
                </p>
                <div className="mt-4 inline-flex flex-wrap items-center gap-3 border border-aiPurple px-3 py-2 text-xs font-bold text-secondaryText">
                  <span className="text-aiPurple">Source:</span>
                  <span className="uppercase tracking-[0.16em] text-primaryText">q3_specs.pdf</span>
                  <span>(Section 8.2)</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {documents.map((document) => (
          <div key={document.id} className="ml-3 border-2 border-border bg-[#11161f] p-4 shadow-[4px_4px_0px_0px_#3B82F6]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-groupBlue">PDF Attached</p>
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-secondaryText">
                {document.uploadedAt}
              </span>
            </div>
            <p className="mt-3 text-sm font-bold text-primaryText">{document.name}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-secondaryText">
              <span>Uploaded By: {document.uploadedBy}</span>
              <span className="border border-border px-2 py-1 text-groupBlue">{document.status}</span>
            </div>
          </div>
        ))}

        <p className="text-sm font-black uppercase tracking-[0.16em] text-presenceGreen">Mike is typing...</p>
      </div>
    </div>
  );
}

export default MessageList;
