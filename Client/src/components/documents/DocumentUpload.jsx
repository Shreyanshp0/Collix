import { FileUp, LoaderCircle, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

function DocumentUpload({ groupId, onUploadDocuments, onAddDocuments }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!groupId) {
      toast.error('No active group selected.');
      return;
    }

    setUploading(true);
    try {
      if (onUploadDocuments) {
        await onUploadDocuments(files);
      } else if (onAddDocuments) {
        await onAddDocuments(files);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <section className="dashboard-shell noise-panel p-3 border-2 border-border bg-[#0f131b]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-border bg-background">
            <Upload className="h-4 w-4 text-groupBlue" strokeWidth={2.25} />
          </div>
          <div>
            <p className="section-label text-groupBlue">DOCUMENT STORAGE</p>
            <h2 className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-primaryText">
              Upload Group PDFs & Files
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !groupId}
          className="brutal-button flex items-center gap-2 text-xs"
        >
          <FileUp className="h-4 w-4" strokeWidth={2.25} />
          <span>{uploading ? 'Processing...' : 'Upload Files'}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {uploading && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-secondaryText">
            <span className="flex items-center gap-1.5">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin text-groupBlue" strokeWidth={2} />
              Processing selected files...
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export default DocumentUpload;
