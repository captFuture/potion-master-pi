#!/bin/bash
set -euo pipefail

# Build esbuild from source for Raspberry Pi and force Vite to use it
# Requires Go toolchain. Install with: sudo apt-get update && sudo apt-get install -y golang-go

cd "$(dirname "$0")/.."

if ! command -v go >/dev/null 2>&1; then
  echo "❌ Go ist nicht installiert. Bitte ausführen: sudo apt-get update && sudo apt-get install -y golang-go"
  exit 1
fi

echo "🧹 Entferne evtl. defekte esbuild-Binaries"
rm -rf node_modules/esbuild* 2>/dev/null || true

echo "📦 Installiere Dependencies (mit Skripten aktiviert)"
unset NPM_CONFIG_IGNORE_SCRIPTS || true
export npm_config_ignore_scripts=""
export npm_config_audit=false
export npm_config_fund=false
npm install --no-optional

echo "🛠️  Baue esbuild aus dem Source"
NODE_VERBOSE=1 npm rebuild esbuild --build-from-source

# Prefer root esbuild and eliminate nested vite copy to ensure module resolution picks the hoisted one
if [ -d node_modules/vite/node_modules/esbuild ]; then
  echo "🧽 Entferne nested esbuild unter vite, damit das hoisted Binary genutzt wird"
  rm -rf node_modules/vite/node_modules/esbuild || true
fi

# Verify binary and expose path
source ./scripts/use-local-esbuild.sh

# Extra probes
bash ./scripts/probe-esbuild.sh || true

echo "✅ esbuild wurde lokal gebaut. Nutze zum Starten: bash ./scripts/start-frontend.sh"
