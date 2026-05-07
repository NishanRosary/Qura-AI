function Topbar({ documentCount, isBusy }) {
  return (
    <div className="topbar">
      <div className="topbar-indicator">
        <div className={`status-dot ${isBusy ? "busy" : ""}`}></div>
        <span>{documentCount} documents indexed</span>
      </div>

      <div className="topbar-title">Knowledge Assistant</div>

      <div className="topbar-actions">
        <button className="icon-btn" type="button">RAG</button>
        <button className="icon-btn" type="button">DB</button>
        <button className="icon-btn" type="button">AI</button>
      </div>
    </div>
  );
}

export default Topbar;
