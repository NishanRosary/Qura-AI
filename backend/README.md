# Backend

FastAPI backend for a local RAG workflow with:

- ChromaDB as the persistent vector database
- Fast vector-similarity document retrieval by default
- Optional Google AI embeddings for retrieval
- Optional Google Gemini for answer generation
- File ingestion for `pdf`, `docx`, `txt`, and `md`

## Run

1. Create a virtual environment and install dependencies:

```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env`. A Google AI API key is optional.

3. Start the API:

```bash
python service.py
```

This starts the FastAPI server on `127.0.0.1:8000` by default.

Optional environment variables:

- `HOST`
- `PORT`
- `RELOAD`
- `USE_GOOGLE_EMBEDDINGS=true` enables remote Google embeddings. This improves semantic retrieval, but uploads and questions will wait on network calls.
- `USE_GEMINI_ANSWERS=true` enables Gemini answer generation. This produces more intelligent, professional answers, but questions can take several seconds.
- Keep both flags unset or `false` for the fastest local mode. In this mode, retrieval still uses Chroma vector similarity, and answers are composed locally from the most relevant document text.

When switching from local mode to Google embeddings, use a fresh `CHROMA_COLLECTION` or clear and reprocess documents so old local vectors are not reused.

## Endpoints

- `GET /api/health`
- `GET /api/documents`
- `POST /api/documents/upload`
- `POST /api/query`
- `DELETE /api/documents`
