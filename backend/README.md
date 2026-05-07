# Backend

FastAPI backend for a local RAG workflow with:

- ChromaDB as the persistent vector database
- OpenAI embeddings for retrieval
- OpenAI chat completion for answer generation
- File ingestion for `pdf`, `docx`, `txt`, and `md`

## Run

1. Create a virtual environment and install dependencies:

```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and add your OpenAI API key.

3. Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /api/health`
- `GET /api/documents`
- `POST /api/documents/upload`
- `POST /api/query`
- `DELETE /api/documents`
