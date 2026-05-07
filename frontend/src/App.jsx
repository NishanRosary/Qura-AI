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

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [toast, setToast] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  async function loadDocuments() {
    try {
      const data = await fetchDocuments();
      setDocuments(data.documents);
    } catch (error) {
      setToast(error.message);
    }
  }

  async function handleProcessDocuments() {
    if (!selectedFiles.length) {
      setToast("Choose one or more documents first.");
      return;
    }

    setIsUploading(true);
    setToast("Processing documents...");

    try {
      await uploadDocuments(selectedFiles);
      setSelectedFiles([]);
      await loadDocuments();
      setToast("Documents indexed successfully.");
    } catch (error) {
      setToast(error.message);
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
      setToast("Vector store cleared.");
    } catch (error) {
      setToast(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSend(question) {
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };

    setMessages((current) => [...current, userMessage]);
    setIsQuerying(true);

    try {
      const result = await queryDocuments(question);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        },
      ]);
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
    } finally {
      setIsQuerying(false);
    }
  }

  return (
    <>
      {toast ? <Toast message={toast} /> : null}

      <div className="shell">
        <Sidebar
          documents={documents}
          selectedFiles={selectedFiles}
          onFilesSelected={setSelectedFiles}
          onProcessDocuments={handleProcessDocuments}
          onClearDocuments={handleClearDocuments}
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
