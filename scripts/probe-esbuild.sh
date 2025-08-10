#!/bin/bash
set -euo pipefail

# Probe esbuild and vite loading in Node to pinpoint SIGILL sources
cd "$(dirname "$0")/.."

run_node() {
  local desc="$1"; shift
  echo -e "\n=== ${desc} ==="
  node -e "$*" || echo "[FAIL] ${desc}"
}

# Show which esbuilds exist and their file types
echo "=== esbuild binaries (file) ==="
for p in \
  node_modules/esbuild/bin/esbuild \
  node_modules/vite/node_modules/esbuild/bin/esbuild
  do
    if [ -f "$p" ]; then
      echo "-- $p"; ls -la "$p"; file "$p" || true
    else
      echo "-- $p (missing)"
    fi
  done

# Quick require checks
run_node "require('esbuild') version" "try{const e=require('esbuild'); console.log('esbuild version:', e.version)}catch(err){console.error(err); process.exit(1)}"
run_node "require('vite') only" "try{require('vite'); console.log('vite loaded ok')}catch(err){console.error(err); process.exit(1)}"
run_node "start vite createServer (no listen)" "(async()=>{try{const {createServer}=require('vite'); const s=await createServer({logLevel:'silent'}); console.log('createServer ok'); await s.close()}catch(err){console.error(err); process.exit(1)}})()"

# Try to run esbuild binary directly with --version
echo -e "\n=== invoking esbuild --version directly ==="
for p in \
  node_modules/esbuild/bin/esbuild \
  node_modules/vite/node_modules/esbuild/bin/esbuild
  do
    if [ -x "$p" ]; then
      echo "-- $p"; "$p" --version || echo "[FAIL] $p --version"
    else
      echo "-- $p not executable or missing"
    fi
  done

echo -e "\nDone. If something crashed with 'Illegal instruction', that's our culprit."
