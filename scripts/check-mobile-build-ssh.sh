#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-192.168.1.68}"
REMOTE_USER="${REMOTE_USER:-mimsi}"
REMOTE_PASS="${REMOTE_PASS:-2026arnau}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/mimsiui}"
REMOTE_ENV_FILE="${REMOTE_ENV_FILE:-/home/${REMOTE_USER}/.config/mimsiui/mobile-build.env}"
BUILD_ID="${1:-}"

SSH_BASE=(sshpass -p "$REMOTE_PASS" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no "${REMOTE_USER}@${REMOTE_HOST}")
"${SSH_BASE[@]}" \
  "REMOTE_ROOT='$REMOTE_ROOT' REMOTE_ENV_FILE='$REMOTE_ENV_FILE' BUILD_ID='$BUILD_ID' bash -s" <<'EOF'
set -euo pipefail
cd "$REMOTE_ROOT/mobile"
if [ -f "$REMOTE_ENV_FILE" ]; then
  set -a
  . "$REMOTE_ENV_FILE"
  set +a
fi
if [ -z "${EXPO_TOKEN:-}" ]; then
  echo "Falta EXPO_TOKEN en el entorno remoto." >&2
  exit 1
fi
if [ -z "${BUILD_ID:-}" ]; then
  BUILD_ID="$(EAS_NO_VCS=1 corepack pnpm dlx eas-cli build:list --limit 1 --json | python3 -c 'import json,sys; builds=json.load(sys.stdin); print(builds[0]["id"] if builds else "")')"
fi
if [ -z "$BUILD_ID" ]; then
  echo "No hay builds registradas para este proyecto." >&2
  exit 1
fi
EAS_NO_VCS=1 corepack pnpm dlx eas-cli build:view "$BUILD_ID" --json
EOF
