from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    google_api_key: str
    gemini_model: str
    embedding_model: str
    chroma_collection: str
    chroma_path: Path
    upload_dir: Path
    max_chunk_size: int
    chunk_overlap: int
    top_k_results: int


def _load_env_file() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def get_settings() -> Settings:
    _load_env_file()

    backend_dir = Path(__file__).resolve().parents[1]
    chroma_path = Path(os.getenv("CHROMA_PATH", backend_dir / "data" / "chroma")).resolve()
    upload_dir = Path(os.getenv("UPLOAD_DIR", backend_dir / "data" / "uploads")).resolve()

    chroma_path.mkdir(parents=True, exist_ok=True)
    upload_dir.mkdir(parents=True, exist_ok=True)

    return Settings(
        google_api_key=os.getenv("GOOGLE_API_KEY", ""),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        embedding_model=os.getenv("EMBEDDING_MODEL", "gemini-embedding-001"),
        chroma_collection=os.getenv("CHROMA_COLLECTION", "rag-documents"),
        chroma_path=chroma_path,
        upload_dir=upload_dir,
        max_chunk_size=int(os.getenv("MAX_CHUNK_SIZE", "900")),
        chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "180")),
        top_k_results=int(os.getenv("TOP_K_RESULTS", "4")),
    )
