#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
if [[ ! -x "$ROOT/.venv/bin/python" ]]; then
  echo "Missing project virtualenv. Create it and install requirements first; see README.md." >&2
  exit 1
fi
if ! command -v "${SUMO_BINARY:-sumo}" >/dev/null 2>&1; then
  echo "SUMO executable not found. Install SUMO or set SUMO_BINARY." >&2
  exit 1
fi
if [[ ! -d "$ROOT/frontend/node_modules" ]]; then
  (cd "$ROOT/frontend" && npm ci)
fi
source "$ROOT/.venv/bin/activate"
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!
cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
cd "$ROOT/frontend"
npm run dev -- --host 0.0.0.0
