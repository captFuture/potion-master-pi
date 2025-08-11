#!/bin/bash
set -euo pipefail

echo "🔧 Starting Cocktail Machine hardware (manual mode)"
echo "==============================================="

# Project root
cd "$(dirname "$0")/.."

# Ensure permissions
bash ./scripts/fix-permissions.sh || true

# Start hardware controller
cd hardware
PORT=${PORT:-3000} npm start
