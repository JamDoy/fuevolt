#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import process from 'process';

const outputDir = path.resolve(process.argv[2] || 'dist');
const contentDir = path.resolve('public/content/articles');
const articles = JSON.parse(fs.readFileSync(path.join(contentDir, 'index.json'), 'utf8'));
const homepagePath = path.join(outputDir, 'index.html');
const guidesDir = path.join(outputDir, 'guides');
const errors = [];

function fail(message) {
  errors.push(message);
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stripHtml(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|amp|quot|#39|lt|gt);/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

if (!fs.existsSync(homepagePath)) {
  fail(`Missing ${homepagePath}`);
}

const homepage = fs.existsSync(homepagePath) ? fs.readFileSync(homepagePath, 'utf8') : '';
const homepageHash = hash(homepage);
const generatedGuideSlugs = fs.existsSync(guidesDir)
  ? fs.readdirSync(guidesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(guidesDir, entry.name, 'index.html')))
      .map((entry) => entry.name)
      .sort()
  : [];
const expectedGuideSlugs = articles.map((article) => article.slug).sort();

if (generatedGuideSlugs.length !== expectedGuideSlugs.length) {
  fail(`Expected ${expectedGuideSlugs.length} guide files, found ${generatedGuideSlugs.length}`);
}

for (const slug of expectedGuideSlugs) {
  if (!generatedGuideSlugs.includes(slug)) fail(`Missing generated guide: ${slug}`);
}
for (const slug of generatedGuideSlugs) {
  if (!expectedGuideSlugs.includes(slug)) fail(`Unexpected generated guide: ${slug}`);
}

const titles = new Set();
for (const article of articles) {
  const filePath = path.join(guidesDir, article.slug, 'index.html');
  if (!fs.existsSync(filePath)) continue;

  const html = fs.readFileSync(filePath, 'utf8');
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const articleBody = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] || '';
  const articleText = stripHtml(articleBody);
  const expectedCanonical = `https://www.fuevolt.com/guides/${article.slug}`;

  if (canonical !== expectedCanonical) {
    fail(`${article.slug}: canonical is ${canonical || 'missing'}, expected ${expectedCanonical}`);
  }
  if (!title || !title.startsWith(article.title)) {
    fail(`${article.slug}: title is missing or does not match the guide title`);
  } else {
    titles.add(title);
  }
  if (!html.includes(`<h1`) || !stripHtml(html).includes(article.title)) {
    fail(`${article.slug}: guide H1/title text is missing`);
  }
  if (!html.includes('By James Doyle') || !html.includes('About James Doyle')) {
    fail(`${article.slug}: James Doyle author attribution is missing`);
  }
  if (!html.includes('id="schema-article"') || !html.includes('"@type":"Article"')) {
    fail(`${article.slug}: Article JSON-LD is missing`);
  }
  if (articleText.length < 1200) {
    fail(`${article.slug}: article body is too short (${articleText.length} characters)`);
  }
  if (hash(html) === homepageHash) {
    fail(`${article.slug}: generated HTML is identical to the homepage`);
  }
}

if (titles.size !== articles.length) {
  fail(`Expected ${articles.length} unique guide titles, found ${titles.size}`);
}

if (errors.length > 0) {
  console.error('Prerender verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Prerender verification passed: ${articles.length} unique guide pages in ${outputDir}`);
