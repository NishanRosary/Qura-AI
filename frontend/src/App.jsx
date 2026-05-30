import { useEffect, useState } from "react";
import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";
import ChatArea from "./components/chartarea";
import InputBar from "./components/inputbar";
import Toast from "./components/toast";
import {
  clearDocuments,
  fetchDocuments,
  queryDocuments,
  uploadDocuments,
} from "./api";

function createToast(type, title, message) {
  return {
    id: `${type}-${Date.now()}`,
    type,
    title,
    message,
  };
}

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [toast, setToast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  async function loadDocuments() {
    try {
      const data = await fetchDocuments();
      setDocuments(data.documents);

      if (data.documents.length) {
        setToast(
          createToast(
            "info",
            "Knowledge Base Ready",
            `${data.documents.length} document${data.documents.length === 1 ? "" : "s"} loaded from the vector store.`
          )
        );
      }
    } catch (error) {
      setToast(
        createToast(
          "error",
          "Backend Unavailable",
          error.message || "Could not connect to the RAG backend."
        )
      );
    }
  }

  async function handleProcessDocuments() {
    if (!selectedFiles.length) {
      setToast(
        createToast(
          "warning",
          "No Files Selected",
          "Choose one or more PDF, DOCX, TXT, or MD files before indexing."
        )
      );
      return;
    }

    setIsUploading(true);
    setToast(
      createToast(
        "info",
        "Indexing Started",
        `Embedding ${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} into the vector database.`
      )
    );

    try {
      const result = await uploadDocuments(selectedFiles);
      setSelectedFiles([]);
      await loadDocuments();
      setToast(
        createToast(
          "success",
          "Documents Indexed",
          `${result.indexed_count} document${result.indexed_count === 1 ? "" : "s"} added to the knowledge base.`
        )
      );
    } catch (error) {
      setToast(
        createToast(
          "error",
          "Indexing Failed",
          error.message || "The documents could not be processed."
        )
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleClearDocuments() {
    setIsUploading(true);

    try {
      await clearDocuments();
      setDocuments([]);
      setSelectedFiles([]);
      setMessages([]);
      setToast(
        createToast(
          "success",
          "Knowledge Base Cleared",
          "All uploaded files, chat messages, and vector embeddings were removed."
        )
      );
    } catch (error) {
      setToast(
        createToast(
          "error",
          "Clear Failed",
          error.message || "The vector store could not be cleared."
        )
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleHistorySelect(messageId) {
    const messageElement = window.document.getElementById(messageId);

    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function handleSend(question) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setToast(
        createToast(
          "warning",
          "Question Required",
          "Type a question before sending it to Qura."
        )
      );
      return;
    }

    if (!documents.length) {
      setToast(
        createToast(
          "warning",
          "No Indexed Documents",
          "Upload and process documents before asking questions."
        )
      );
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setIsQuerying(true);
    setToast(
      createToast(
        "info",
        "Searching Documents",
        "Retrieving relevant chunks and preparing a grounded answer."
      )
    );

    try {
      const result = await queryDocuments(trimmedQuestion);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        },
      ]);
      setToast(
        createToast(
          "success",
          "Answer Ready",
          `Response generated using ${result.sources.length} source chunk${result.sources.length === 1 ? "" : "s"}.`
        )
      );
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: error.message,
          error: true,
          sources: [],
        },
      ]);
      setToast(
        createToast(
          "error",
          "Query Failed",
          error.message || "Qura could not answer from the current knowledge base."
        )
      );
    } finally {
      setIsQuerying(false);
    }
  }

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="shell">
        <Sidebar
          documents={documents}
          messages={messages}
          selectedFiles={selectedFiles}
          onFilesSelected={setSelectedFiles}
          onProcessDocuments={handleProcessDocuments}
          onClearDocuments={handleClearDocuments}
          onHistorySelect={handleHistorySelect}
          isProcessing={isUploading}
        />

        <main className="main">
          <Topbar documentCount={documents.length} isBusy={isQuerying || isUploading} />
          <ChatArea messages={messages} hasDocuments={documents.length > 0} />
          <InputBar
            disabled={!documents.length || isQuerying}
            isSending={isQuerying}
            onSend={handleSend}
          />
        </main>
      </div>
    </>
  );
}

export default App;
