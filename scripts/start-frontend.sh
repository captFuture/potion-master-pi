#!/bin/bash
set -euo pipefail

echo "💻 Starting Frontend (Vite dev server)"
echo "======================================"

# Project root
cd "$(dirname "$0")/.."

# Ensure permissions
bash ./scripts/fix-permissions.sh || true

# Start frontend dev server (defaults to port 8080)
npm run dev
