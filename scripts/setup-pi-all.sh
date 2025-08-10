#!/usr/bin/env bash
set -euo pipefail

# One-shot setup for Raspberry Pi to host the SPA via Nginx and prepare hardware + services
# Usage:
#   sudo ./scripts/setup-pi-all.sh [-u USER] [-n NGINX_ROOT] [-e]
# Defaults:
#   USER: SUDO_USER or current user or 'pi'
#   NGINX_ROOT: /var/www/potion-frontend-pi
#   -e: enable and start services (hardware + kiosk); if omitted, they are just installed

if [ "$(id -u)" -ne 0 ]; then
  echo "❌ Please run as root: sudo $0"
  exit 1
fi

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
USER_NAME="${SUDO_USER:-${USER:-pi}}"
NGINX_ROOT="/var/www/potion-frontend-pi/dist"
ENABLE_SERVICES=false

while getopts ":u:n:e" opt; do
  case $opt in
    u) USER_NAME="$OPTARG" ;;
    n) NGINX_ROOT="$OPTARG" ;;
    e) ENABLE_SERVICES=true ;;
    *) echo "Usage: sudo $0 [-u USER] [-n NGINX_ROOT] [-e]" ; exit 1 ;;
  esac
done

echo "🛠️  Setup starting (repo=$REPO_ROOT, user=$USER_NAME, webroot=$NGINX_ROOT)"

# Base packages
apt-get update -y
apt-get install -y curl git rsync

# Nginx (installed or upgraded by helper)
"$REPO_ROOT"/scripts/setup-nginx.sh "$NGINX_ROOT"

# Chromium for kiosk (package name may differ per OS release)
if ! command -v chromium-browser >/dev/null 2>&1; then
  echo "🌐 Installing Chromium browser (kiosk) ..."
  apt-get install -y chromium-browser || apt-get install -y chromium || true
fi

# Node.js 20 LTS (via NodeSource) if not already on 20.x
NODE_OK=false
if command -v node >/dev/null 2>&1; then
  if node -v | grep -qE '^v20\.'; then NODE_OK=true; fi
fi
if [ "$NODE_OK" = false ]; then
  echo "⬇️  Installing Node.js 20.x (NodeSource) ..."
  # shellcheck disable=SC1091
  . /etc/os-release || true
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# Normalize permissions in repo and ensure scripts are executable
bash "$REPO_ROOT"/scripts/fix-permissions.sh || true

# Install hardware dependencies
if [ -d "$REPO_ROOT/hardware" ]; then
  echo "🔧 Installing hardware dependencies (npm ci) ..."
  cd "$REPO_ROOT/hardware"
  sudo -u "$USER_NAME" npm ci --omit=dev || sudo -u "$USER_NAME" npm install
fi

# Install systemd services (hardware + kiosk)
"$REPO_ROOT"/scripts/install-services.sh -u "$USER_NAME"

# Optionally enable and start services now
if [ "$ENABLE_SERVICES" = true ]; then
  systemctl enable cocktail-hardware.service || true
  systemctl enable cocktail-kiosk.service || true
  systemctl start cocktail-hardware.service || true
  systemctl start cocktail-kiosk.service || true
fi

cat <<INFO
✅ Setup finished.

Next steps (from your PC):
1) Build the frontend (npm run build) and copy files to the Pi, e.g.:
   scp -r dist/* ${USER_NAME}@<pi-ip>:${NGINX_ROOT}/

2) Open: http://<pi-ip>/

Manage services:
- sudo systemctl status nginx
- sudo systemctl start|stop|restart cocktail-hardware.service
- sudo systemctl start|stop|restart cocktail-kiosk.service
INFO
