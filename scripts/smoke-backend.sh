#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/mimsiui}"
VENV_DIR="${VENV_DIR:-$APP_ROOT/backend/.venv}"
API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8000}"

source "$VENV_DIR/bin/activate"

python -m py_compile "$APP_ROOT/backend/app/main.py"
python -m py_compile "$APP_ROOT/backend/app/security/oidc.py"

APP_ROOT="$APP_ROOT" AUTH_ENABLED=false python - <<'PY'
import os
import sys
sys.path.insert(0, os.path.join(os.environ.get("APP_ROOT", "/opt/mimsiui"), "backend"))
from app.main import app
assert app.title == "mimsiui API"
print("APP_IMPORT_OK")
PY

curl -fsS "$API_BASE_URL/health" >/dev/null
echo "SMOKE_OK"
