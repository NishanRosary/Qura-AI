function formatFileSize(bytes) {
  if (!bytes) {
    return "Queued";
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Sidebar({
  documents,
  selectedFiles,
  onFilesSelected,
  onProcessDocuments,
  onClearDocuments,
  isProcessing,
}) {
  const filesToDisplay = selectedFiles.length
    ? selectedFiles.map((file, index) => ({
        id: `pending-${index}`,
        name: file.name,
        sizeLabel: formatFileSize(file.size),
        ready: false,
      }))
    : documents.map((document) => ({
        id: document.id,
        name: document.name,
        sizeLabel: `${document.chunks} chunks`,
        ready: true,
      }));

  function handleChange(event) {
    onFilesSelected(Array.from(event.target.files || []));
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-name">
          <div className="brand-dot"></div>
          Knowledge Assistant
        </div>
        <div className="brand-sub">AI-powered document chat</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div className="section-label">Upload</div>

        <label className="upload-zone" htmlFor="file-input">
          <div className="upload-icon">Upload</div>

          <div className="upload-text">
            <strong>Click to upload</strong> or drag & drop<br />
            PDF, DOCX, TXT supported
          </div>

          <input
            type="file"
            id="file-input"
            multiple
            accept=".pdf,.docx,.txt,.md"
            style={{ display: "none" }}
            onChange={handleChange}
          />
        </label>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          flex: 1,
          minHeight: 0,
        }}
      >
        <div className="section-label">Files</div>

        <div className="files-section">
          {filesToDisplay.length ? (
            filesToDisplay.map((file) => (
              <div className="file-card" key={file.id}>
                <div className="file-icon">DOC</div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{file.sizeLabel}</div>
                </div>
                <div className={`file-status ${file.ready ? "ready" : "pending"}`}></div>
              </div>
            ))
          ) : (
            <div className="file-empty">No documents uploaded yet.</div>
          )}
        </div>
      </div>

      <div className="sidebar-actions">
        <button
          className="btn-primary"
          onClick={onProcessDocuments}
          disabled={isProcessing || !selectedFiles.length}
        >
          {isProcessing ? "Processing..." : "Process Documents"}
        </button>
        <button
          className="btn-ghost"
          onClick={onClearDocuments}
          disabled={isProcessing || (!documents.length && !selectedFiles.length)}
        >
          Clear All
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
