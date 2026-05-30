function Toast({ toast, onClose }) {
  if (!toast) {
    return null;
  }

  return (
    <div className={`toast toast-${toast.type || "info"}`} role="status" aria-live="polite">
      <div className="toast-copy">
        <div className="toast-title">{toast.title}</div>
        <div className="toast-message">{toast.message}</div>
      </div>

      <button className="toast-close" type="button" onClick={onClose} aria-label="Close toast">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}

export default Toast;
