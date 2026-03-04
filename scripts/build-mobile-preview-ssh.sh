#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-192.168.1.68}"
REMOTE_USER="${REMOTE_USER:-mimsi}"
REMOTE_PASS="${REMOTE_PASS:-2026arnau}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/mimsiui}"
REMOTE_ENV_FILE="${REMOTE_ENV_FILE:-/home/${REMOTE_USER}/.config/mimsiui/mobile-build.env}"

SSH_BASE=(sshpass -p "$REMOTE_PASS" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no "${REMOTE_USER}@${REMOTE_HOST}")

echo "[mimsiui-mobile] Launch preview build on ${REMOTE_HOST}"
"${SSH_BASE[@]}" "bash -lc '
set -euo pipefail
cd \"$REMOTE_ROOT/mobile\"

if ! command -v corepack >/dev/null 2>&1; then
  echo \"corepack no está instalado. Ejecuta primero scripts/setup-mobile-build-host.sh\" >&2
  exit 1
fi

if [ -f \"$REMOTE_ENV_FILE\" ]; then
  set -a
  . \"$REMOTE_ENV_FILE\"
  set +a
fi

if [ -z \"\${EXPO_TOKEN:-}\" ]; then
  echo \"Falta EXPO_TOKEN en el entorno remoto. Exporta un token de Expo/EAS antes de lanzar la build.\" >&2
  exit 1
fi

export EAS_NO_VCS=1

corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm run android:preview --non-interactive
'"

echo "[mimsiui-mobile] BUILD SUBMITTED"
