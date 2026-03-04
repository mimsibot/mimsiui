#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-192.168.1.68}"
REMOTE_USER="${REMOTE_USER:-mimsi}"
REMOTE_PASS="${REMOTE_PASS:-2026arnau}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/mimsiui}"
NODE_MAJOR="${NODE_MAJOR:-20}"
NODE_VERSION="${NODE_VERSION:-}"
PNPM_VERSION="${PNPM_VERSION:-10.6.5}"

SSH_BASE=(sshpass -p "$REMOTE_PASS" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no "${REMOTE_USER}@${REMOTE_HOST}")

echo "[mimsiui-mobile] Bootstrap Node ${NODE_MAJOR} + pnpm ${PNPM_VERSION} on ${REMOTE_HOST}"
"${SSH_BASE[@]}" "bash -lc '
set -euo pipefail

install_node_from_tarball() {
  local node_version=\"${NODE_VERSION}\"
  local tarball_url
  local node_dir

  if [ -z \"\$node_version\" ]; then
    tarball_url=\$(curl -fsSL \"https://nodejs.org/dist/latest-v${NODE_MAJOR}.x/SHASUMS256.txt\" | awk \"/linux-x64.tar.xz/ {print \\\"https://nodejs.org/dist/latest-v${NODE_MAJOR}.x/\\\" \\\$2; exit}\")
  else
    tarball_url=\"https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz\"
  fi

  if [ -z \"\$tarball_url\" ]; then
    echo \"No he podido resolver un tarball oficial de Node ${NODE_MAJOR}.x\" >&2
    exit 1
  fi

  node_dir=\$(basename \"\$tarball_url\" .tar.xz)
  curl -fsSL \"\$tarball_url\" -o /tmp/node-linux-x64.tar.xz
  sudo mkdir -p /opt/nodejs
  sudo rm -rf \"/opt/nodejs/\$node_dir\"
  sudo tar -xJf /tmp/node-linux-x64.tar.xz -C /opt/nodejs
  sudo ln -sfn \"/opt/nodejs/\$node_dir/bin/node\" /usr/local/bin/node
  sudo ln -sfn \"/opt/nodejs/\$node_dir/bin/npm\" /usr/local/bin/npm
  sudo ln -sfn \"/opt/nodejs/\$node_dir/bin/npx\" /usr/local/bin/npx
  sudo ln -sfn \"/opt/nodejs/\$node_dir/bin/corepack\" /usr/local/bin/corepack
}

if ! command -v node >/dev/null 2>&1; then
  install_node_from_tarball
elif [ \"\$(node -p \"process.versions.node.split(\\\".\\\")[0]\")\" != \"${NODE_MAJOR}\" ]; then
  install_node_from_tarball
fi

sudo rm -f /usr/local/bin/pnpm
sudo corepack enable
sudo corepack prepare pnpm@${PNPM_VERSION} --activate
sudo ln -sfn /usr/local/bin/corepack /usr/local/bin/pnpm

cd \"$REMOTE_ROOT/mobile\"
corepack pnpm import
corepack pnpm install --frozen-lockfile

echo \"node: \$(node --version)\"
echo \"pnpm: \$(corepack pnpm --version)\"
'"

echo "[mimsiui-mobile] DONE"
