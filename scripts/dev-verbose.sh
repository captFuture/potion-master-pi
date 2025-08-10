#!/bin/bash
set -euo pipefail

# Verbose Vite dev for Raspberry Pi debugging
cd "$(dirname "$0")/.."

# Print environment info
echo "=== Environment Info ==="
echo "Arch: $(uname -m)"
echo "Kernel: $(uname -a)"
echo "Node: $(node -v)"
node -p "process.versions" || true

# Extra diagnostics for native deps
echo "=== Native deps presence ==="
ls -la node_modules/vite/node_modules/esbuild 2>/dev/null || echo "esbuild (nested) not found"
ls -la node_modules/esbuild 2>/dev/null || echo "esbuild (hoisted) not found"
if [ -d node_modules/@swc/core ]; then ls -la node_modules/@swc/core || true; fi

# Enable very verbose logging
export NODE_OPTIONS="${NODE_OPTIONS:-} --trace-uncaught --unhandled-rejections=strict"
export DEBUG=vite:* 

# Start Vite with full debug and tee output to a log file
echo "\n=== Starting Vite in verbose mode ==="
set -x
node ./node_modules/vite/bin/vite.js --debug --logLevel debug 2>&1 | tee vite-verbose.log
