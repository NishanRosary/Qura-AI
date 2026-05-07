from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .rag_service import RagService
from .schemas import DocumentListResponse, QueryRequest, QueryResponse, UploadResponse

settings = get_settings()
rag_service = RagService(settings)

app = FastAPI(title="RAG Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.get("/api/documents", response_model=DocumentListResponse)
def list_documents() -> DocumentListResponse:
    return DocumentListResponse(documents=rag_service.list_documents())


@app.post("/api/documents/upload", response_model=UploadResponse)
async def upload_documents(files: list[UploadFile] = File(...)) -> UploadResponse:
    try:
        documents = await rag_service.ingest_files(files)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return UploadResponse(documents=documents, indexed_count=len(documents))


@app.post("/api/query", response_model=QueryResponse)
def query_documents(request: QueryRequest) -> QueryResponse:
    try:
        answer, sources = rag_service.query(request.question)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return QueryResponse(answer=answer, sources=sources)


@app.delete("/api/documents")
def clear_documents() -> dict:
    rag_service.clear()
    return {"status": "cleared"}
