#!/bin/bash
set -euo pipefail

# Force Node to resolve a single hoisted esbuild by removing nested copies under vite
cd "$(dirname "$0")/.."

TARGET="node_modules/vite/node_modules/esbuild"
if [ -d "$TARGET" ]; then
  echo "🧹 Entferne nested $TARGET, damit Node das hoisted esbuild nutzt"
  rm -rf "$TARGET"
else
  echo "ℹ️ Kein nested esbuild unter vite gefunden"
fi

echo "🔎 Verbleibende esbuild-Pfade:"
ls -la node_modules/esbuild 2>/dev/null || echo "(keins)"
ls -la node_modules/vite/node_modules/esbuild 2>/dev/null || echo "(keins unter vite)"

echo "✅ Done"
