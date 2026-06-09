<div align="center">

<br />

```
  ██████╗ ██╗   ██╗██████╗  █████╗
 ██╔═══██╗██║   ██║██╔══██╗██╔══██╗
 ██║   ██║██║   ██║██████╔╝███████║
 ██║▄▄ ██║██║   ██║██╔══██╗██╔══██║
 ╚██████╔╝╚██████╔╝██║  ██║██║  ██║
  ╚══▀▀═╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
```

### **Knowledge Assistant — Retrieval-Augmented Generation**

*Upload your documents. Ask anything. Get grounded answers.*

<br />

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-1.0-FF6B6B?style=flat-square)](https://trychroma.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/gemini)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

<br />

</div>

---

## What is Qura?

**Qura** is a local-first, full-stack **Retrieval-Augmented Generation (RAG)** application. You give it your documents — PDFs, Word files, text files, or Markdown — and it lets you have a grounded conversation with them through a sleek chat interface powered by Google Gemini.

Unlike generic chatbots, Qura never fabricates answers. Every response is anchored to the content of your uploaded files, with source chunks surfaced alongside the answer so you can verify exactly where information came from.

```
Your Documents  ──►  Chunk & Embed  ──►  Vector Store (Chroma)
                                               │
Your Question  ──►  Embed Query  ──►  Semantic Search
                                               │
                                         Top-K Chunks
                                               │
                                    Gemini 2.5 Flash  ──►  Grounded Answer + Sources
```

---

## Features

**Core RAG Pipeline**
- Semantic retrieval via Google's `gemini-embedding-001` model (3072-dimensional vectors)
- Persistent vector storage with ChromaDB using cosine similarity (HNSW index)
- Smart text chunking with configurable size (`900` chars) and overlap (`180` chars) to preserve context
- Graceful fallback to TF-IDF–style keyword retrieval when the embedding API is unavailable
- Built-in offline embedding using a Blake2b hash projection — no API key required to run

**Document Support**
- PDF (multi-page, text layer) via `pypdf`
- DOCX (Microsoft Word) via `python-docx`
- Plain text (`.txt`) and Markdown (`.md`)
- Multi-file upload in a single request

**AI & Answering**
- Powered by **Gemini 2.5 Flash** — fast, cost-effective, and grounded in your context
- Explicit prompt engineering: the model is instructed to answer only from retrieved chunks
- Fallback extractive answering (sentence scoring) when the Gemini API is unreachable
- Source chunk attribution returned with every answer (document name + chunk index + snippet)

**Frontend**
- Polished "Quiet Luxury" dark UI — `#0B0B0F` base, soft blue accent (`#4F8EF7`), Inter typeface
- Live document sidebar showing chunk counts and upload status
- Animated chat area with user/assistant message distinction
- Scrollable conversation history panel with click-to-jump navigation
- Contextual toast notifications (info / success / warning / error) with auto-dismiss
- Responsive input bar with animated loading dots during generation

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend API | **FastAPI 0.115** | REST endpoints, async file handling, CORS |
| LLM | **Gemini 2.5 Flash** (`google-genai`) | Answer generation |
| Embeddings | **gemini-embedding-001** | Semantic vector encoding |
| Vector Store | **ChromaDB 1.0** | Persistent similarity search |
| PDF Parsing | **pypdf 5.5** | Text extraction from PDFs |
| DOCX Parsing | **python-docx 1.1** | Text extraction from Word docs |
| ASGI Server | **Uvicorn** | Production-grade async server |
| Frontend | **React 19** + Create React App | UI framework |
| Styling | Custom CSS (design tokens) | Theming and layout |
| HTTP Client | Fetch API | Frontend ↔ Backend communication |

---

## Project Structure

```
Qura AI/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app, routes, CORS setup
│   │   ├── rag_service.py   # Core RAG engine (ingest, embed, retrieve, answer)
│   │   ├── config.py        # Settings dataclass, .env loader
│   │   └── schemas.py       # Pydantic request/response models
│   ├── data/
│   │   ├── chroma/          # Persistent ChromaDB vector store
│   │   └── uploads/         # Saved document files
│   ├── .env                 # API keys and runtime configuration
│   ├── requirements.txt
│   └── service.py           # Optional process manager entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx           # Root component — state, orchestration, event handlers
        ├── api.js            # Typed fetch wrappers for all backend endpoints
        ├── index.js          # React DOM entry point
        ├── style.css         # Design token system + all component styles
        └── components/
            ├── sidebar.jsx   # Document upload, file list, chat history panel
            ├── topbar.jsx    # Status bar showing document count and busy state
            ├── chartarea.jsx # Chat message thread with source citations
            ├── inputbar.jsx  # Question input with animated send button
            └── toast.jsx     # Notification system (info / success / warning / error)
```

---

## API Reference

All endpoints are prefixed with `/api`.

### `GET /api/health`
Returns `{ "status": "ok" }`. Use for readiness checks.

### `GET /api/documents`
Returns the list of all indexed documents with chunk counts.

```json
{
  "documents": [
    {
      "id": "uuid",
      "name": "research.pdf",
      "chunks": 42,
      "character_count": 38291
    }
  ]
}
```

### `POST /api/documents/upload`
Accepts `multipart/form-data` with one or more files under the key `files`.
Supported types: `.pdf`, `.docx`, `.txt`, `.md`

```json
{
  "documents": [...],
  "indexed_count": 3
}
```

### `POST /api/query`
Accepts a JSON body with a `question` field (3–4000 characters).

```json
// Request
{ "question": "What are the key findings in section 3?" }

// Response
{
  "answer": "According to the document...",
  "sources": [
    {
      "document_id": "uuid",
      "name": "research.pdf",
      "chunk_index": 7,
      "snippet": "The key finding in section 3 is..."
    }
  ]
}
```

### `DELETE /api/documents`
Wipes the vector collection, removes all uploaded files, and resets the store.
Returns `{ "status": "cleared" }`.

---

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- A [Google AI Studio](https://aistudio.google.com/) API key *(optional — Qura runs offline without one)*

### 1. Clone the repository

```bash
git clone https://github.com/NishanRosary/qura-ai.git
cd qura-ai
```

### 2. Configure environment variables

```bash
cp "Qura AI/backend/.env.example" "Qura AI/backend/.env"
```

Edit `.env` with your settings:

```env
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
CHROMA_COLLECTION=rag-documents
CHROMA_PATH=./data/chroma
UPLOAD_DIR=./data/uploads
MAX_CHUNK_SIZE=900
CHUNK_OVERLAP=180
TOP_K_RESULTS=4
```

> **No API key?** Qura still works. It falls back to local hash-based embeddings and extractive sentence scoring for both retrieval and answering.

### 3. Run the backend

```bash
cd "Qura AI/backend"
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.
Interactive docs at `http://localhost:8000/docs`.

### 4. Run the frontend

```bash
cd "Qura AI/frontend"
npm install
npm start
```

Open `http://localhost:3000` in your browser.

---

## How It Works — In Depth

### Document Ingestion

When you upload a file and click **Process Documents**, the following pipeline runs:

1. **Text Extraction** — The file is read based on its extension:
   - `.pdf` → `pypdf` extracts the text layer page by page
   - `.docx` → `python-docx` reads each paragraph
   - `.txt` / `.md` → read directly as UTF-8

2. **Chunking** — The raw text is split into overlapping windows:
   - Each chunk is up to `MAX_CHUNK_SIZE` characters (default: 900)
   - A `CHUNK_OVERLAP` of 180 characters is preserved between adjacent chunks to prevent context loss at boundaries

3. **Embedding** — Each chunk is encoded into a dense vector:
   - With a Google API key: `gemini-embedding-001` produces 3072-dimensional semantic vectors
   - Without: a deterministic Blake2b hash projection generates a local approximation

4. **Indexing** — Chunks, embeddings, and metadata (filename, document ID, chunk index) are stored in ChromaDB's persistent HNSW index under a cosine similarity space.

### Query & Retrieval

When you ask a question:

1. The question is embedded using the same model as the documents
2. ChromaDB performs approximate nearest-neighbour search and returns the top-K most semantically similar chunks
3. Without embeddings, a term-frequency keyword scorer ranks and selects chunks
4. The retrieved chunks are assembled into a grounded context block
5. Gemini 2.5 Flash receives both the question and the context with an explicit instruction: *answer only from the provided context*
6. The answer and source metadata are returned to the frontend

---

## Configuration Reference

All values are read from `backend/.env`.

| Variable | Default | Description |
|---|---|---|
| `GOOGLE_API_KEY` | `""` | Google AI Studio key. Leave blank for offline mode. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | LLM model for answer generation |
| `EMBEDDING_MODEL` | `gemini-embedding-001` | Model for creating text embeddings |
| `CHROMA_COLLECTION` | `rag-documents` | Name of the ChromaDB collection |
| `CHROMA_PATH` | `./data/chroma` | Directory for persistent vector data |
| `UPLOAD_DIR` | `./data/uploads` | Directory for saved document files |
| `MAX_CHUNK_SIZE` | `900` | Maximum characters per text chunk |
| `CHUNK_OVERLAP` | `180` | Character overlap between consecutive chunks |
| `TOP_K_RESULTS` | `4` | Number of chunks retrieved per query |

---

## Screenshots

> *A document-grounded conversation in Qura's dark Knowledge Assistant interface.*

```
┌─────────────────────────────────────────────────────────────────────────┐
│  • Qura                         Knowledge Assistant          2 docs indexed │
│  Knowledge Assistant                                                        │
│  ─────────────────                                                          │
│  Upload                                                                     │
│  ┌───────────────────┐                                                      │
│  │  ↑ Click to upload│         ┌─────────────────────────────────────────┐ │
│  │  PDF DOCX TXT MD  │         │ You: What are the main conclusions?     │ │
│  └───────────────────┘         └─────────────────────────────────────────┘ │
│  Files                                                                      │
│  ┌──────────────────┐           ┌─────────────────────────────────────────┐│
│  │ 📄 report.pdf ●  │           │ Qura: Based on the document context,    ││
│  │    42 chunks     │           │ the main conclusions are...             ││
│  └──────────────────┘           │                                         ││
│                                 │ Sources: report.pdf (chunks 7, 12, 19)  ││
│  History                        └─────────────────────────────────────────┘│
│  ┌──────────────────┐                                                       │
│  │ What are the ... │         ┌─────────────────────────────────────────────┤
│  │ Based on the ... │         │  Ask something about your documents...    ➤ │
│  └──────────────────┘         └─────────────────────────────────────────────┤
│  [Process Documents] [Clear]                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Roadmap

- [ ] Streaming responses (Server-Sent Events)
- [ ] Multi-collection support (separate knowledge bases)
- [ ] Authentication and per-user document isolation
- [ ] Re-ranking with a cross-encoder for higher retrieval precision
- [ ] Support for `.pptx`, `.csv`, and image-heavy PDFs (OCR)
- [ ] Docker Compose setup for one-command deployment
- [ ] Export conversation as Markdown or PDF

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add streaming support"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please keep PRs focused and include a clear description of what changed and why.

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

Built by **[Nishan Rosary](https://github.com/NishanRosary)** · BCA @ St. Joseph's University, Bangalore

*If you found this useful, a ⭐ on the repo goes a long way.*

</div>
