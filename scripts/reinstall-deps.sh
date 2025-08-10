#!/bin/bash
set -euo pipefail

# Clean reinstall with scripts enabled and best-effort fixes for Raspberry Pi
cd "$(dirname "$0")/.."

echo "🧹 Cleaning node_modules and lockfile"
rm -rf node_modules package-lock.json || true

# Ensure npm runs postinstall scripts (needed for esbuild to fetch correct binary)
unset NPM_CONFIG_IGNORE_SCRIPTS || true
export npm_config_ignore_scripts="" # for some environments

# Speed up a bit but keep correctness
export npm_config_audit=false
export npm_config_fund=false

# Prefer arm64 builds
export npm_config_arch=arm64
export npm_config_platform=linux

# Install deps
echo "📦 Installing dependencies (this may take a while)"
npm install --no-optional

# Deduplicate to avoid nested esbuild under vite
echo "🧽 Running npm dedupe"
npm dedupe || true

# Ensure Vite resolves to the hoisted esbuild (remove nested copy if present)
if [ -d node_modules/vite/node_modules/esbuild ]; then
  echo "🧹 Removing nested esbuild under vite"
  rm -rf node_modules/vite/node_modules/esbuild || true
fi

# Show which esbuild is used
echo "🔎 esbuild locations"
ls -la node_modules/esbuild/bin 2>/dev/null || true
ls -la node_modules/vite/node_modules/esbuild/bin 2>/dev/null || true

# Try to rebuild esbuild from source if binary is problematic
if command -v go >/dev/null 2>&1; then
  echo "🔧 Rebuilding esbuild from source (Go detected)"
  npm rebuild esbuild --build-from-source || true
else
  echo "ℹ️ Go not found; skipping esbuild source rebuild. To install: sudo apt-get update && sudo apt-get install -y golang-go"
fi

# Final diagnostics
bash ./scripts/probe-esbuild.sh || true

echo "✅ Reinstall complete. Try: npm run dev"
