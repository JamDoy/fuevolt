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

// Fuel type mapping for various APIs
const FUEL_TYPE_MAP = {
  'E10': { nsw: 'E10', wa: '2' },
  'U91': { nsw: 'U91', wa: '1' },
  'U95': { nsw: 'P95', wa: '4' },
  'U98': { nsw: 'P98', wa: '6' },
  'Diesel': { nsw: 'DL', wa: '4' },
  'LPG': { nsw: 'LPG', wa: '5' },
};

// NSW Fuel API (also covers TAS) — uses trial key with 5 calls/min limit
const NSW_API_BASE = 'https://api.onegov.nsw.gov.au';
const NSW_API_KEY = '1MYSRAx5yvqHUZc6VGtxix6oMA2qgfRT';
const NSW_API_SECRET = 'BMvWacw15Et8uFGF';

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
        address: `${station.address || ''}, ${station.suburb || ''} ${station.state || 'NSW'} ${station.postcode || ''}`.trim(),
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
  // Determine which state the coordinates are in based on rough bounds
  const state = detectState(latitude, longitude);

  let results = null;

  // Try real APIs first based on state
  if (state === 'WA') {
    results = await fetchWAFuelPrices(latitude, longitude, fuelType);
  } else if (state === 'NSW' || state === 'TAS') {
    results = await fetchNSWFuelPrices(latitude, longitude, fuelType);
  }

  // Fallback to generated data for states without API access
  if (!results || results.length === 0) {
    results = generateFuelStations(latitude, longitude, fuelType, radius, state);
  }

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

function generateFuelStations(lat, lng, fuelType, radius, state) {
  const stations = [];
  const brands = ['Shell', 'BP', 'Caltex', '7-Eleven', 'United', 'Ampol', 'Costco', 'Metro', 'Liberty', 'Puma'];

  const basePrices = {
    'E10': 165, 'U91': 172, 'U95': 185, 'U98': 198,
    'Diesel': 178, 'LPG': 89,
  };

  const basePrice = basePrices[fuelType] || 172;
  const stateLabel = state || 'AU';

  for (let i = 0; i < 20; i++) {
    const offsetLat = (Math.random() - 0.5) * (radius / 55);
    const offsetLng = (Math.random() - 0.5) * (radius / 55);
    const price = basePrice + Math.floor(Math.random() * 30) - 10;
    const brand = brands[Math.floor(Math.random() * brands.length)];

    stations.push({
      id: `gen-${i}`,
      name: `${brand} Station`,
      brand,
      address: `${Math.floor(Math.random() * 500) + 1} Main Road, ${stateLabel}`,
      latitude: lat + offsetLat,
      longitude: lng + offsetLng,
      price: price / 100,
      priceDisplay: `${(price / 100).toFixed(1)}¢/L`,
      fuelType,
      lastUpdated: new Date(Date.now() - Math.random() * 3600000 * 6).toISOString(),
      distance: (Math.random() * radius).toFixed(1),
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
