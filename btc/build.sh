#!/bin/bash
set -e

echo "🧹 Cleaning..."
rm -rf dist function.zip node_modules

echo "🔨 Building TypeScript..."
npm i && npm run build

echo "📦 Packaging..."

cp package.json dist/
cd dist && npm i --omit=dev
cp -R ../libs/* node_modules/

zip -r ../function.zip .

echo ""
echo "✅ Done!"
echo ""
echo "📊 Sizes:"
echo "   dist/: $(du -sh ../dist | cut -f1)"
echo "   libs/: $(du -sh ../libs | cut -f1)"
echo "   ZIP:   $(ls -lh ../function.zip | awk '{print $5}')"