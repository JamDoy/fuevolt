#!/bin/bash
# Build and deploy script for FueVolt
# Builds the app and copies output to repo root for Hostinger deployment
# Note: vite.config.js has a dev-entry-point plugin that transforms
# the production index.html back to source entry during development

set -e

# Build with Vite
npx vite build

# Copy built files to repo root for Hostinger deployment
cp dist/index.html .
cp dist/favicon.svg .
cp dist/.htaccess .
rm -rf assets/
cp -r dist/assets .

echo "Build complete. Production files at repo root."
