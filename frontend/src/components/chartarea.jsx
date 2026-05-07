function ChatArea({ messages, hasDocuments }) {
  if (!messages.length) {
    return (
      <div className="chat-area">
        <div className="messages-inner">
          <div className="empty-state">
            <div className="empty-icon">RAG</div>

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
              {message.sources?.length ? (
                <div className="sources">
                  {message.sources.map((source) => (
                    <div className="source-card" key={`${source.document_id}-${source.chunk_index}`}>
                      <div className="source-title">
                        {source.name} · chunk {source.chunk_index}
                      </div>
                      <div className="source-snippet">{source.snippet}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatArea;
