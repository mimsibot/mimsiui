#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-192.168.1.68}"
REMOTE_USER="${REMOTE_USER:-mimsi}"
REMOTE_PASS="${REMOTE_PASS:-2026arnau}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/mimsiui}"
TAILSCALE_HOSTNAME="${TAILSCALE_HOSTNAME:-mimsibot.tail8ded01.ts.net}"
TAILNET_URL="http://${TAILSCALE_HOSTNAME}:8000"
FUNNEL_URL="https://${TAILSCALE_HOSTNAME}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH_BASE=(sshpass -p "$REMOTE_PASS" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no "${REMOTE_USER}@${REMOTE_HOST}")
RSYNC_SSH="sshpass -p '$REMOTE_PASS' ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no"

echo "[mimsiui-deploy] Sync -> ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ROOT}"
rsync -av --delete \
  --exclude '.git' \
  --exclude 'backend/.venv' \
  --exclude 'backend/.pytest_cache' \
  --exclude 'mobile/node_modules' \
  --exclude 'mobile/.expo' \
  --exclude 'mobile/dist' \
  -e "$RSYNC_SSH" \
  "$ROOT_DIR/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ROOT}/"

echo "[mimsiui-deploy] Install service + backend deps"
"${SSH_BASE[@]}" "bash -lc '
set -euo pipefail
cd \"$REMOTE_ROOT/backend\"
python3 -m venv .venv
. .venv/bin/activate
pip install -q -r requirements.txt
pytest -q
sudo install -D -m 0644 \"$REMOTE_ROOT/deploy/systemd/mimsiui-api.service\" /etc/systemd/system/mimsiui-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now mimsiui-api.service
sleep 2
systemctl is-active mimsiui-api.service
curl -fsS http://127.0.0.1:8000/health
'"

echo "[mimsiui-deploy] Configure Funnel"
"${SSH_BASE[@]}" "bash -lc '
set -euo pipefail
if timeout 10 sudo tailscale funnel --bg 8000; then
  tailscale funnel status
  curl -fsS \"$FUNNEL_URL/health\"
  echo \"[mimsiui-deploy] Public URL: $FUNNEL_URL\"
  exit 0
fi

echo \"[mimsiui-deploy] Funnel no disponible en esta tailnet; pruebo acceso tailnet-only\" >&2
if timeout 10 sudo tailscale serve --bg 8000; then
  tailscale serve status
else
  echo \"[mimsiui-deploy] Serve tampoco está habilitado; continúo con acceso directo al puerto 8000 por Tailscale\" >&2
fi

tailscale ip -4
curl -fsS http://127.0.0.1:8000/health >/dev/null
echo \"[mimsiui-deploy] Tailnet URL: $TAILNET_URL\"
echo \"[mimsiui-deploy] Para Funnel público, habilita Funnel/Serve en https://login.tailscale.com/admin/machines y relanza este script.\"
'"

echo "[mimsiui-deploy] DONE"
