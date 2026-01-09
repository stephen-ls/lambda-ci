#!/bin/bash
set -e

echo "🧹 Cleaning..."
rm -rf dist function.zip node_modules

echo "🔨 Building TypeScript..."
npm i && npm run build

echo "📦 Packaging..."

mkdir dist/libs
cp -R libs/* dist/libs/
npm run alias
cp package.json dist/

cd dist && npm i --omit=dev

cd libs
rm -rf bip32/node_modules bip39/node_modules bitcoinjs-lib/node_modules tiny-secp256k1/node_modules
cd ../

zip -r ../function.zip .

echo ""
echo "✅ Done!"
echo ""
echo "📊 Sizes:"
echo "   dist/: $(du -sh ../dist | cut -f1)"
echo "   libs/: $(du -sh ../libs | cut -f1)"
echo "   ZIP:   $(ls -lh ../function.zip | awk '{print $5}')"