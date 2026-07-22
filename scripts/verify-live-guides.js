#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import process from 'process';

const baseUrl = (process.env.LIVE_SITE_URL || 'https://www.fuevolt.com').replace(/\/$/, '');
const attempts = Number(process.env.LIVE_VERIFY_ATTEMPTS || 20);
const delayMs = Number(process.env.LIVE_VERIFY_DELAY_MS || 15000);
const articles = JSON.parse(
  fs.readFileSync(path.resolve('public/content/articles/index.json'), 'utf8')
);

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'FueVolt deployment verifier/1.0' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
}

async function verify() {
  const [homepage, ...guides] = await Promise.all([
    fetchHtml(`${baseUrl}/`),
    ...articles.map((article) => fetchHtml(`${baseUrl}/guides/${article.slug}`)),
  ]);
  const homepageHash = hash(homepage);
  const errors = [];

  guides.forEach((html, index) => {
    const article = articles[index];
    const expectedCanonical = `https://www.fuevolt.com/guides/${article.slug}`;
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();

    if (canonical !== expectedCanonical) errors.push(`${article.slug}: wrong canonical`);
    if (!title?.startsWith(article.title)) errors.push(`${article.slug}: wrong title`);
    if (!html.includes('By James Doyle') || !html.includes('About James Doyle')) {
      errors.push(`${article.slug}: author content missing`);
    }
    if (!html.includes('<article') || html.length < 5000) {
      errors.push(`${article.slug}: full article HTML missing`);
    }
    if (hash(html) === homepageHash) errors.push(`${article.slug}: homepage fallback served`);
  });

  if (errors.length > 0) throw new Error(errors.join('; '));
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await verify();
    console.log(`Live verification passed: ${articles.length} guide pages served from ${baseUrl}`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.error(`Live verification attempt ${attempt}/${attempts} failed: ${error.message}`);
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

console.error(`Live guide verification failed: ${lastError?.message || 'unknown error'}`);
process.exit(1);
