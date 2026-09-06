import { XMLParser } from 'fast-xml-parser';
import { getDistance } from './distance.mjs';

// Same-origin proxies already deployed on fuevolt.com (public/api/*.php) —
// this app calls the live site's cached endpoints rather than re-implementing
// each state's OAuth/API-key handshake. See src/utils/api.js in the main repo
// for the browser-side equivalent of every fetcher below.
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://www.fuevolt.com';

const QLD_BRAND_MAP = {
  2: 'Caltex', 5: 'BP', 7: 'Budget', 12: 'Independent', 16: 'Mobil',
  20: 'Shell', 23: 'United', 27: 'Unbranded', 51: 'Apco', 57: 'Metro Fuel',
  65: 'Petrogas', 72: 'Gull', 86: 'Liberty', 87: 'AM/PM', 105: 'Better Choice',
  110: 'Freedom Fuels', 111: 'Coles Express', 113: '7-Eleven', 114: 'Astron',
  115: 'Prime Petroleum', 167: 'Speedway', 169: 'On the Run', 2301: 'Choice',
  4896: 'Mogas', 5094: 'Puma Energy', 2031031: 'Costco', 2418945: 'Endeavour',
  2418994: 'Pacific Petroleum', 2418995: 'Vibe', 2419007: 'Lowes',
  2419008: 'Westside', 2459022: 'FuelXpress', 3421028: 'X Convenience',
  3421066: 'Ampol', 3421073: 'EG Ampol', 3421075: 'IOR', 3421183: 'U-Go',
  3421193: 'Reddy Express', 3421230: 'SOLO',
};

function cheapestOf(stations) {
  if (!stations || stations.length === 0) return null;
  return stations.reduce((min, s) => (s.price != null && (min == null || s.price < min.price) ? s : min), null);
}

// NSW FuelCheck — also covers TAS and ACT (see src/utils/api.js comment on
// fetchNSWFuelPrices for why those two route through the same API).
export async function fetchCheapestNSW(lat, lng, radius, state = 'NSW') {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), fuelType: 'U91', radius: String(radius) });
  const res = await fetch(`${SITE_ORIGIN}/api/nsw-fuel.php?${params}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.stations || !data.prices) return null;

  const stationMap = {};
  data.stations.forEach((s) => { stationMap[s.code] = s; });

  const sourceLabel = state === 'ACT' ? 'ACT (via NSW FuelCheck)' : state === 'TAS' ? 'TAS Government' : 'NSW Government';

  const stations = data.prices.map((p) => {
    const station = stationMap[p.stationcode] || {};
    const stationLat = station.location?.latitude || lat;
    const stationLng = station.location?.longitude || lng;
    return {
      name: station.name || (station.brand ? `${station.brand} Station` : 'Fuel Station'),
      brand: station.brand || 'Independent',
      address: station.address || '',
      price: p.price / 100,
      distance: getDistance(lat, lng, stationLat, stationLng),
      source: sourceLabel,
    };
  });

  return cheapestOf(stations);
}

// VIC Fair Fuel Open Data — whole-state response, filtered client-side.
export async function fetchCheapestVIC(lat, lng, radius) {
  const res = await fetch(`${SITE_ORIGIN}/api/vic-fuel.php`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.fuelPriceDetails) return null;

  const stations = [];
  for (const entry of data.fuelPriceDetails) {
    const fs = entry.fuelStation;
    if (!fs?.location?.latitude || !fs?.location?.longitude) continue;
    const fuelPrice = entry.fuelPrices?.find((fp) => fp.fuelType === 'U91' && fp.isAvailable);
    if (!fuelPrice) continue;
    const dist = getDistance(lat, lng, fs.location.latitude, fs.location.longitude);
    if (dist > radius) continue;
    stations.push({
      name: fs.name || 'Fuel Station',
      brand: fs.name?.split(' ').pop() || 'Independent',
      address: fs.address || '',
      price: fuelPrice.price / 100,
      distance: dist,
      source: 'VIC Government',
    });
  }
  return cheapestOf(stations);
}

// QLD Fuel Pricing Direct API — two endpoints joined client-side.
export async function fetchCheapestQLD(lat, lng, radius) {
  const [sitesRes, pricesRes] = await Promise.all([
    fetch(`${SITE_ORIGIN}/api/qld-fuel.php?endpoint=GetFullSiteDetails&geoRegionLevel=3&geoRegionId=1`),
    fetch(`${SITE_ORIGIN}/api/qld-fuel.php?endpoint=GetSitesPrices&geoRegionLevel=3&geoRegionId=1`),
  ]);
  if (!sitesRes.ok || !pricesRes.ok) return null;
  const sitesData = await sitesRes.json();
  const pricesData = await pricesRes.json();
  if (!sitesData?.S || !pricesData?.SitePrices) return null;

  const siteMap = {};
  sitesData.S.forEach((s) => { siteMap[s.S] = s; });

  const stations = [];
  for (const p of pricesData.SitePrices) {
    if (p.FuelId !== 2 || !(p.Price > 0 && p.Price < 9000)) continue; // 2 = Unleaded 91
    const site = siteMap[p.SiteId];
    if (!site || !site.Lat || !site.Lng) continue;
    const dist = getDistance(lat, lng, site.Lat, site.Lng);
    if (dist > radius) continue;
    stations.push({
      name: site.N || `${QLD_BRAND_MAP[site.B] || 'Independent'} Station`,
      brand: QLD_BRAND_MAP[site.B] || 'Independent',
      address: `${site.A || ''}, QLD ${site.P || ''}`.trim(),
      price: p.Price / 1000,
      distance: dist,
      source: 'QLD Government',
    });
  }
  return cheapestOf(stations);
}

// WA FuelWatch RSS feed — XML, parsed with fast-xml-parser.
export async function fetchCheapestWA(lat, lng, radius) {
  const res = await fetch(`${SITE_ORIGIN}/api/wa-fuel.php?product=1&day=today`);
  if (!res.ok) return null;
  const xmlText = await res.text();
  const parser = new XMLParser();
  const doc = parser.parse(xmlText);
  const items = doc?.rss?.channel?.item;
  if (!items) return null;
  const list = Array.isArray(items) ? items : [items];

  const stations = [];
  for (const item of list) {
    const price = parseFloat(item.price || '0');
    const stationLat = parseFloat(item.latitude || '0');
    const stationLng = parseFloat(item.longitude || '0');
    if (!(price > 0)) continue;
    const dist = getDistance(lat, lng, stationLat, stationLng);
    if (dist > radius) continue;
    stations.push({
      name: item['trading-name'] || `${item.brand || 'Unknown'} ${item.location || ''}`.trim(),
      brand: item.brand || 'Unknown',
      address: `${item.address || ''}, ${item.location || ''} WA`,
      price: price / 100,
      distance: dist,
      source: 'WA FuelWatch',
    });
  }
  return cheapestOf(stations);
}

// NT MyFuel — proxy already returns fully-formed station objects.
export async function fetchCheapestNT(lat, lng, radius) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), fuelType: 'U91', radius: String(radius) });
  const res = await fetch(`${SITE_ORIGIN}/api/nt-fuel.php?${params}`);
  if (!res.ok) return null;
  const stations = await res.json();
  if (!Array.isArray(stations)) return null;
  return cheapestOf(stations.map((s) => ({ ...s, distance: parseFloat(s.distance) })));
}

const FETCHERS = {
  NSW: (city, radius) => fetchCheapestNSW(city.lat, city.lng, radius, 'NSW'),
  TAS: (city, radius) => fetchCheapestNSW(city.lat, city.lng, radius, 'TAS'),
  ACT: (city, radius) => fetchCheapestNSW(city.lat, city.lng, radius, 'ACT'),
  VIC: (city, radius) => fetchCheapestVIC(city.lat, city.lng, radius),
  QLD: (city, radius) => fetchCheapestQLD(city.lat, city.lng, radius),
  WA: (city, radius) => fetchCheapestWA(city.lat, city.lng, radius),
  NT: (city, radius) => fetchCheapestNT(city.lat, city.lng, radius),
};

export async function fetchCheapestForCity(city, radius) {
  const fetcher = FETCHERS[city.state];
  if (!fetcher) return null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await fetcher(city, radius);
      if (result) return result;
    } catch (err) {
      console.error(`Attempt ${attempt} failed for ${city.label} (${city.state}):`, err.message);
    }
    if (attempt === 1) await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}
