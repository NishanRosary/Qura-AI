function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function ChatArea({ messages, hasDocuments }) {
  if (!messages.length) {
    return (
      <div className="chat-area">
        <div className="messages-inner">
          <div className="empty-state">
            <div className="empty-icon">
              <SparkleIcon />
            </div>

            <div className="empty-title">
              Ask anything about your documents
            </div>

            <div className="empty-sub">
              {hasDocuments
                ? "Your knowledge base is ready. Ask a question to get grounded, sourced answers."
                : "Upload documents, process them, and start querying your knowledge base."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="messages-inner">
        {messages.map((message) => (
          <div
            id={message.id}
            className={`message-row ${message.role === "user" ? "user" : "assistant"}`}
            key={message.id}
          >
            <div className={`message-bubble ${message.error ? "error" : ""}`}>
              <div className="message-role">
                {message.role === "user" ? "You" : "Qura"}
              </div>
              <div className="message-text">{message.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatArea;
