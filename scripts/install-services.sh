#!/usr/bin/env bash
set -euo pipefail

# Install systemd services for:
# - cocktail-hardware.service (Hardware API)
# - cocktail-kiosk.service (Chromium kiosk pointing to nginx on localhost)
#
# Usage:
#   sudo ./scripts/install-services.sh [-u USER]
# Default USER: SUDO_USER or current user

# Resolve repo root
REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
USER_NAME="${SUDO_USER:-${USER:-pi}}"

while getopts ":u:" opt; do
  case $opt in
    u) USER_NAME="$OPTARG" ;;
    *) echo "Usage: sudo $0 [-u USER]"; exit 1 ;;
  esac
done

if [ "$(id -u)" -ne 0 ]; then
  echo "❌ Please run as root: sudo $0"
  exit 1
fi

echo "🛠️  Installing systemd services (user=$USER_NAME, repo=$REPO_ROOT)"

# Prepare rendered unit files
mkdir -p /etc/systemd/system

render() {
  local template="$1"
  local target="$2"
  sed \
    -e "s#__REPO_ROOT__#${REPO_ROOT}#g" \
    -e "s#__USER__#${USER_NAME}#g" \
    "$template" | tee "$target" >/dev/null
}

# Hardware service
render "$REPO_ROOT/scripts/systemd/cocktail-hardware.service.template" \
       "/etc/systemd/system/cocktail-hardware.service"

# Kiosk service
render "$REPO_ROOT/scripts/systemd/cocktail-kiosk.service.template" \
       "/etc/systemd/system/cocktail-kiosk.service"

systemctl daemon-reload

echo "✅ Installed: cocktail-hardware.service, cocktail-kiosk.service"
echo "You can enable them on boot with:"
echo "  sudo systemctl enable cocktail-hardware.service"
echo "  sudo systemctl enable cocktail-kiosk.service"
echo "Start now:"
echo "  sudo systemctl start cocktail-hardware.service"
echo "  sudo systemctl start cocktail-kiosk.service"
