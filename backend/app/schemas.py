from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class DocumentSummary(BaseModel):
    id: str
    name: str
    chunks: int
    character_count: int


class SourceChunk(BaseModel):
    document_id: str
    name: str
    chunk_index: int
    snippet: str


class QueryRequest(BaseModel):
    question: str = Field(min_length=3, max_length=4000)


class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]


class UploadResponse(BaseModel):
    documents: List[DocumentSummary]
    indexed_count: int


class DocumentListResponse(BaseModel):
    documents: List[DocumentSummary]
