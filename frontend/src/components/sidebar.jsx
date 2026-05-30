function formatFileSize(bytes) {
  if (!bytes) {
    return "Queued";
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* Lucide-style SVG icons */
function UploadCloudIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 13H8" />
      <path d="M16 17H8" />
      <path d="M16 13h-2" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function Sidebar({
  documents,
  messages,
  selectedFiles,
  onFilesSelected,
  onProcessDocuments,
  onClearDocuments,
  onHistorySelect,
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

  const historyItems = messages
    .reduce((items, message, index) => {
      if (message.role !== "user") {
        return items;
      }

      const response = messages
        .slice(index + 1)
        .find((nextMessage) => nextMessage.role === "assistant");

      return [
        ...items,
        {
          id: message.id,
          question: message.content,
          answer: response?.content || "Waiting for Qura response...",
        },
      ];
    }, [])
    .reverse();

  function handleChange(event) {
    onFilesSelected(Array.from(event.target.files || []));
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-name">
          <div className="brand-dot"></div>
          Qura
        </div>
        <div className="brand-sub">Knowledge Assistant</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div className="section-label">Upload</div>

        <label className="upload-zone" htmlFor="file-input">
          <div className="upload-icon">
            <UploadCloudIcon />
          </div>

          <div className="upload-text">
            <strong>Click to upload</strong> or drag & drop<br />
            PDF, DOCX, TXT, MD
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
        <div className="section-label">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <FileTextIcon /> Files
          </span>
        </div>

        <div className="files-section">
          {filesToDisplay.length ? (
            filesToDisplay.map((file) => (
              <div className="file-card" key={file.id}>
                <div className="file-icon">
                  <FileTextIcon />
                </div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{file.sizeLabel}</div>
                </div>
                <div className={`file-status ${file.ready ? "ready" : "pending"}`}></div>
              </div>
            ))
          ) : (
            <div className="file-empty">No documents uploaded yet</div>
          )}
        </div>
      </div>

      <div className="history-panel">
        <div className="section-label">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <MessageIcon /> History
          </span>
        </div>

        <div className="history-list">
          {historyItems.length ? (
            historyItems.map((item) => (
              <button
                className="history-card"
                key={item.id}
                type="button"
                onClick={() => onHistorySelect(item.id)}
              >
                <span className="history-question">{item.question}</span>
                <span className="history-answer">{item.answer}</span>
              </button>
            ))
          ) : (
            <div className="history-empty">Chat history will appear here</div>
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
