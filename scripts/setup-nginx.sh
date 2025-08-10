#!/usr/bin/env bash
set -euo pipefail

# Setup and enable Nginx to serve the static frontend on Raspberry Pi
# Usage:
#   sudo ./scripts/setup-nginx.sh [/var/www/potion-frontend-pi]
# Default doc root: /var/www/potion-frontend-pi

WEB_ROOT=${1:-/var/www/potion-frontend-pi/dist}
SITE_NAME="potion-frontend"
SITE_PATH="/etc/nginx/sites-available/${SITE_NAME}"
ENABLED_LINK="/etc/nginx/sites-enabled/${SITE_NAME}"

DOC_USER="${SUDO_USER:-${USER:-pi}}"

echo "📦 Installing nginx if missing..."
apt-get update -y
apt-get install -y nginx

echo "📁 Creating doc root: ${WEB_ROOT}"
mkdir -p "$WEB_ROOT"
# Set ownership to the invoking user (usually 'pi') so deploying via scp is easy
chown -R "$DOC_USER":"$DOC_USER" "$WEB_ROOT" 2>/dev/null || true
chmod -R 755 "$WEB_ROOT"

echo "📝 Writing nginx site config to ${SITE_PATH}"
cat > "$SITE_PATH" <<CONF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root ${WEB_ROOT};
    index index.html;

    # SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        try_files \$uri =404;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss image/svg+xml;
}
CONF

echo "🔗 Enabling site and disabling default..."
ln -sf "$SITE_PATH" "$ENABLED_LINK"
if [ -f /etc/nginx/sites-enabled/default ]; then
  rm -f /etc/nginx/sites-enabled/default
fi

echo "🧪 Testing nginx config..."
nginx -t

echo "⚙️ Enabling nginx to start on boot and restarting..."
systemctl enable nginx
systemctl restart nginx

echo "✅ Nginx is set up and serving from ${WEB_ROOT}"
echo "   Open: http://<pi-ip>/"
