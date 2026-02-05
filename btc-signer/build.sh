#!/bin/bash
set -euo pipefail

echo "🧹 Cleaning..."
rm -rf dist function.zip node_modules

echo "🔎 Checking vendored libs..."
if [ ! -d "libs" ] || [ -z "$(ls -A libs 2>/dev/null)" ]; then
	echo "❌ Error: libs/ folder missing or empty. Run ./vendor-libs.sh first" >&2
	exit 1
fi

echo "🔨 Building TypeScript..."
npm ci --ignore-scripts
cp -R libs/* node_modules/
npm run build

echo "📦 Packaging..."

cp package.json package-lock.json dist/
cd dist && npm ci --omit=dev --ignore-scripts
cp -R ../libs/* node_modules/

echo "🧹 Cleaning up unnecessary files..."
# Documentation and config files
find node_modules -name "*.md" -delete 2>/dev/null || true
find node_modules -name "CHANGELOG*" -delete 2>/dev/null || true
find node_modules -name ".npmignore" -delete 2>/dev/null || true
find node_modules -name ".eslintrc*" -delete 2>/dev/null || true
find node_modules -name ".prettierrc*" -delete 2>/dev/null || true
find node_modules -name ".editorconfig" -delete 2>/dev/null || true
find node_modules -name ".gitignore" -delete 2>/dev/null || true
find node_modules -name ".travis.yml" -delete 2>/dev/null || true
find node_modules -name "*.lock" -delete 2>/dev/null || true

# TypeScript artifacts (not needed at runtime)
find node_modules -name "*.d.ts" -delete 2>/dev/null || true
find node_modules -name "*.d.ts.map" -delete 2>/dev/null || true
find node_modules -name "*.js.map" -delete 2>/dev/null || true
find node_modules -name "*.ts" ! -name "*.d.ts" -delete 2>/dev/null || true
find node_modules -name "tsconfig*.json" -delete 2>/dev/null || true

zip -r ../function.zip .

echo ""
echo "✅ Done!"
echo ""
echo "📊 Sizes:"
echo "   dist/: $(du -sh ../dist | cut -f1)"
echo "   libs/: $(du -sh ../libs | cut -f1)"
echo "   ZIP:   $(ls -lh ../function.zip | awk '{print $5}')"