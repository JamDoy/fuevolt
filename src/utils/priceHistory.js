// On-device price history — there is no backend price-history API, so this
// accumulates real snapshots over repeat visits to a station's detail page.
// It starts empty for every station and only grows from what this specific
// browser has actually observed. Never synthesised or estimated.

const STORAGE_KEY = 'fuevolt_price_history';
const MAX_DAYS = 14;
const MAX_TRACKED = 60; // bound total localStorage growth across stations

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage may be unavailable or full.
  }
}

function keyFor(stationId, fuelType) {
  return `${stationId}:${fuelType}`;
}

export function recordPriceSnapshot(stationId, fuelType, price) {
  if (stationId == null || !fuelType || !Number.isFinite(price)) return;

  const store = readStore();
  const key = keyFor(stationId, fuelType);
  const series = store[key]?.series || [];
  const today = todayISO();

  if (series.length && series[series.length - 1].date === today) {
    series[series.length - 1].price = price;
  } else {
    series.push({ date: today, price });
  }

  store[key] = { series: series.slice(-MAX_DAYS), lastSeen: Date.now() };

  const keys = Object.keys(store);
  if (keys.length > MAX_TRACKED) {
    keys
      .sort((a, b) => (store[a].lastSeen || 0) - (store[b].lastSeen || 0))
      .slice(0, keys.length - MAX_TRACKED)
      .forEach((k) => delete store[k]);
  }

  writeStore(store);
}

export function getPriceHistory(stationId, fuelType) {
  const store = readStore();
  return store[keyFor(stationId, fuelType)]?.series || [];
}

// null when there isn't enough local history yet to judge a direction.
export function getPriceTrend(stationId, fuelType) {
  const series = getPriceHistory(stationId, fuelType);
  if (series.length < 2) return null;
  const diff = series[series.length - 1].price - series[0].price;
  const NOISE_FLOOR = 0.005; // ~0.5c/L
  if (diff > NOISE_FLOOR) return 'up';
  if (diff < -NOISE_FLOOR) return 'down';
  return 'stable';
}

// Combines whatever on-device history exists across a set of stations
// (e.g. everything returned for one Trends search) into a single area-wide
// average series — one point per date that at least one station has a
// reading for. Still purely local/opportunistic like the per-station
// history, so a suburb searched for the first time won't have much yet.
export function getAreaPriceHistory(stations, fuelType) {
  const byDate = new Map();
  for (const station of stations) {
    for (const point of getPriceHistory(station.id, fuelType)) {
      if (!byDate.has(point.date)) byDate.set(point.date, []);
      byDate.get(point.date).push(point.price);
    }
  }
  return [...byDate.entries()]
    .map(([date, prices]) => ({
      date,
      price: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      stationCount: prices.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// National average history — same on-device, real-snapshots-only model as
// per-station history above, just keyed by fuel type instead of a station
// id. Recorded once per day whenever a visitor lands on the Trends page's
// default (no suburb searched yet) view, from a live sample of major-city
// prices (see utils/nationalPrices.js) rather than anything estimated.
const NATIONAL_STORAGE_KEY = 'fuevolt_national_price_history';
const NATIONAL_MAX_DAYS = 30;

function readNationalStore() {
  try {
    return JSON.parse(localStorage.getItem(NATIONAL_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeNationalStore(store) {
  try {
    localStorage.setItem(NATIONAL_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage may be unavailable or full.
  }
}

export function recordNationalPriceSnapshot(fuelType, price) {
  if (!fuelType || !Number.isFinite(price)) return;

  const store = readNationalStore();
  const series = store[fuelType]?.series || [];
  const today = todayISO();

  if (series.length && series[series.length - 1].date === today) {
    series[series.length - 1].price = price;
  } else {
    series.push({ date: today, price });
  }

  store[fuelType] = { series: series.slice(-NATIONAL_MAX_DAYS) };
  writeNationalStore(store);
}

export function getNationalPriceHistory(fuelType) {
  const store = readNationalStore();
  return store[fuelType]?.series || [];
}

export function getHighLow(series) {
  if (!series.length) return null;
  let high = series[0];
  let low = series[0];
  for (const point of series) {
    if (point.price > high.price) high = point;
    if (point.price < low.price) low = point;
  }
  return { high, low };
}
