from __future__ import annotations

import re
import shutil
import uuid
from hashlib import blake2b
from math import sqrt
from pathlib import Path
from typing import Iterable, List

import chromadb
from docx import Document as DocxDocument
from google import genai
from pypdf import PdfReader

from .config import Settings
from .schemas import DocumentSummary, SourceChunk

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}
EMBEDDING_BATCH_SIZE = 100
LOCAL_EMBEDDING_DIMENSIONS = 3072


class RagService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.google_client = (
            genai.Client(api_key=settings.google_api_key)
            if settings.google_api_key
            else None
        )
        self.chroma_client = chromadb.PersistentClient(path=str(settings.chroma_path))
        self.collection = self._create_collection()

    def _create_collection(self):
        return self.chroma_client.get_or_create_collection(
            name=self.settings.chroma_collection,
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
        documents, metadatas = self._retrieve_context(question)

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

        answer = self._extractive_answer(question, documents)
        if self.google_client:
            try:
                response = self.google_client.models.generate_content(
                    model=self.settings.gemini_model,
                    contents=(
                        "You are a retrieval-augmented assistant. "
                        "Use retrieved context faithfully and do not invent citations.\n\n"
                        f"{prompt}"
                    ),
                )
                answer = response.text or answer
            except Exception:
                pass

        return answer, sources

    def _retrieve_context(self, question: str) -> tuple[List[str], List[dict]]:
        if self.settings.google_api_key:
            try:
                query_embedding = self._embed_texts([question])[0]
                results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=self.settings.top_k_results,
                    include=["documents", "metadatas", "distances"],
                )
                return (
                    results.get("documents", [[]])[0],
                    results.get("metadatas", [[]])[0],
                )
            except Exception:
                pass

        return self._keyword_retrieve(question)

    def _keyword_retrieve(self, question: str) -> tuple[List[str], List[dict]]:
        data = self.collection.get(include=["documents", "metadatas"])
        all_documents = data.get("documents", [])
        all_metadatas = data.get("metadatas", [])
        query_terms = self._tokenize(question)

        scored_chunks = []
        for index, (document_text, metadata) in enumerate(zip(all_documents, all_metadatas)):
            if not document_text or not metadata:
                continue

            document_terms = self._tokenize(document_text)
            score = sum(document_terms.count(term) for term in query_terms)
            if score == 0:
                score = 1 if any(term in document_text.lower() for term in query_terms) else 0

            scored_chunks.append((score, -index, document_text, metadata))

        scored_chunks.sort(reverse=True)
        selected = [
            (document_text, metadata)
            for score, _, document_text, metadata in scored_chunks
            if score > 0
        ][: self.settings.top_k_results]

        if not selected:
            selected = [
                (document_text, metadata)
                for document_text, metadata in zip(all_documents, all_metadatas)
                if document_text and metadata
            ][: self.settings.top_k_results]

        return [item[0] for item in selected], [item[1] for item in selected]

    def _extractive_answer(self, question: str, documents: List[str]) -> str:
        query_terms = set(self._tokenize(question))
        sentences = []

        for document_text in documents:
            for sentence in re.split(r"(?<=[.!?])\s+", document_text):
                cleaned = sentence.strip()
                if not cleaned:
                    continue
                score = sum(1 for term in self._tokenize(cleaned) if term in query_terms)
                sentences.append((score, cleaned))

        sentences.sort(reverse=True)
        selected = [sentence for score, sentence in sentences if score > 0][:3]
        if not selected:
            selected = [document.strip() for document in documents if document.strip()][:1]

        if not selected:
            return "I could not find relevant text in the processed documents."

        return "Based on the processed document context:\n\n" + "\n\n".join(selected)

    def _tokenize(self, value: str) -> List[str]:
        stop_words = {
            "a",
            "an",
            "and",
            "are",
            "as",
            "at",
            "be",
            "by",
            "for",
            "from",
            "in",
            "is",
            "it",
            "of",
            "on",
            "or",
            "that",
            "the",
            "to",
            "what",
            "when",
            "where",
            "which",
            "who",
            "why",
            "with",
        }
        return [
            token
            for token in re.findall(r"[a-z0-9]+", value.lower())
            if len(token) > 2 and token not in stop_words
        ]

    def clear(self) -> None:
        try:
            self.chroma_client.delete_collection(name=self.settings.chroma_collection)
        except Exception:
            # If the collection does not exist or Chroma returns a benign cleanup error,
            # we still want the reset flow to continue.
            pass

        self.collection = self._create_collection()

        if self.settings.upload_dir.exists():
            shutil.rmtree(self.settings.upload_dir, ignore_errors=True)

        self.settings.upload_dir.mkdir(parents=True, exist_ok=True)

    def _embed_texts(self, values: List[str]) -> List[List[float]]:
        if not self.settings.google_api_key:
            return self._local_embed_texts(values)

        embeddings = []
        if not self.google_client:
            self.google_client = genai.Client(api_key=self.settings.google_api_key)

        try:
            for start in range(0, len(values), EMBEDDING_BATCH_SIZE):
                batch = values[start : start + EMBEDDING_BATCH_SIZE]
                response = self.google_client.models.embed_content(
                    model=self.settings.embedding_model,
                    contents=batch,
                )

                for item in response.embeddings:
                    if getattr(item, "values", None) is not None:
                        embeddings.append(item.values)
                        continue

                    embedding = getattr(item, "embedding", None)
                    if embedding is not None and getattr(embedding, "values", None) is not None:
                        embeddings.append(embedding.values)
                        continue

                    if isinstance(item, dict):
                        if "values" in item:
                            embeddings.append(item["values"])
                            continue
                        nested = item.get("embedding", {})
                        if isinstance(nested, dict) and "values" in nested:
                            embeddings.append(nested["values"])
                            continue

                    raise ValueError("Unexpected embedding response from Google AI.")
        except Exception:
            return self._local_embed_texts(values)

        return embeddings

    def _local_embed_texts(self, values: List[str]) -> List[List[float]]:
        embeddings: List[List[float]] = []

        for value in values:
            vector = [0.0] * LOCAL_EMBEDDING_DIMENSIONS
            tokens = self._tokenize(value)

            for token in tokens:
                digest = blake2b(token.encode("utf-8"), digest_size=8).digest()
                bucket = int.from_bytes(digest[:4], "big") % LOCAL_EMBEDDING_DIMENSIONS
                sign = 1.0 if digest[4] % 2 == 0 else -1.0
                vector[bucket] += sign

            magnitude = sqrt(sum(component * component for component in vector))
            if magnitude:
                vector = [component / magnitude for component in vector]

            embeddings.append(vector)

        return embeddings

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
