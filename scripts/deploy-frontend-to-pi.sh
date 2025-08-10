#!/usr/bin/env bash
set -euo pipefail

# Deploy built ./dist to a Raspberry Pi and serve via Nginx
# Usage:
#   ./scripts/deploy-frontend-to-pi.sh <PI_HOST> [PI_USER] [WEB_ROOT]
# Defaults:
#   PI_USER=${PI_USER:-pi}
#   WEB_ROOT=${WEB_ROOT:-/opt/cocktail-machine/frontend}
#
# Requires: an existing ./dist from `npm run build`

PI_HOST=${1:-${PI_HOST:-}}
PI_USER=${2:-${PI_USER:-pi}}
WEB_ROOT=${3:-${WEB_ROOT:-/opt/cocktail-machine/frontend}}

if [ -z "$PI_HOST" ]; then
  echo "Usage: $0 <PI_HOST> [PI_USER] [WEB_ROOT]"
  exit 1
fi

cd "$(dirname "$0")/.."

if [ ! -d dist ]; then
  echo "❌ ./dist not found. Run ./scripts/build-frontend-pc.sh first."
  exit 1
fi

TMP_REMOTE="/tmp/cocktail-frontend-$$"

echo "🚀 Deploying to ${PI_USER}@${PI_HOST}:${WEB_ROOT}"

# Create temp dir on remote
ssh "${PI_USER}@${PI_HOST}" "mkdir -p ${TMP_REMOTE}"

# Copy files
scp -r dist/* "${PI_USER}@${PI_HOST}:${TMP_REMOTE}/"

# Remote install: Nginx + move to WEB_ROOT + configure site
ssh -t "${PI_USER}@${PI_HOST}" bash -lc "'"'
set -euo pipefail
WEB_ROOT="'"${WEB_ROOT}"'"
TMP_REMOTE="'"${TMP_REMOTE}"'"

# Install nginx if missing
if ! command -v nginx >/dev/null 2>&1; then
  echo "📦 Installing nginx..."
  sudo apt-get update -y
  sudo apt-get install -y nginx
fi

# Create target dir and move files
sudo mkdir -p "$WEB_ROOT"
sudo rm -rf "$WEB_ROOT"/*
sudo mv "${TMP_REMOTE}"/* "$WEB_ROOT"/
sudo rmdir "${TMP_REMOTE}" || true

# Nginx site config
SITE_PATH="/etc/nginx/sites-available/cocktail-frontend"
if [ ! -f "$SITE_PATH" ]; then
  echo "📝 Writing nginx site config to $SITE_PATH"
  sudo tee "$SITE_PATH" > /dev/null <<CONF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root $WEB_ROOT;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        try_files $uri =404;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss image/svg+xml;
}
CONF
  
  # Enable site
  sudo ln -sf "$SITE_PATH" /etc/nginx/sites-enabled/cocktail-frontend
  # Disable default if present
  if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm -f /etc/nginx/sites-enabled/default
  fi
fi

# Test and reload nginx
sudo nginx -t
sudo systemctl restart nginx

# Show status
echo "✅ Frontend deployed to $WEB_ROOT and served via Nginx"
'"'"

# Quick check from your machine (optional)
echo "🔎 Try: curl -I http://${PI_HOST}/"
