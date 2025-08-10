#!/usr/bin/env bash
set -euo pipefail

# Build the frontend on a PC (or any non-Pi environment)
# Output: ./dist ready for static hosting (Nginx)

cd "$(dirname "$0")/.."

echo "🏗️ Building frontend (PC)"
echo "========================="

if command -v npm >/dev/null 2>&1; then
  echo "➡️  Installing deps (npm ci || npm install)"
  npm ci || npm install
else
  echo "❌ npm not found. Please install Node.js 20.x LTS and npm."
  exit 1
fi

echo "➡️  Running production build"
npm run build

if [ -d dist ]; then
  echo "✅ Build complete. Folder: $(pwd)/dist"
  echo "   Next: ./scripts/deploy-frontend-to-pi.sh <pi-host> [pi-user] [web-root]"
else
  echo "❌ Build failed: dist folder not found"
  exit 1
fi
