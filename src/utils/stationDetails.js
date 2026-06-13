// Fetch detailed station info from OpenStreetMap Overpass API
// This gets amenity tags, opening hours, phone etc for a specific station

export async function fetchStationDetails(station) {
  const result = {
    opening_hours: null,
    phone: null,
    amenities: {
      toilets: 'unknown',
      car_wash: 'unknown',
      air_pump: 'unknown',
      shop: 'unknown',
      atm: 'unknown',
      ev_charging: 'unknown',
      wheelchair: 'unknown',
    },
  };

  try {
    // If we have the OSM ID, query directly. Otherwise search by location.
    const osmId = station.id?.startsWith('osm-') ? station.id.replace('osm-', '') : null;
    let query;

    if (osmId) {
      // Try both node and way
      query = `[out:json][timeout:10];(node(${osmId});way(${osmId}););out tags;`;
    } else {
      // Search by proximity for fuel stations
      const lat = station.latitude;
      const lng = station.longitude;
      query = `[out:json][timeout:10];(node["amenity"="fuel"](around:50,${lat},${lng});way["amenity"="fuel"](around:50,${lat},${lng}););out tags;`;
    }

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) return result;
    const data = await response.json();

    if (!data.elements || data.elements.length === 0) return result;

    // Use the first matching element's tags
    const tags = data.elements[0].tags || {};

    // Opening hours
    if (tags.opening_hours) {
      result.opening_hours = parseOpeningHours(tags.opening_hours);
    }

    // Phone
    if (tags.phone || tags['contact:phone']) {
      result.phone = tags.phone || tags['contact:phone'];
    }

    // Amenities from tags
    result.amenities.toilets = tags.toilets === 'yes' ? 'yes' :
      tags.toilets === 'no' ? 'no' : 'unknown';

    result.amenities.car_wash = tags.car_wash === 'yes' || tags['service:vehicle:car_wash'] === 'yes' ? 'yes' :
      tags.car_wash === 'no' ? 'no' : 'unknown';

    result.amenities.air_pump = tags.compressed_air === 'yes' || tags['service:vehicle:compressed_air'] === 'yes' ? 'yes' :
      tags.compressed_air === 'no' ? 'no' : 'unknown';

    result.amenities.shop = tags.shop === 'convenience' || tags.shop === 'yes' || tags.convenience === 'yes' ? 'yes' :
      tags.shop === 'no' ? 'no' : 'unknown';

    result.amenities.atm = tags.atm === 'yes' ? 'yes' :
      tags.atm === 'no' ? 'no' : 'unknown';

    result.amenities.ev_charging = tags['fuel:electricity'] === 'yes' || tags.ev_charging === 'yes' ? 'yes' :
      'unknown';

    result.amenities.wheelchair = tags.wheelchair === 'yes' ? 'yes' :
      tags.wheelchair === 'no' ? 'no' : 'unknown';

  } catch {
    // Overpass unavailable — return defaults
  }

  return result;
}

function parseOpeningHours(raw) {
  if (!raw) return null;
  if (raw === '24/7') return '24/7';

  // Try to parse OSM opening_hours format into structured data
  // Common formats: "Mo-Fr 06:00-22:00; Sa-Su 07:00-21:00"
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayMap = { Mo: 0, Tu: 1, We: 2, Th: 3, Fr: 4, Sa: 5, Su: 6 };

  try {
    const result = days.map(d => ({ day: d, hours: 'Closed' }));
    const parts = raw.split(';').map(s => s.trim());

    for (const part of parts) {
      const match = part.match(/^([A-Za-z,-]+)\s+(.+)$/);
      if (!match) continue;

      const dayRange = match[1];
      const hours = match[2];

      const dayIndices = parseDayRange(dayRange, dayMap);
      for (const idx of dayIndices) {
        if (idx >= 0 && idx < 7) {
          result[idx].hours = hours;
        }
      }
    }

    // If all say "Closed", just return the raw string
    if (result.every(r => r.hours === 'Closed')) return raw;
    return result;
  } catch {
    return raw;
  }
}

function parseDayRange(range, dayMap) {
  const indices = [];
  const segments = range.split(',');

  for (const seg of segments) {
    const trimmed = seg.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-');
      const startIdx = dayMap[start?.trim()?.slice(0, 2)];
      const endIdx = dayMap[end?.trim()?.slice(0, 2)];
      if (startIdx != null && endIdx != null) {
        for (let i = startIdx; i <= endIdx; i++) {
          indices.push(i);
        }
        // Handle wrap-around (Sa-Mo)
        if (endIdx < startIdx) {
          for (let i = startIdx; i < 7; i++) indices.push(i);
          for (let i = 0; i <= endIdx; i++) indices.push(i);
        }
      }
    } else {
      const idx = dayMap[trimmed.slice(0, 2)];
      if (idx != null) indices.push(idx);
    }
  }

  return indices;
}

// Fetch all fuel types for a given station from the NSW API
const NSW_API_BASE = 'https://api.onegov.nsw.gov.au';
const NSW_API_KEY = 'dwAE4MpeaMhNhZFsnzZesHKiQmG3e87z';
const NSW_API_SECRET = 'jrcoqUqm4WoxNMgW';

const FUEL_TYPES = ['E10', 'U91', 'U95', 'U98', 'Diesel', 'LPG'];
const FUEL_TYPE_NSW = {
  E10: 'E10', U91: 'U91', U95: 'P95', U98: 'P98', Diesel: 'DL', LPG: 'LPG',
};

async function getNSWToken() {
  try {
    const credentials = btoa(`${NSW_API_KEY}:${NSW_API_SECRET}`);
    const response = await fetch(`${NSW_API_BASE}/oauth/client_credential/accesstoken?grant_type=client_credentials`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${credentials}`, 'Content-Length': '0' },
      body: '',
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.access_token;
  } catch {
    return null;
  }
}

export async function fetchAllFuelPricesForStation(station) {
  const prices = {};

  // If it's an NSW/TAS station from govt API, fetch all fuel types
  const isNSW = station.source?.includes('NSW Government');
  const isWA = station.source?.includes('WA FuelWatch');

  if (isNSW) {
    try {
      const token = await getNSWToken();
      if (!token) {
        // Return just what we have
        if (station.price && station.fuelType) {
          prices[station.fuelType] = { price: station.price, lastUpdated: station.lastUpdated };
        }
        return prices;
      }

      // Fetch each fuel type for this location
      for (const type of FUEL_TYPES) {
        try {
          const nswCode = FUEL_TYPE_NSW[type];
          const response = await fetch(`${NSW_API_BASE}/FuelPriceCheck/v2/fuel/prices/nearby`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'apikey': NSW_API_KEY,
            },
            body: JSON.stringify({
              fueltype: nswCode,
              latitude: station.latitude.toString(),
              longitude: station.longitude.toString(),
              radius: '0.5',
              sortby: 'price',
              sortascending: 'true',
            }),
          });

          if (!response.ok) continue;
          const data = await response.json();

          if (data.prices && data.prices.length > 0) {
            // Find the price for THIS station (by name match or closest)
            const stationCode = station.id?.replace('nsw-', '').split('-')[0];
            const matchedPrice = data.prices.find(p => p.stationcode === stationCode) || data.prices[0];
            if (matchedPrice) {
              prices[type] = {
                price: matchedPrice.price / 100,
                lastUpdated: matchedPrice.lastupdated || new Date().toISOString(),
              };
            }
          }

          // Rate limit: small delay between requests
          await new Promise(r => setTimeout(r, 300));
        } catch {
          continue;
        }
      }
    } catch {
      // Fallback: return what we already have
    }
  } else if (isWA) {
    // For WA, we only have the one fuel type from the search
    if (station.price && station.fuelType) {
      prices[station.fuelType] = { price: station.price, lastUpdated: station.lastUpdated };
    }
  }

  // Always include the current search fuel type if we have it
  if (station.price && station.fuelType && !prices[station.fuelType]) {
    prices[station.fuelType] = { price: station.price, lastUpdated: station.lastUpdated };
  }

  return prices;
}
