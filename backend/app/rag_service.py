from __future__ import annotations

import shutil
import uuid
from pathlib import Path
from typing import Iterable, List

import chromadb
from docx import Document as DocxDocument
from openai import OpenAI
from pypdf import PdfReader

from .config import Settings
from .schemas import DocumentSummary, SourceChunk

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


class RagService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.openai_client = OpenAI(api_key=settings.openai_api_key)
        self.chroma_client = chromadb.PersistentClient(path=str(settings.chroma_path))
        self.collection = self.chroma_client.get_or_create_collection(
            name=settings.chroma_collection,
            metadata={"hnsw:space": "cosine"},
        )

    def list_documents(self) -> List[DocumentSummary]:
        data = self.collection.get(include=["metadatas"])
        documents = {}

        for metadata in data.get("metadatas", []):
            if not metadata:
                continue
            document_id = metadata["document_id"]
            entry = documents.setdefault(
                document_id,
                {
                    "id": document_id,
                    "name": metadata["filename"],
                    "chunks": 0,
                    "character_count": int(metadata.get("character_count", 0)),
                },
            )
            entry["chunks"] += 1

        return [DocumentSummary(**value) for value in documents.values()]

    async def ingest_files(self, files: Iterable) -> List[DocumentSummary]:
        indexed_documents: List[DocumentSummary] = []

        for upload in files:
            suffix = Path(upload.filename).suffix.lower()
            if suffix not in SUPPORTED_EXTENSIONS:
                raise ValueError(
                    f"Unsupported file '{upload.filename}'. Supported: "
                    + ", ".join(sorted(SUPPORTED_EXTENSIONS))
                )

            document_id = str(uuid.uuid4())
            target_path = self.settings.upload_dir / f"{document_id}{suffix}"

            with target_path.open("wb") as buffer:
                shutil.copyfileobj(upload.file, buffer)

            text = self._extract_text(target_path)
            chunks = self._chunk_text(text)
            if not chunks:
                raise ValueError(f"No readable text found in '{upload.filename}'.")

            embeddings = self._embed_texts(chunks)
            ids = [f"{document_id}:{index}" for index, _ in enumerate(chunks)]
            metadatas = [
                {
                    "document_id": document_id,
                    "filename": upload.filename,
                    "chunk_index": index,
                    "character_count": len(text),
                }
                for index, _ in enumerate(chunks)
            ]

            self.collection.add(
                ids=ids,
                documents=chunks,
                embeddings=embeddings,
                metadatas=metadatas,
            )

            indexed_documents.append(
                DocumentSummary(
                    id=document_id,
                    name=upload.filename,
                    chunks=len(chunks),
                    character_count=len(text),
                )
            )

        return indexed_documents

    def query(self, question: str) -> tuple[str, List[SourceChunk]]:
        if not self.settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is missing. Add it to backend/.env.")

        query_embedding = self._embed_texts([question])[0]
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=self.settings.top_k_results,
            include=["documents", "metadatas", "distances"],
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

        if not documents:
            raise ValueError("No indexed documents found. Upload and process documents first.")

        context_parts = []
        sources: List[SourceChunk] = []

        for document_text, metadata in zip(documents, metadatas):
            if not metadata:
                continue
            context_parts.append(
                f"[{metadata['filename']} | chunk {metadata['chunk_index']}]\n{document_text}"
            )
            sources.append(
                SourceChunk(
                    document_id=metadata["document_id"],
                    name=metadata["filename"],
                    chunk_index=int(metadata["chunk_index"]),
                    snippet=document_text[:220].strip(),
                )
            )

        context = "\n\n".join(context_parts)
        prompt = (
            "Answer the user's question using only the provided document context. "
            "If the answer is not grounded in the context, say that clearly. "
            "Keep the answer concise and practical.\n\n"
            f"Question:\n{question}\n\n"
            f"Context:\n{context}"
        )

        response = self.openai_client.chat.completions.create(
            model=self.settings.openai_chat_model,
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a retrieval-augmented assistant. "
                        "Use retrieved context faithfully and do not invent citations."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        )

        answer = response.choices[0].message.content or "No answer returned."
        return answer, sources

    def clear(self) -> None:
        all_items = self.collection.get()
        ids = all_items.get("ids", [])
        if ids:
            self.collection.delete(ids=ids)

        for file_path in self.settings.upload_dir.iterdir():
            if file_path.is_file():
                file_path.unlink()

    def _embed_texts(self, values: List[str]) -> List[List[float]]:
        if not self.settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is missing. Add it to backend/.env.")

        response = self.openai_client.embeddings.create(
            model=self.settings.openai_embedding_model,
            input=values,
        )
        return [item.embedding for item in response.data]

    def _extract_text(self, path: Path) -> str:
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            reader = PdfReader(str(path))
            return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        if suffix == ".docx":
            document = DocxDocument(path)
            return "\n".join(paragraph.text for paragraph in document.paragraphs).strip()
        return path.read_text(encoding="utf-8", errors="ignore").strip()

    def _chunk_text(self, text: str) -> List[str]:
        normalized = " ".join(text.split())
        if not normalized:
            return []

        chunk_size = self.settings.max_chunk_size
        overlap = self.settings.chunk_overlap
        chunks: List[str] = []
        start = 0

        while start < len(normalized):
            end = min(len(normalized), start + chunk_size)
            chunks.append(normalized[start:end].strip())
            if end >= len(normalized):
                break
            start = max(end - overlap, start + 1)

        return chunks
