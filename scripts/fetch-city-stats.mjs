#!/usr/bin/env node
/**
 * Fetches a real, live snapshot of fuel prices and EV charger counts for
 * each city page, and writes it to src/data/cityStats.json.
 *
 * This is intentionally NOT run as part of every build — the NSW fuel API
 * shares a 2,500 calls/month quota with the live app's own search feature,
 * so this script is run on a daily schedule (see
 * .github/workflows/refresh-city-stats.yml) and the resulting JSON is
 * committed to the repo. Every deploy then reads that cached snapshot
 * instead of calling government APIs on every build.
 *
 * A city is simply omitted from the output if its fetch fails or if no
 * government price feed covers it (Adelaide, Darwin) — never filled with a
 * placeholder or estimated number.
 */

import fs from 'fs';
import path from 'path';

const OUT_PATH = path.resolve('src/data/cityStats.json');
const RADIUS_KM = 15;
const FUEL_TYPE = 'U91';

// ── City coordinates (city-centre points; a handful aren't in the app's
// own AU_CITIES table, so real, publicly known coordinates are added here) ──
const FUEL_CITY_STATE = {
  sydney: { state: 'nsw', lat: -33.8688, lng: 151.2093 },
  melbourne: { state: 'vic', lat: -37.8136, lng: 144.9631 },
  brisbane: { state: 'qld', lat: -27.4698, lng: 153.0251 },
  perth: { state: 'wa', lat: -31.9505, lng: 115.8605 },
  adelaide: { state: null, lat: -34.9285, lng: 138.6007 }, // no SA feed
  'gold-coast': { state: 'qld', lat: -28.0167, lng: 153.4000 },
  canberra: { state: 'nsw', lat: -35.2809, lng: 149.1300 }, // best-effort; may return nothing
  newcastle: { state: 'nsw', lat: -32.9283, lng: 151.7817 },
  wollongong: { state: 'nsw', lat: -34.4248, lng: 150.8931 },
  hobart: { state: 'nsw', lat: -42.8821, lng: 147.3272 }, // NSW API also covers TAS
  geelong: { state: 'vic', lat: -38.1499, lng: 144.3617 },
  townsville: { state: 'qld', lat: -19.2590, lng: 146.8169 },
  cairns: { state: 'qld', lat: -16.9186, lng: 145.7781 },
  darwin: { state: null, lat: -12.4634, lng: 130.8456 }, // no NT feed
  toowoomba: { state: 'qld', lat: -27.5598, lng: 151.9507 },
  ballarat: { state: 'vic', lat: -37.5622, lng: 143.8503 },
  bendigo: { state: 'vic', lat: -36.7570, lng: 144.2794 },
  launceston: { state: 'nsw', lat: -41.4332, lng: 147.1441 }, // NSW API also covers TAS
  'sunshine-coast': { state: 'qld', lat: -26.6500, lng: 153.0667 },
  parramatta: { state: 'nsw', lat: -33.8151, lng: 151.0011 },
};

const EV_CITY_COORDS = {
  sydney: { lat: -33.8688, lng: 151.2093 },
  melbourne: { lat: -37.8136, lng: 144.9631 },
  brisbane: { lat: -27.4698, lng: 153.0251 },
  perth: { lat: -31.9505, lng: 115.8605 },
  adelaide: { lat: -34.9285, lng: 138.6007 },
  'gold-coast': { lat: -28.0167, lng: 153.4000 },
  canberra: { lat: -35.2809, lng: 149.1300 },
  hobart: { lat: -42.8821, lng: 147.3272 },
  darwin: { lat: -12.4634, lng: 130.8456 },
  newcastle: { lat: -32.9283, lng: 151.7817 },
};

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Government feeds occasionally contain a mis-entered price (e.g. a station
// reporting $0.99/L). A single bad entry would otherwise become a "fact" on
// the page as the city's lowest price, so implausible values are excluded
// from the summary — this filters data errors, it does not adjust real ones.
const PLAUSIBLE_MIN_PRICE = 1.00;
const PLAUSIBLE_MAX_PRICE = 3.00;

function summarise(rawPrices) {
  const prices = rawPrices.filter((p) => p >= PLAUSIBLE_MIN_PRICE && p <= PLAUSIBLE_MAX_PRICE);
  if (!prices.length) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
  return {
    fuelType: FUEL_TYPE,
    stationCount: prices.length,
    minPrice: Math.round(min * 1000) / 1000,
    maxPrice: Math.round(max * 1000) / 1000,
    avgPrice: Math.round(avg * 1000) / 1000,
    radiusKm: RADIUS_KM,
  };
}

// ── QLD Fuel Pricing Direct API ─────────────────────────────────────────
const QLD_API_BASE = 'https://fppdirectapi-prod.fuelpricesqld.com.au';
const QLD_API_TOKEN = '3702baa0-61e3-4796-a011-45128c1e91fd';
const QLD_FUEL_ID = 2; // U91

async function fetchQLD(lat, lng) {
  const headers = { Authorization: `FPDAPI SubscriberToken=${QLD_API_TOKEN}` };
  const [sitesRes, pricesRes] = await Promise.all([
    fetch(`${QLD_API_BASE}/Subscriber/GetFullSiteDetails?countryId=21&geoRegionLevel=3&geoRegionId=1`, { headers }),
    fetch(`${QLD_API_BASE}/Price/GetSitesPrices?countryId=21&geoRegionLevel=3&geoRegionId=1`, { headers }),
  ]);
  if (!sitesRes.ok || !pricesRes.ok) return [];
  const sitesData = await sitesRes.json();
  const pricesData = await pricesRes.json();
  if (!sitesData?.S || !pricesData?.SitePrices) return [];

  const siteMap = {};
  sitesData.S.forEach((s) => { siteMap[s.S] = s; });

  const prices = [];
  for (const p of pricesData.SitePrices) {
    if (p.FuelId !== QLD_FUEL_ID || !(p.Price > 0 && p.Price < 9000)) continue;
    const site = siteMap[p.SiteId];
    if (!site?.Lat || !site?.Lng) continue;
    if (getDistance(lat, lng, site.Lat, site.Lng) > RADIUS_KM) continue;
    prices.push(p.Price / 1000);
  }
  return prices;
}

// ── NSW Fuel API (also covers TAS) ──────────────────────────────────────
const NSW_API_BASE = 'https://api.onegov.nsw.gov.au';
const NSW_API_KEY = 'dwAE4MpeaMhNhZFsnzZesHKiQmG3e87z';
const NSW_API_SECRET = 'jrcoqUqm4WoxNMgW';

async function getNSWToken() {
  const credentials = Buffer.from(`${NSW_API_KEY}:${NSW_API_SECRET}`).toString('base64');
  const response = await fetch(`${NSW_API_BASE}/oauth/client_credential/accesstoken?grant_type=client_credentials`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Length': '0' },
    body: '',
  });
  if (!response.ok) return null;
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text).access_token;
}

async function fetchNSW(lat, lng) {
  const token = await getNSWToken();
  if (!token) return [];
  const response = await fetch(`${NSW_API_BASE}/FuelPriceCheck/v2/fuel/prices/nearby`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      apikey: NSW_API_KEY,
    },
    body: JSON.stringify({
      fueltype: 'U91',
      latitude: lat.toString(),
      longitude: lng.toString(),
      radius: String(RADIUS_KM),
      sortby: 'price',
      sortascending: 'true',
    }),
  });
  if (!response.ok) return [];
  const data = await response.json();
  if (!data.prices) return [];
  return data.prices.map((p) => p.price / 100).filter((p) => p > 0);
}

// ── VIC Fair Fuel Open Data API ─────────────────────────────────────────
const VIC_API_BASE = 'https://api.fuel.service.vic.gov.au/open-data/v1';
const VIC_CONSUMER_ID = '306d44cdce3e09a9a61135cbe7e5eff1';

async function fetchVIC(lat, lng) {
  const txnId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const response = await fetch(`${VIC_API_BASE}/fuel/prices`, {
    headers: {
      'x-consumer-id': VIC_CONSUMER_ID,
      'x-transactionid': txnId,
      'User-Agent': 'FueVolt/1.0',
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  if (!data.fuelPriceDetails) return [];

  const prices = [];
  for (const entry of data.fuelPriceDetails) {
    const fs = entry.fuelStation;
    if (!fs?.location?.latitude || !fs?.location?.longitude) continue;
    if (getDistance(lat, lng, fs.location.latitude, fs.location.longitude) > RADIUS_KM) continue;
    const fuelPrice = entry.fuelPrices?.find((fp) => fp.fuelType === 'U91' && fp.isAvailable);
    if (!fuelPrice) continue;
    prices.push(fuelPrice.price / 100);
  }
  return prices;
}

// ── WA FuelWatch — public RSS feed, called directly (no proxy needed) ───
async function fetchWA(lat, lng) {
  const url = `https://www.fuelwatch.wa.gov.au/fuelwatch/fuelWatchRSS?Product=1&Day=today`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FueVolt/1.0; +https://www.fuevolt.com/contact)',
      Accept: 'application/rss+xml, application/xml, text/xml',
    },
  });
  if (!response.ok) return [];
  const xml = await response.text();
  if (!xml.includes('<item>')) return [];

  const prices = [];
  const items = xml.split('<item>').slice(1);
  for (const item of items) {
    const price = parseFloat(item.match(/<price>([\d.]+)<\/price>/)?.[1] || '0');
    const stationLat = parseFloat(item.match(/<latitude>([-\d.]+)<\/latitude>/)?.[1] || '0');
    const stationLng = parseFloat(item.match(/<longitude>([-\d.]+)<\/longitude>/)?.[1] || '0');
    if (!(price > 0) || !stationLat || !stationLng) continue;
    if (getDistance(lat, lng, stationLat, stationLng) > RADIUS_KM) continue;
    prices.push(price / 100);
  }
  return prices;
}

const STATE_FETCHERS = { qld: fetchQLD, nsw: fetchNSW, vic: fetchVIC, wa: fetchWA };

// ── Open Charge Map (EV) ────────────────────────────────────────────────
const OCM_API_KEY = '1ce3a80b-61c0-40e2-97ed-45e81462eac9';

function categoriseConnector(title = '') {
  const t = title.toUpperCase();
  if (t.includes('CCS')) return 'CCS2';
  if (t.includes('CHADEMO')) return 'CHAdeMO';
  if (t.includes('TESLA')) return 'Tesla';
  if (t.includes('TYPE 2')) return 'Type 2';
  return null;
}

async function fetchEVStats(lat, lng) {
  const params = new URLSearchParams({
    output: 'json',
    countrycode: 'AU',
    key: OCM_API_KEY,
    latitude: lat.toString(),
    longitude: lng.toString(),
    distance: RADIUS_KM.toString(),
    distanceunit: 'KM',
    maxresults: '200',
    compact: 'false',
    verbose: 'true',
  });
  const response = await fetch(`https://api.openchargemap.io/v3/poi/?${params}`);
  if (!response.ok) return null;
  const stations = await response.json();
  if (!Array.isArray(stations) || stations.length === 0) return null;

  let fastCount = 0;
  const connectorStationCounts = { 'Type 2': 0, CCS2: 0, CHAdeMO: 0, Tesla: 0 };
  for (const s of stations) {
    const connections = s.Connections || [];
    const maxPower = connections.reduce((m, c) => Math.max(m, c.PowerKW || 0), 0);
    if (maxPower >= 50) fastCount += 1;
    const seen = new Set();
    for (const c of connections) {
      const category = categoriseConnector(c.ConnectionType?.Title);
      if (category && !seen.has(category)) {
        seen.add(category);
        connectorStationCounts[category] += 1;
      }
    }
  }

  return {
    stationCount: stations.length,
    fastCount,
    connectors: connectorStationCounts,
    radiusKm: RADIUS_KM,
  };
}

// ── Run ──────────────────────────────────────────────────────────────────
async function main() {
  const result = { generatedAt: new Date().toISOString(), fuel: {}, ev: {} };

  console.log('Fetching fuel price stats...');
  for (const [slug, city] of Object.entries(FUEL_CITY_STATE)) {
    if (!city.state) {
      console.log(`  – ${slug}: skipped (no government feed for this state)`);
      continue;
    }
    try {
      const prices = await STATE_FETCHERS[city.state](city.lat, city.lng);
      const summary = summarise(prices);
      if (summary) {
        result.fuel[slug] = summary;
        console.log(`  ✓ ${slug}: ${summary.stationCount} stations, avg $${summary.avgPrice.toFixed(2)}`);
      } else {
        console.log(`  – ${slug}: no data returned`);
      }
    } catch (err) {
      console.log(`  – ${slug}: fetch failed (${err.message})`);
    }
  }

  console.log('Fetching EV charging stats...');
  for (const [slug, coords] of Object.entries(EV_CITY_COORDS)) {
    try {
      const stats = await fetchEVStats(coords.lat, coords.lng);
      if (stats) {
        result.ev[slug] = stats;
        console.log(`  ✓ ${slug}: ${stats.stationCount} stations, ${stats.fastCount} fast/ultra-rapid`);
      } else {
        console.log(`  – ${slug}: no data returned`);
      }
    } catch (err) {
      console.log(`  – ${slug}: fetch failed (${err.message})`);
    }
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2) + '\n', 'utf-8');
  console.log(`\nWrote ${Object.keys(result.fuel).length} fuel + ${Object.keys(result.ev).length} EV city stats to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('fetch-city-stats failed:', err);
  process.exit(1);
});
