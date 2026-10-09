#!/usr/bin/env node
/**
 * Nightly health check for fuevolt.com, run by .github/workflows/health-check.yml.
 *
 * Checks that the core pages, every sitemap URL and each government fuel-price
 * feed (via FueVolt's own server-side proxies) are up and returning sensible
 * data. Exits non-zero if anything is broken so the workflow fails visibly.
 * Warnings (e.g. a few impossible prices in a government feed, which the
 * site already filters out) are reported but don't fail the run.
 */
import fs from 'node:fs';

const ORIGIN = process.env.SITE_ORIGIN || 'https://www.fuevolt.com';
const TIMEOUT_MS = 20000;
const STALE_HOURS = 72;

async function get(path) {
  return fetch(path.startsWith('http') ? path : ORIGIN + path, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: 'follow',
    headers: { 'User-Agent': 'FueVolt-HealthCheck/1.0' },
  });
}

async function getJson(path) {
  const res = await get(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getText(path) {
  const res = await get(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const implausible = (cents) => !(cents >= 50 && cents <= 400);

const CORE_PAGES = [
  '/', '/fuel-prices', '/ev-charging', '/trends', '/trip-planner', '/ev-vs-fuel',
  '/guides', '/faq', '/about', '/contact', '/privacy', '/terms',
];

const checks = [];

for (const page of CORE_PAGES) {
  checks.push({
    name: `Page ${page}`,
    run: async () => {
      const html = await getText(page);
      if (!html.includes('FueVolt')) throw new Error('page loaded but has no FueVolt content');
      return `${html.length} bytes`;
    },
  });
}

checks.push({
  name: 'Sitemap and every URL in it',
  run: async () => {
    const xml = await getText('/sitemap.xml');
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    if (urls.length < 20) throw new Error(`only ${urls.length} URLs in sitemap`);
    const broken = [];
    for (let i = 0; i < urls.length; i += 5) {
      await Promise.all(urls.slice(i, i + 5).map(async (u) => {
        try {
          const res = await get(u);
          if (!res.ok) broken.push(`${u} (HTTP ${res.status})`);
        } catch (e) {
          broken.push(`${u} (${e.message})`);
        }
      }));
    }
    if (broken.length) throw new Error(`broken sitemap URLs: ${broken.join(', ')}`);
    return `${urls.length} URLs all OK`;
  },
});

checks.push({
  name: 'robots.txt references the sitemap',
  run: async () => {
    const txt = await getText('/robots.txt');
    if (!/Sitemap:/i.test(txt)) throw new Error('no Sitemap line');
    return 'ok';
  },
});

checks.push({
  name: 'ads.txt has the AdSense line',
  run: async () => {
    const txt = await getText('/ads.txt');
    if (!txt.includes('pub-7549230738737699')) throw new Error('publisher ID missing');
    return 'ok';
  },
});

checks.push({
  name: 'QLD fuel feed',
  run: async () => {
    const [prices, sites] = await Promise.all([
      getJson('/api/qld-fuel.php?endpoint=GetSitesPrices&geoRegionLevel=3&geoRegionId=1'),
      getJson('/api/qld-fuel.php?endpoint=GetFullSiteDetails&geoRegionLevel=3&geoRegionId=1'),
    ]);
    if (!prices?.SitePrices || prices.SitePrices.length < 1000) throw new Error('too few prices');
    if (!sites?.S || sites.S.length < 1000) throw new Error('too few sites');
    const newest = Math.max(...prices.SitePrices.map((p) => Date.parse(`${p.TransactionDateUtc}Z`) || 0));
    const ageH = (Date.now() - newest) / 3.6e6;
    if (ageH > STALE_HOURS) throw new Error(`newest price is ${Math.round(ageH)}h old (feed stale)`);
    const bad = prices.SitePrices.filter((p) => p.Price > 0 && p.Price < 9000 && implausible(p.Price / 10)).length;
    return { detail: `${prices.SitePrices.length} prices, newest ${Math.round(ageH)}h old`, warn: bad ? `${bad} implausible price(s) in feed (site filters these out)` : null };
  },
});

checks.push({
  name: 'NSW/TAS/ACT fuel feed',
  run: async () => {
    const data = await getJson('/api/nsw-fuel.php?lat=-33.8688&lng=151.2093&fuelType=U91&radius=15');
    if (!data?.stations?.length || !data?.prices?.length) throw new Error('no stations/prices returned');
    return `${data.prices.length} prices near Sydney`;
  },
});

checks.push({
  name: 'VIC fuel feed',
  run: async () => {
    const data = await getJson('/api/vic-fuel.php');
    const list = data?.fuelPriceDetails;
    if (!list || list.length < 1000) throw new Error('too few stations');
    let bad = 0;
    for (const e of list) for (const fp of e.fuelPrices || []) if (fp.isAvailable && fp.fuelType !== 'LPG' && implausible(fp.price)) bad++;
    return { detail: `${list.length} stations`, warn: bad ? `${bad} implausible price(s) in feed (site filters these out)` : null };
  },
});

checks.push({
  name: 'WA FuelWatch feed',
  run: async () => {
    const xml = await getText('/api/wa-fuel.php?product=1&day=today');
    const items = (xml.match(/<item>/g) || []).length;
    if (items < 50) throw new Error(`only ${items} stations`);
    return `${items} stations`;
  },
});

checks.push({
  name: 'NT MyFuel feed',
  run: async () => {
    const data = await getJson('/api/nt-fuel.php?lat=-12.4634&lng=130.8456&fuelType=U91&radius=15');
    if (!Array.isArray(data) || data.length === 0) throw new Error('no stations returned');
    return `${data.length} stations near Darwin`;
  },
});

checks.push({
  name: 'EV charging feed',
  run: async () => {
    const data = await getJson('/api/ev-charge.php?lat=-27.4698&lng=153.0251&distance=10&maxresults=20');
    if (!Array.isArray(data) || data.length === 0) throw new Error('no chargers returned');
    return `${data.length} chargers near Brisbane`;
  },
});

async function runCheck(check) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const out = await check.run();
      const r = typeof out === 'string' ? { detail: out } : out;
      return { name: check.name, ok: true, detail: r.detail, warn: r.warn || null };
    } catch (err) {
      if (attempt === 2) return { name: check.name, ok: false, detail: err.message };
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

const results = [];
for (let i = 0; i < checks.length; i += 4) {
  results.push(...(await Promise.all(checks.slice(i, i + 4).map(runCheck))));
}

const failed = results.filter((r) => !r.ok);
const warned = results.filter((r) => r.ok && r.warn);

for (const r of results) {
  const tag = !r.ok ? 'FAIL' : r.warn ? 'WARN' : 'PASS';
  console.log(`${tag}  ${r.name}: ${r.detail}${r.warn ? `  [${r.warn}]` : ''}`);
}
console.log(`\n${results.length - failed.length}/${results.length} checks passed, ${warned.length} warning(s), ${failed.length} failed`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = results.map((r) => `| ${!r.ok ? '❌' : r.warn ? '⚠️' : '✅'} | ${r.name} | ${r.detail}${r.warn ? ` — ${r.warn}` : ''} |`);
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## FueVolt health check\n\n| | Check | Detail |\n|---|---|---|\n${rows.join('\n')}\n`,
  );
}

process.exit(failed.length ? 1 : 0);
