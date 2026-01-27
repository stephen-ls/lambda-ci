#!/bin/bash
# Creates vendored libs folder with BTC dependencies basing on a vendor package file

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🧹 Cleaning..."
rm -rf libs node_modules

echo "� Installing vendor dependencies..."
mv package.json package.json.bak
mv package-lock.json package-lock.json.bak
cp package.vendor.json package.json
npm install --install-strategy=hoisted
mv package.json.bak package.json
mv package-lock.json.bak package-lock.json

echo "📁 Moving to libs folder..."
mkdir -p libs
mv node_modules/* libs/
rm -rf node_modules

echo "🔧 Removing dependency declarations from vendored libs..."
find libs -name "package.json" -type f | while read -r pkg; do
  node -e "
    const fs = require('fs');
    const p = JSON.parse(fs.readFileSync('$pkg', 'utf8'));
    delete p.dependencies;
    delete p.peerDependencies;
    delete p.devDependencies;
    delete p.optionalDependencies;
    fs.writeFileSync('$pkg', JSON.stringify(p, null, 2) + '\n');
  "
done

echo "🧹 Cleaning up unnecessary files..."
# Documentation and config files
find libs -name "*.md" -delete 2>/dev/null || true
find libs -name "LICENSE*" -delete 2>/dev/null || true
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