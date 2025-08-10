#!/bin/bash
set -euo pipefail

echo "🔄 Updating Cocktail Machine System"
echo "=================================="

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Fix permissions to avoid manual chmod issues
echo "Fixing permissions..."
bash ./scripts/fix-permissions.sh || true

# Parse optional flags
FORCE=0
if [[ "${1:-}" == "--force" ]]; then
  FORCE=1
fi

# Manual mode - no services to stop
echo "Skipping service control (manual mode: no systemd services)"

# Update from git with safety around local changes
echo "Updating from git..."
if [[ $FORCE -eq 1 ]]; then
  echo "⚠️  Forcing update: discarding local changes"
  git fetch origin main
  git reset --hard origin/main
else
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "ℹ️  Local changes detected. Stashing before pull..."
    STASH_NAME="auto-stash-$(date +%s)"
    git stash push -u -m "$STASH_NAME" || true
    STASHED=1
  else
    STASHED=0
  fi
  git pull --rebase --autostash origin main || git pull origin main
  if [[ ${STASHED:-0} -eq 1 ]]; then
    echo "ℹ️  Attempting to re-apply stashed changes..."
    if git stash list | grep -q "$STASH_NAME"; then
      if ! git stash pop -q; then
        echo "⚠️  Could not auto-apply stash. Your changes are kept in 'git stash list'."
      fi
    fi
  fi
fi

# Update hardware dependencies
echo "Updating hardware dependencies..."
pushd hardware >/dev/null
if ! npm ci --no-audit --prefer-offline; then
  npm install --no-audit --prefer-offline
fi
popd >/dev/null

# Update frontend and build
echo "Updating frontend dependencies and building..."
if ! npm ci --no-audit --prefer-offline; then
  npm install --no-audit --prefer-offline
fi
# Try normal build, then a compatibility build if needed
if ! npm run build; then
  echo "⚠️ Build failed, trying a compatibility build"
  node --max-old-space-size=2048 ./node_modules/.bin/vite build --mode production --logLevel warn || true
fi

echo ""
echo "✅ System updated!"
echo ""
echo "Next steps (manual start):"
echo "  - Hardware:   ./scripts/start-hardware.sh"
echo "  - Frontend:   ./scripts/start-frontend.sh"
echo ""
echo "Tips:"
echo "  - Run tests:  ./scripts/test-hardware.sh"
echo "  - Build app:  npm run build && npm run preview"
