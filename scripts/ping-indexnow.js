#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import process from 'node:process';

const ENDPOINT = 'https://www.bing.com/indexnow';
const HOST = 'www.fuevolt.com';
const KEY_FILE = 'cbddd89521a12210279179d839272d3d.txt';
const KEY_PATH = path.resolve('public', KEY_FILE);
const SITEMAP_PATH = path.resolve('dist', 'sitemap.xml');
const isDryRun = process.argv.includes('--dry-run');

const key = fs.readFileSync(KEY_PATH, 'utf8').trim();
if (key !== path.basename(KEY_FILE, '.txt')) {
  throw new Error('IndexNow key file name and contents must match');
}

const sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1].replaceAll('&amp;', '&'))
  .filter((url) => new URL(url).hostname === HOST);

if (urlList.length === 0) {
  throw new Error('No fuevolt.com URLs found in dist/sitemap.xml');
}

const payload = {
  host: HOST,
  key,
  keyLocation: `https://${HOST}/${KEY_FILE}`,
  urlList,
};

if (isDryRun) {
  console.log(`IndexNow dry run: ${urlList.length} URLs`);
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

let lastError;
for (let attempt = 1; attempt <= 3; attempt += 1) {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`IndexNow accepted ${urlList.length} URLs (${response.status})`);
      process.exit(0);
    }

    const responseBody = await response.text();
    lastError = new Error(`IndexNow returned ${response.status}: ${responseBody || response.statusText}`);
  } catch (error) {
    lastError = error;
  }

  if (attempt < 3) {
    await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
  }
}

throw lastError;
