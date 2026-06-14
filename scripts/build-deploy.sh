#!/bin/bash
# Build and deploy script for FueVolt
# Builds the app and copies output to repo root for Hostinger deployment
# The root index.html should always point to /src/main.jsx for Vite builds

set -e

# Build with Vite
npx vite build

# Copy built files to repo root for Hostinger deployment
cp dist/index.html .
cp dist/favicon.svg . 2>/dev/null || true
rm -rf assets/
cp -r dist/assets .

echo "Build complete. Production files at repo root."
