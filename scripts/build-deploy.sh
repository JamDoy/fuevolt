#!/bin/bash
# Build the complete Hostinger artifact, including every pre-rendered route.

set -euo pipefail

npm run build

echo "Build complete. Upload the complete dist/ directory to Hostinger public_html/."
