#!/bin/bash
set -euo pipefail

echo "💻 Starting Frontend (Vite dev server)"
echo "======================================"

# Project root
cd "$(dirname "$0")/.."

# Ensure permissions
bash ./scripts/fix-permissions.sh || true

# Use locally built esbuild and start Vite directly
# shellcheck disable=SC1091
source ./scripts/use-local-esbuild.sh || true

# Start frontend dev server (defaults to port 8080)
node ./node_modules/vite/bin/vite.js --host :: --port 8080
