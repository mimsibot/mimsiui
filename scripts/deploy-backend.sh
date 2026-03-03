#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/mimsiui}"
SERVICE_NAME="${SERVICE_NAME:-mimsiui-api.service}"
SYSTEMCTL_BIN="${SYSTEMCTL_BIN:-systemctl}"
PREV_HEAD=""

rollback() {
  if [[ -n "$PREV_HEAD" ]]; then
    echo "Rolling back to $PREV_HEAD"
    git -C "$APP_ROOT" reset --hard "$PREV_HEAD"
    python3 -m venv "$APP_ROOT/backend/.venv"
    source "$APP_ROOT/backend/.venv/bin/activate"
    pip install -q -r "$APP_ROOT/backend/requirements.txt"
    "$APP_ROOT/scripts/smoke-backend.sh"
    "$SYSTEMCTL_BIN" restart "$SERVICE_NAME"
  fi
}

trap 'rollback' ERR

PREV_HEAD="$(git -C "$APP_ROOT" rev-parse HEAD)"
git -C "$APP_ROOT" pull --ff-only

python3 -m venv "$APP_ROOT/backend/.venv"
source "$APP_ROOT/backend/.venv/bin/activate"
pip install -q -r "$APP_ROOT/backend/requirements.txt"

cd "$APP_ROOT/backend"
pytest -q
"$APP_ROOT/scripts/smoke-backend.sh"
"$SYSTEMCTL_BIN" restart "$SERVICE_NAME"
"$APP_ROOT/scripts/smoke-backend.sh"

echo "DEPLOY_OK"
