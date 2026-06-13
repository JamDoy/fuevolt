const OCM_API_KEY = '1ce3a80b-61c0-40e2-97ed-45e81462eac9';
const OCM_BASE_URL = 'https://api.openchargemap.io/v3/poi/';

export async function fetchEVStations({ latitude, longitude, distance = 10, maxresults = 100 }) {
  const params = new URLSearchParams({
    output: 'json',
    countrycode: 'AU',
    key: OCM_API_KEY,
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    distance: distance.toString(),
    distanceunit: 'KM',
    maxresults: maxresults.toString(),
    compact: 'false',
    verbose: 'true',
  });

  const response = await fetch(`${OCM_BASE_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch EV stations: ${response.status}`);
  }
  return response.json();
}

const AU_CITIES = {
  sydney: { lat: -33.8688, lng: 151.2093, name: 'Sydney, NSW' },
  melbourne: { lat: -37.8136, lng: 144.9631, name: 'Melbourne, VIC' },
  brisbane: { lat: -27.4698, lng: 153.0251, name: 'Brisbane, QLD' },
  perth: { lat: -31.9505, lng: 115.8605, name: 'Perth, WA' },
  adelaide: { lat: -34.9285, lng: 138.6007, name: 'Adelaide, SA' },
  canberra: { lat: -35.2809, lng: 149.1300, name: 'Canberra, ACT' },
  hobart: { lat: -42.8821, lng: 147.3272, name: 'Hobart, TAS' },
  darwin: { lat: -12.4634, lng: 130.8456, name: 'Darwin, NT' },
  'gold coast': { lat: -28.0167, lng: 153.4000, name: 'Gold Coast, QLD' },
  newcastle: { lat: -32.9283, lng: 151.7817, name: 'Newcastle, NSW' },
  wollongong: { lat: -34.4248, lng: 150.8931, name: 'Wollongong, NSW' },
  geelong: { lat: -38.1499, lng: 144.3617, name: 'Geelong, VIC' },
  cairns: { lat: -16.9186, lng: 145.7781, name: 'Cairns, QLD' },
  townsville: { lat: -19.2590, lng: 146.8169, name: 'Townsville, QLD' },
  parramatta: { lat: -33.8151, lng: 151.0011, name: 'Parramatta, NSW' },
  penrith: { lat: -33.7507, lng: 150.6944, name: 'Penrith, NSW' },
  liverpool: { lat: -33.9200, lng: 150.9236, name: 'Liverpool, NSW' },
  bondi: { lat: -33.8914, lng: 151.2743, name: 'Bondi, NSW' },
  manly: { lat: -33.7969, lng: 151.2844, name: 'Manly, NSW' },
  cronulla: { lat: -34.0587, lng: 151.1515, name: 'Cronulla, NSW' },
  chatswood: { lat: -33.7969, lng: 151.1832, name: 'Chatswood, NSW' },
  surry_hills: { lat: -33.8830, lng: 151.2113, name: 'Surry Hills, NSW' },
};

export async function geocodeLocation(query) {
  const key = query.trim().toLowerCase();
  const local = AU_CITIES[key];
  if (local) {
    return { latitude: local.lat, longitude: local.lng, displayName: local.name };
  }

  const params = new URLSearchParams({
    q: `${query}, Australia`,
    format: 'json',
    limit: '1',
    countrycodes: 'au',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'FueVolt/1.0' },
  });
  if (!response.ok) {
    throw new Error('Geocoding failed');
  }
  const results = await response.json();
  if (results.length === 0) {
    throw new Error('Location not found');
  }
  return {
    latitude: parseFloat(results[0].lat),
    longitude: parseFloat(results[0].lon),
    displayName: results[0].display_name,
  };
}

// --- Fuel price cache (4 refreshes per day = every 6 hours) ---
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function getCacheKey(state, fuelType, lat, lng) {
  // Snap coordinates to ~11km grid so nearby searches share the cache
  const gridLat = (Math.round(lat * 10) / 10).toFixed(1);
  const gridLng = (Math.round(lng * 10) / 10).toFixed(1);
  return `fuevolt_fuel_${state}_${fuelType}_${gridLat}_${gridLng}`;
}

function getCachedPrices(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return cached;
  } catch {
    return null;
  }
}

function setCachedPrices(key, stations) {
  try {
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      stations,
    }));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

function formatCacheAge(timestamp) {
  const mins = Math.floor((Date.now() - timestamp) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

// Fuel type mapping for various APIs
const FUEL_TYPE_MAP = {
  'E10': { nsw: 'E10', wa: '2' },
  'U91': { nsw: 'U91', wa: '1' },
  'U95': { nsw: 'P95', wa: '4' },
  'U98': { nsw: 'P98', wa: '6' },
  'Diesel': { nsw: 'DL', wa: '4' },
  'LPG': { nsw: 'LPG', wa: '5' },
};

// NSW Fuel API (also covers TAS) — registered Motor API (2,500 calls/month)
const NSW_API_BASE = 'https://api.onegov.nsw.gov.au';
const NSW_API_KEY = 'dwAE4MpeaMhNhZFsnzZesHKiQmG3e87z';
const NSW_API_SECRET = 'jrcoqUqm4WoxNMgW';

async function getNSWToken() {
  try {
    const credentials = btoa(`${NSW_API_KEY}:${NSW_API_SECRET}`);
    const response = await fetch(`${NSW_API_BASE}/oauth/client_credential/accesstoken?grant_type=client_credentials`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Length': '0',
      },
      body: '',
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (!text) return null;
    const data = JSON.parse(text);
    return data.access_token;
  } catch {
    return null;
  }
}

async function fetchNSWFuelPrices(latitude, longitude, fuelType) {
  try {
    const token = await getNSWToken();
    if (!token) return null;

    const nswCode = FUEL_TYPE_MAP[fuelType]?.nsw || 'E10';
    const response = await fetch(`${NSW_API_BASE}/FuelPriceCheck/v2/fuel/prices/nearby`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': NSW_API_KEY,
      },
      body: JSON.stringify({
        fueltype: nswCode,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: '10',
        sortby: 'price',
        sortascending: 'true',
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();

    if (!data.stations || !data.prices) return null;

    const stationMap = {};
    data.stations.forEach((s) => {
      stationMap[s.code] = s;
    });

    return data.prices.map((p, i) => {
      const station = stationMap[p.stationcode] || {};
      return {
        id: `nsw-${p.stationcode}-${i}`,
        name: station.name || (station.brand ? `${station.brand} Station` : 'Fuel Station'),
        brand: station.brand || 'Independent',
        address: [station.address, station.suburb, `${station.state || 'NSW'} ${station.postcode || ''}`].filter(Boolean).join(', ').trim(),
        latitude: station.location?.latitude || latitude,
        longitude: station.location?.longitude || longitude,
        price: p.price / 100,
        priceDisplay: `${p.price.toFixed(1)}¢/L`,
        fuelType: nswCode,
        lastUpdated: p.lastupdated || new Date().toISOString(),
        distance: station.distance || '—',
        source: 'NSW Government',
      };
    });
  } catch {
    return null;
  }
}

// WA FuelWatch RSS feed — completely free, no auth required
async function fetchWAFuelPrices(latitude, longitude, fuelType) {
  try {
    const waProduct = FUEL_TYPE_MAP[fuelType]?.wa || '1';
    const url = `https://www.fuelwatch.wa.gov.au/fuelwatch/fuelWatchRSS?Product=${waProduct}&Day=today`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const items = doc.querySelectorAll('item');

    if (items.length === 0) return null;

    const stations = [];
    items.forEach((item, i) => {
      const price = parseFloat(item.querySelector('price')?.textContent || '0');
      const stationLat = parseFloat(item.querySelector('latitude')?.textContent || '0');
      const stationLng = parseFloat(item.querySelector('longitude')?.textContent || '0');
      const name = item.querySelector('trading-name')?.textContent || '';
      const brand = item.querySelector('brand')?.textContent || '';
      const address = item.querySelector('address')?.textContent || '';
      const suburb = item.querySelector('location')?.textContent || '';

      if (price > 0) {
        const dist = getDistance(latitude, longitude, stationLat, stationLng);
        stations.push({
          id: `wa-${i}`,
          name: name || `${brand} ${suburb}`,
          brand: brand || 'Unknown',
          address: `${address}, ${suburb} WA`,
          latitude: stationLat,
          longitude: stationLng,
          price: price / 100,
          priceDisplay: `${price.toFixed(1)}¢/L`,
          fuelType,
          lastUpdated: new Date().toISOString(),
          distance: dist.toFixed(1),
          source: 'WA FuelWatch',
        });
      }
    });

    // Sort by distance from search location and return nearest 30
    return stations
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
      .slice(0, 30);
  } catch {
    return null;
  }
}

// Haversine distance in km
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchFuelPrices({ latitude, longitude, fuelType = 'U91', radius = 10 }) {
  const state = detectState(latitude, longitude);
  const cacheKey = getCacheKey(state, fuelType, latitude, longitude);
  // Check cache first — serves cached data within the 6-hour window
  const cached = getCachedPrices(cacheKey);
  if (cached) {
    const age = formatCacheAge(cached.timestamp);
    const results = cached.stations.map((s) => ({
      ...s,
      source: s.source.replace(/ \(updated .*\)$/, '') + ` (updated ${age})`,
    }));
    return results.sort((a, b) => a.price - b.price);
  }

  // Cache miss or expired — fetch fresh data from API
  let results = null;

  if (state === 'WA') {
    results = await fetchWAFuelPrices(latitude, longitude, fuelType);
  } else if (state === 'NSW' || state === 'TAS') {
    results = await fetchNSWFuelPrices(latitude, longitude, fuelType);
  }

  // Fallback: fetch real station locations from OpenStreetMap, with estimated prices
  if (!results || results.length === 0) {
    results = await fetchRealFuelStations(latitude, longitude, radius, fuelType, state);
  }

  // Last resort fallback if Overpass also fails
  if (!results || results.length === 0) {
    results = await generateFallbackStations(latitude, longitude, fuelType, radius, state);
  }

  // Cache the fresh results
  setCachedPrices(cacheKey, results);

  return results.sort((a, b) => a.price - b.price);
}

function detectState(lat, lng) {
  // Rough bounding boxes for Australian states
  if (lat > -29 && lat < -10 && lng > 138 && lng < 154) return 'QLD';
  if (lat > -37.5 && lat < -28 && lng > 141 && lng < 154) return 'NSW';
  if (lat > -39.2 && lat < -34 && lng > 141 && lng < 150) return 'VIC';
  if (lat > -38 && lat < -26 && lng > 129 && lng < 141) return 'SA';
  if (lat > -35.5 && lat < -13.5 && lng > 112 && lng < 129) return 'WA';
  if (lat > -44 && lat < -40 && lng > 144 && lng < 149) return 'TAS';
  if (lat > -26 && lat < -11 && lng > 129 && lng < 138) return 'NT';
  if (lat > -35.9 && lat < -35.1 && lng > 148.7 && lng < 149.4) return 'ACT';
  return 'NSW'; // Default fallback
}

const AU_STATE_ABBR = {
  'New South Wales': 'NSW', 'Victoria': 'VIC', 'Queensland': 'QLD',
  'Western Australia': 'WA', 'South Australia': 'SA', 'Tasmania': 'TAS',
  'Northern Territory': 'NT', 'Australian Capital Territory': 'ACT',
};

// --- Permanent address cache (persists across sessions) ---
const ADDR_CACHE_KEY = 'fuevolt_address_cache';

function getAddressCache() {
  try {
    return JSON.parse(localStorage.getItem(ADDR_CACHE_KEY)) || {};
  } catch { return {}; }
}

function setAddressCache(cache) {
  try { localStorage.setItem(ADDR_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

function coordKey(lat, lng) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

// Reverse geocode a single coordinate to get a street address
async function reverseGeocode(lat, lng) {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      zoom: '18',
      addressdetails: '1',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { 'User-Agent': 'FueVolt/1.0' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.address) return null;
    const a = data.address;
    const road = a.road || a.pedestrian || a.footway || '';
    const houseNumber = a.house_number || '';
    const suburb = a.suburb || a.neighbourhood || a.town || a.city || '';
    const postcode = a.postcode || '';
    const stateAbbr = AU_STATE_ABBR[a.state] || a.state || '';
    return { road, houseNumber, suburb, postcode, state: stateAbbr };
  } catch {
    return null;
  }
}

function formatGeoAddress(geo) {
  let addr = '';
  if (geo.houseNumber && geo.road) {
    addr = `${geo.houseNumber} ${geo.road}`;
  } else if (geo.road) {
    addr = geo.road;
  }
  if (geo.suburb) addr += addr ? `, ${geo.suburb}` : geo.suburb;
  if (geo.state) addr += ` ${geo.state}`;
  if (geo.postcode) addr += ` ${geo.postcode}`;
  return addr.trim();
}

// Fetch real fuel station locations from OpenStreetMap Overpass API
async function fetchRealFuelStations(lat, lng, radius, fuelType, state) {
  try {
    const radiusM = radius * 1000;
    const query = `[out:json][timeout:10];(node["amenity"="fuel"](around:${radiusM},${lat},${lng});way["amenity"="fuel"](around:${radiusM},${lat},${lng}););out center 30;`;
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.elements || data.elements.length === 0) return null;

    const basePrices = {
      'E10': 165, 'U91': 172, 'U95': 185, 'U98': 198,
      'Diesel': 178, 'LPG': 89,
    };
    const basePrice = basePrices[fuelType] || 172;
    const stateLabel = state || 'AU';

    const stations = data.elements.map((el, i) => {
      const stationLat = el.lat || el.center?.lat;
      const stationLng = el.lon || el.center?.lon;
      if (!stationLat || !stationLng) return null;

      const tags = el.tags || {};
      const brand = tags.brand || tags.operator || '';
      const rawName = tags.name || '';
      const name = rawName || brand || 'Fuel Station';
      const houseNum = tags['addr:housenumber'] || '';
      const street = tags['addr:street'] || '';
      const suburb = tags['addr:suburb'] || tags['addr:city'] || '';
      const postcode = tags['addr:postcode'] || '';

      let address = '';
      let needsGeocode = false;
      if (houseNum && street) {
        address = `${houseNum} ${street}`;
      } else if (street) {
        address = street;
      }
      if (suburb) address += address ? `, ${suburb}` : suburb;
      if (stateLabel) address += ` ${stateLabel}`;
      if (postcode) address += ` ${postcode}`;
      if (!street && !suburb) {
        address = stateLabel;
        needsGeocode = true;
      }

      const price = basePrice + Math.floor(Math.random() * 30) - 10;
      const dist = getDistance(lat, lng, stationLat, stationLng);

      return {
        id: `osm-${el.id || i}`,
        name,
        brand: brand || 'Independent',
        address,
        _hasRealName: !!(rawName || brand),
        latitude: stationLat,
        longitude: stationLng,
        price: price / 100,
        priceDisplay: `${(price / 100).toFixed(1)}¢/L`,
        fuelType,
        lastUpdated: new Date().toISOString(),
        distance: dist.toFixed(1),
        source: `Real Location (${stateLabel} — prices are estimates)`,
        _needsGeocode: needsGeocode,
      };
    }).filter(Boolean);

    if (stations.length === 0) return null;

    // Apply any cached addresses immediately
    applyCachedAddresses(stations);

    return stations;
  } catch {
    return null;
  }
}

// Fallback if Overpass API fails
async function generateFallbackStations(lat, lng, fuelType, radius, state) {
  const brands = ['Shell', 'BP', 'Caltex', '7-Eleven', 'United', 'Ampol'];
  const basePrices = {
    'E10': 165, 'U91': 172, 'U95': 185, 'U98': 198,
    'Diesel': 178, 'LPG': 89,
  };
  const basePrice = basePrices[fuelType] || 172;
  const stateLabel = state || 'AU';

  const stations = Array.from({ length: 10 }, (_, i) => {
    const angle = Math.random() * 2 * Math.PI;
    const dist = Math.sqrt(Math.random()) * radius;
    const offsetLat = (dist / 111) * Math.cos(angle);
    const offsetLng = (dist / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
    const brand = brands[i % brands.length];
    const price = basePrice + Math.floor(Math.random() * 30) - 10;

    return {
      id: `gen-${i}`,
      name: `${brand} Station`,
      brand,
      address: stateLabel,
      _needsGeocode: true,
      latitude: lat + offsetLat,
      longitude: lng + offsetLng,
      price: price / 100,
      priceDisplay: `${(price / 100).toFixed(1)}¢/L`,
      fuelType,
      lastUpdated: new Date().toISOString(),
      distance: dist.toFixed(1),
      source: `Approximate (${stateLabel})`,
    };
  });

  applyCachedAddresses(stations);
  return stations;
}

// Apply only cached addresses (no API calls)
function applyCachedAddresses(stations) {
  const addrCache = getAddressCache();
  stations.forEach((s) => {
    if (!s._needsGeocode) return;
    const key = coordKey(s.latitude, s.longitude);
    if (addrCache[key]) {
      s.address = addrCache[key];
      delete s._needsGeocode;
    }
  });
}

// Background geocode: resolves addresses one at a time and calls onUpdate after each.
export async function geocodeStationAddresses(stations, onUpdate) {
  const addrCache = getAddressCache();
  const needsGeocode = stations.filter((s) => s._needsGeocode);
  if (needsGeocode.length === 0) return;

  let hitApi = false;
  let consecutiveFails = 0;

  for (let i = 0; i < needsGeocode.length; i++) {
    const station = needsGeocode[i];
    const key = coordKey(station.latitude, station.longitude);

    if (addrCache[key]) {
      station.address = addrCache[key];
      delete station._needsGeocode;
      continue;
    }

    if (consecutiveFails >= 3) {
      delete station._needsGeocode;
      continue;
    }

    if (hitApi) {
      await new Promise((r) => setTimeout(r, 1100));
    }

    const geo = await reverseGeocode(station.latitude, station.longitude);
    hitApi = true;

    if (geo) {
      consecutiveFails = 0;
      const addr = formatGeoAddress(geo);
      if (addr) {
        station.address = addr;
        addrCache[key] = addr;
        // Improve generic station names with suburb
        if (!station._hasRealName && geo.suburb) {
          station.name = `Fuel Station, ${geo.suburb}`;
        }
        if (onUpdate) onUpdate([...stations]);
      }
    } else {
      consecutiveFails++;
    }
    delete station._needsGeocode;
  }

  setAddressCache(addrCache);
  if (onUpdate) onUpdate([...stations]);
}

export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
