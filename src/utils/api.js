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

export async function geocodeLocation(query) {
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
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
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
        name: station.name || 'Unknown Station',
        brand: station.brand || 'Unknown',
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

  // Fallback to generated data for states without API access
  if (!results || results.length === 0) {
    results = generateFuelStations(latitude, longitude, fuelType, radius, state);
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

async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'FueVolt/1.0' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const a = data.address || {};
    const road = a.road || a.pedestrian || a.footway || '';
    const suburb = a.suburb || a.town || a.city_district || a.village || '';
    const postcode = a.postcode || '';
    const stateAbbr = a.state || '';
    return { road, suburb, postcode, state: stateAbbr };
  } catch {
    return null;
  }
}

async function generateFuelStations(lat, lng, fuelType, radius, state) {
  const stations = [];
  const brands = ['Shell', 'BP', 'Caltex', '7-Eleven', 'United', 'Ampol', 'Costco', 'Metro', 'Liberty', 'Puma'];

  const basePrices = {
    'E10': 165, 'U91': 172, 'U95': 185, 'U98': 198,
    'Diesel': 178, 'LPG': 89,
  };

  const basePrice = basePrices[fuelType] || 172;
  const stateLabel = state || 'AU';

  // Generate station coordinates first
  const stationCoords = [];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const dist = Math.sqrt(Math.random()) * radius;
    const offsetLat = (dist / 111) * Math.cos(angle);
    const offsetLng = (dist / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
    stationCoords.push({ lat: lat + offsetLat, lng: lng + offsetLng, dist: dist.toFixed(1) });
  }

  // Reverse geocode the search center for a suburb name fallback
  const centerGeo = await reverseGeocode(lat, lng);
  const fallbackSuburb = centerGeo?.suburb || '';
  const fallbackPostcode = centerGeo?.postcode || '';
  const fallbackState = centerGeo?.state || stateLabel;

  // Batch reverse geocode a few stations for varied suburb names
  const sampleIndices = [0, 4, 8, 12, 16].filter((i) => i < stationCoords.length);
  const geoResults = await Promise.all(
    sampleIndices.map((i) => reverseGeocode(stationCoords[i].lat, stationCoords[i].lng))
  );

  const suburbPool = geoResults
    .filter(Boolean)
    .map((g) => ({ suburb: g.suburb, postcode: g.postcode, road: g.road, state: g.state }));

  const streets = [
    'Pacific Highway', 'Parramatta Road', 'Victoria Road', 'Great Western Highway',
    'Princes Highway', 'Canterbury Road', 'King Street', 'George Street',
    'Station Street', 'Main Street', 'High Street', 'Church Street',
    'Oxford Street', 'Cleveland Street', 'Military Road', 'Anzac Parade',
    'Pittwater Road', 'Mona Vale Road', 'Pennant Hills Road', 'Lane Cove Road',
  ];

  for (let i = 0; i < 20; i++) {
    const coord = stationCoords[i];
    const price = basePrice + Math.floor(Math.random() * 30) - 10;
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const streetNum = Math.floor(Math.random() * 800) + 1;

    // Pick suburb info from reverse-geocoded samples or fallback
    const geo = suburbPool.length > 0
      ? suburbPool[i % suburbPool.length]
      : { suburb: fallbackSuburb, postcode: fallbackPostcode, road: '', state: fallbackState };
    const road = geo.road || streets[i % streets.length];
    const suburb = geo.suburb || fallbackSuburb || stateLabel;
    const postcode = geo.postcode || fallbackPostcode;

    stations.push({
      id: `gen-${i}`,
      name: `${brand} ${suburb}`,
      brand,
      address: `${streetNum} ${road}, ${suburb} ${stateLabel} ${postcode}`.trim(),
      latitude: coord.lat,
      longitude: coord.lng,
      price: price / 100,
      priceDisplay: `${(price / 100).toFixed(1)}¢/L`,
      fuelType,
      lastUpdated: new Date(Date.now() - Math.random() * 3600000 * 6).toISOString(),
      distance: coord.dist,
      source: `Sample Data (${stateLabel} — register for real data)`,
    });
  }

  return stations;
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
