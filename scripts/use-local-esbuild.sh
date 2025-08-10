#!/bin/bash
set -euo pipefail

# Sourceable helper to select and export a working esbuild binary for Raspberry Pi
# Usage: source ./scripts/use-local-esbuild.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Candidate paths in preference order
CANDIDATES=(
  "node_modules/esbuild/bin/esbuild" # built-from-source or hoisted
  "node_modules/esbuild-linux-arm64/bin/esbuild" # prebuilt linux arm64
)

FOUND=""
for p in "${CANDIDATES[@]}"; do
  if [ -x "$p" ]; then
    FOUND="$p"
    break
  fi
  if [ -f "$p" ]; then
    chmod +x "$p" 2>/dev/null || true
    if [ -x "$p" ]; then FOUND="$p"; break; fi
  fi
done

if [ -z "${FOUND}" ]; then
  echo "[use-local-esbuild] Kein esbuild-Binary gefunden. Bitte ausführen:"
  echo "  bash ./scripts/build-esbuild-from-source.sh"
  return 0 2>/dev/null || exit 0
fi

export ESBUILD_BINARY_PATH="$ROOT_DIR/$FOUND"

# Small self-check
if "$ESBUILD_BINARY_PATH" --version >/dev/null 2>&1; then
  echo "[use-local-esbuild] ESBUILD_BINARY_PATH gesetzt auf: $ESBUILD_BINARY_PATH"
  echo -n "[use-local-esbuild] esbuild --version: "; "$ESBUILD_BINARY_PATH" --version
else
  echo "[use-local-esbuild] Gefundenes Binary konnte nicht ausgeführt werden: $ESBUILD_BINARY_PATH"
  echo "Bitte neu bauen: bash ./scripts/build-esbuild-from-source.sh"
fi
