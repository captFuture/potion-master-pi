#!/bin/bash
set -euo pipefail

# Quick environment diagnosis for Raspberry Pi issues

echo "=== System ==="
uname -a

echo "\n=== Node.js ==="
node -v || true
node -p "process.arch + ' ' + process.platform" || true
node -p "process.versions" || true
node -p "process.versions.v8" || true

echo "\n=== libc (ldd) ==="
ldd --version 2>/dev/null || echo "ldd not available"

echo "\n=== esbuild binaries ==="
if command -v esbuild >/dev/null 2>&1; then
  esbuild --version || true
else
  echo "esbuild CLI not in PATH"
fi
ls -la node_modules/vite/node_modules/esbuild 2>/dev/null || echo "no nested esbuild dir"
ls -la node_modules/esbuild 2>/dev/null || echo "no hoisted esbuild dir"

# File type of potential binaries
echo "\n=== esbuild binary file types ==="
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

# Try to require modules in Node to catch SIGILL sources
echo "\n=== Node require probes ==="
node -e "try{const e=require('esbuild'); console.log('esbuild version:', e.version)}catch(e){console.error('esbuild require failed'); console.error(e); process.exit(1)}" || true
node -e "try{require('vite'); console.log('vite loaded ok')}catch(e){console.error('vite require failed'); console.error(e); process.exit(1)}" || true
node -e "(async()=>{try{const {createServer}=require('vite'); const s=await createServer({logLevel:'silent'}); console.log('vite createServer ok'); await s.close()}catch(e){console.error('vite createServer failed'); console.error(e); process.exit(1)}})()" || true

echo "\n=== SWC presence ==="
if [ -d node_modules/@swc/core ]; then
  ls -la node_modules/@swc/core || true
else
  echo "@swc/core not installed"
fi

echo "\n=== CPU Flags (if available) ==="
if command -v lscpu >/dev/null 2>&1; then
  lscpu | sed -n '1,20p'
  lscpu | grep -i flags -n || true
else
  echo "lscpu not available"
fi

echo "\nDone."
