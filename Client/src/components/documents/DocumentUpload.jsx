import { Upload } from 'lucide-react';

function DocumentUpload({ onAddDocuments }) {
  return (
    <section className="dashboard-shell noise-panel p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-border bg-background">
          <Upload className="h-4 w-4 text-groupBlue" strokeWidth={2.25} />
        </div>
        <div>
          <p className="section-label text-groupBlue">Documents</p>
          <h2 className="mt-2 text-base font-black uppercase tracking-[0.12em] text-primaryText">
            Composer Attachment Flow
          </h2>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-secondaryText">
        PDF uploads now belong in the chat composer attachment button so messaging keeps the primary focus.
      </p>
      <button type="button" className="brutal-button mt-4 w-full" onClick={() => onAddDocuments?.([])}>
        Use Paperclip In Composer
      </button>
    </section>
  );
}

export default DocumentUpload;
