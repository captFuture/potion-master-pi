#!/bin/bash
set -euo pipefail

# Fix execution permissions and normalize line endings
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Do not treat chmod changes as file modifications
git config core.filemode false || true

# Normalize line endings to LF for critical files (portable, no dos2unix required)
normalize() {
  local pattern="$1"
  while IFS= read -r -d '' file; do
    sed -i 's/\r$//' "$file" || true
  done < <(find . -path "./.git" -prune -o -type f -name "$pattern" -print0)
}

normalize "*.sh"
normalize "*.service"
normalize "*.js"

# Ensure shell scripts are executable
find scripts -type f -name "*.sh" -exec chmod +x {} + 2>/dev/null || true

# Ensure hardware test utilities with shebang are executable
for f in hardware/test-*.js; do
  [ -f "$f" ] || continue
  if head -n1 "$f" | grep -q "^#!"; then
    chmod +x "$f" || true
  fi
done

echo "✅ Permissions fixed"
