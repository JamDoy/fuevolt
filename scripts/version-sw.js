#!/usr/bin/env node
/**
 * Stamps a unique cache name into the built service worker on every build,
 * so returning visitors always get the latest deploy instead of being stuck
 * on whatever shell the service worker cached previously (cache-first for
 * '/' and '/index.html' means it never re-checks the network on its own).
 */
import fs from 'fs';
import path from 'path';

const swPath = path.resolve('dist/sw.js');
const buildId = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 8) : Date.now().toString(36);

let sw = fs.readFileSync(swPath, 'utf-8');
const versioned = sw.replace(/const CACHE_NAME = '[^']*';/, `const CACHE_NAME = 'fuevolt-${buildId}';`);

if (versioned === sw) {
  throw new Error('version-sw.js: could not find CACHE_NAME to replace in dist/sw.js');
}

fs.writeFileSync(swPath, versioned, 'utf-8');
console.log(`  ✓ sw.js cache versioned as fuevolt-${buildId}`);
