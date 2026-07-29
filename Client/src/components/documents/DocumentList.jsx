import { FileText } from 'lucide-react';

function DocumentList({ documents }) {
  return (
    <div className="space-y-3">
      {documents.length === 0 ? (
        <div className="flex items-center gap-3 border-2 border-border bg-[#0f131b] px-4 py-4 text-sm leading-6 text-secondaryText">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-border bg-background">
            <FileText className="h-4 w-4 text-groupBlue" strokeWidth={2.25} />
          </div>
          <p>No PDFs uploaded yet. Add a document from the composer attachment button.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between gap-3 border-2 border-border bg-[#0f131b] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase tracking-[0.08em] text-primaryText">
                  {document.name}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-secondaryText">
                  {document.uploadedBy} • {document.uploadedAt}
                </p>
              </div>
              <span className="border border-border px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-groupBlue">
                {document.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentList;
