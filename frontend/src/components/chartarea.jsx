function ChatArea({ messages, hasDocuments }) {
  if (!messages.length) {
    return (
      <div className="chat-area">
        <div className="messages-inner">
          <div className="empty-state">
            <div className="empty-icon">QURA</div>

            <div className="empty-title">
              Ask anything about your documents
            </div>

            <div className="empty-sub">
              {hasDocuments
                ? "Your vector database is ready. Ask a question to retrieve grounded answers."
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
            className={`message-row ${message.role === "user" ? "user" : "assistant"}`}
            key={message.id}
          >
            <div className={`message-bubble ${message.error ? "error" : ""}`}>
              <div className="message-role">
                {message.role === "user" ? "You" : "Assistant"}
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
