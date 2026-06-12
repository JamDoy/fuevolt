#!/bin/bash
# Build and deploy script for FueVolt
# Restores the Vite dev entry point before building, then copies built files to repo root

set -e

# Restore the Vite dev entry point (production builds overwrite index.html)
cat > index.html << 'DEVHTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FueVolt — Australian EV & Fuel Price Finder</title>
    <meta name="description" content="Find cheap fuel prices and EV charging stations across Australia" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
DEVHTML

# Build with Vite
npx vite build

# Copy built files to repo root for Hostinger deployment
cp dist/index.html .
cp dist/favicon.svg .
cp dist/.htaccess .
rm -rf assets/
cp -r dist/assets .

echo "Build complete. Production files at repo root."
