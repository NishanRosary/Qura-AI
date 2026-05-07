from __future__ import annotations

import os
import socket
import subprocess
import sys
from pathlib import Path


def _is_port_in_use(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex((host, port)) == 0


def _venv_python_path() -> Path:
    scripts_dir = "Scripts" if os.name == "nt" else "bin"
    python_name = "python.exe" if os.name == "nt" else "python"
    return Path(__file__).resolve().parent / ".venv" / scripts_dir / python_name


def _ensure_project_python() -> None:
    if os.getenv("SERVICE_BOOTSTRAPPED") == "1":
        return

    venv_python = _venv_python_path()
    current_python = Path(sys.executable).resolve()

    if current_python == venv_python.resolve():
        return

    if not venv_python.exists():
        print(
            "Project virtual environment not found. Create it first with:\n"
            "python -m venv .venv\n"
            ".venv\\Scripts\\pip install -r requirements.txt"
        )
        raise SystemExit(1)

    env = dict(os.environ)
    env["SERVICE_BOOTSTRAPPED"] = "1"
    raise SystemExit(
        subprocess.call([str(venv_python), str(Path(__file__).resolve())], env=env)
    )


def main() -> None:
    _ensure_project_python()

    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    reload_enabled = os.getenv("RELOAD", "false").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }

    if _is_port_in_use(host, port):
        print(
            f"Backend is already running on http://{host}:{port}. "
            "Stop the existing process or change PORT before starting a new one."
        )
        return

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload_enabled,
    )


if __name__ == "__main__":
    main()
