function AIResponse() {
  return (
    <section className="rounded-md border-2 border-aiPurple bg-surface p-5 shadow-ai">
      <div className="flex items-center justify-between gap-3">
        <p className="section-label text-aiPurple">AI Assistant</p>
        <span className="rounded-md border-2 border-aiPurple px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-aiPurple">
          RAG Grounded
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-secondaryText">
        Grounded AI responses will render in this distinct card style once retrieval and citations are
        implemented.
      </p>
      <div className="mt-5 border-t-2 border-aiPurple pt-4 text-xs uppercase tracking-[0.18em] text-secondaryText">
        Source: Not available in Phase 1
      </div>
    </section>
  );
}

export default AIResponse;
