#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/mimsiui}"
CHANNEL="${CHANNEL:-production}"
MESSAGE="${1:-mimsiui OTA update}"

cd "$APP_ROOT/mobile"
npx eas-cli update --branch "$CHANNEL" --message "$MESSAGE"
