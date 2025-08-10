#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "❌ Please run as root: sudo $0"
  exit 1
fi

echo "🧹 Uninstalling systemd services"
systemctl stop cocktail-kiosk.service 2>/dev/null || true
systemctl stop cocktail-hardware.service 2>/dev/null || true
systemctl disable cocktail-kiosk.service 2>/dev/null || true
systemctl disable cocktail-hardware.service 2>/dev/null || true
rm -f /etc/systemd/system/cocktail-kiosk.service
rm -f /etc/systemd/system/cocktail-hardware.service
systemctl daemon-reload
echo "✅ Removed services"
