import { FileUp, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import documentsApi from '../../api/documents.api.js';

function DocumentUpload({ groupId, onAddDocuments }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!groupId) {
      toast.error('No active group selected.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploadedDocs = await documentsApi.upload({
        groupId,
        files,
        onProgress: (percent) => setProgress(percent),
      });

      const docsList = Array.isArray(uploadedDocs) ? uploadedDocs : [];
      toast.success(`Successfully uploaded ${files.length} document${files.length > 1 ? 's' : ''}!`);
      onAddDocuments?.(docsList);
    } catch (error) {
      console.error('Document upload failed:', error);
      const message = error.response?.data?.message || error.message || 'Failed to upload document';
      toast.error(message);
    } finally {
      setUploading(false);
      setProgress(0);
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
          <span>{uploading ? `Uploading... ${progress}%` : 'Upload Files'}</span>
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
            <span>Uploading documents to cloud storage...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-sm border border-border bg-background">
            <div
              className="h-full bg-groupBlue transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default DocumentUpload;
