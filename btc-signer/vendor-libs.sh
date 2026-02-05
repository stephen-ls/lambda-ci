#!/bin/bash
# Creates vendored libs folder with BTC dependencies basing on a vendor package file

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

VENDOR_PKG="$SCRIPT_DIR/package.vendor.json"
VENDOR_LOCK="$SCRIPT_DIR/package.vendor-lock.json"

TMP_DIR=""
cleanup() {
  if [ -n "${TMP_DIR}" ] && [ -d "${TMP_DIR}" ]; then
    rm -rf "${TMP_DIR}"
  fi
}
trap cleanup EXIT

echo "🧹 Cleaning..."
rm -rf libs

echo "📦 Installing vendor dependencies..."
TMP_DIR="$(mktemp -d)"
cp "$VENDOR_PKG" "$TMP_DIR/package.json"

if [ -f "$VENDOR_LOCK" ]; then
  cp "$VENDOR_LOCK" "$TMP_DIR/package-lock.json"
  (cd "$TMP_DIR" && npm ci --ignore-scripts)
else
  (cd "$TMP_DIR" && npm install --ignore-scripts)
  cp "$TMP_DIR/package-lock.json" "$VENDOR_LOCK"
  echo "🔒 Created $VENDOR_LOCK (commit this for reproducible updates)."
fi

echo "📁 Moving to libs folder..."
mkdir -p libs
cp -R "$TMP_DIR/node_modules"/* libs/

echo "🧹 Cleaning up unnecessary files..."
# Documentation and config files
find libs -name "*.md" -delete 2>/dev/null || true
find libs -name "CHANGELOG*" -delete 2>/dev/null || true
find libs -name ".npmignore" -delete 2>/dev/null || true
find libs -name ".eslintrc*" -delete 2>/dev/null || true
find libs -name ".prettierrc*" -delete 2>/dev/null || true
find libs -name ".editorconfig" -delete 2>/dev/null || true
find libs -name ".gitignore" -delete 2>/dev/null || true
find libs -name ".travis.yml" -delete 2>/dev/null || true
find libs -name "*.lock" -delete 2>/dev/null || true

# TypeScript artifacts (not needed at runtime)
find libs -name "*.d.ts" -delete 2>/dev/null || true
find libs -name "*.d.ts.map" -delete 2>/dev/null || true
find libs -name "*.js.map" -delete 2>/dev/null || true
find libs -name "*.ts" ! -name "*.d.ts" -delete 2>/dev/null || true
find libs -name "tsconfig*.json" -delete 2>/dev/null || true

# Test and docs folders
find libs -type d -name "test" -exec rm -rf {} + 2>/dev/null || true
find libs -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find libs -type d -name "__tests__" -exec rm -rf {} + 2>/dev/null || true
find libs -type d -name "docs" -exec rm -rf {} + 2>/dev/null || true
find libs -type d -name "examples" -exec rm -rf {} + 2>/dev/null || true
find libs -type d -name ".github" -exec rm -rf {} + 2>/dev/null || true

# Remove empty directories
find libs -type d -empty -delete 2>/dev/null || true

echo ""
echo "✅ Done!"
echo "   Size:  $(du -sh libs | cut -f1)"
echo "   Files: $(find libs -type f | wc -l | tr -d ' ')"