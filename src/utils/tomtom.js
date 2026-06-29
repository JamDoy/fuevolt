const TOMTOM_KEY = 'ifJYQYlpFE1PVrOY9yhoXrjxN2UPN4Kd';
const BASE = 'https://api.tomtom.com';

// Note: TomTom Map Display tile API quota exhausted (403). Using OpenStreetMap tiles instead.
// TomTom Search, Routing, and Geocoding APIs still active below.

// --- Geocoding ---
export async function geocode(query) {
  const params = new URLSearchParams({
    key: TOMTOM_KEY,
    query: `${query}, Australia`,
    countrySet: 'AU',
    limit: '1',
    typeahead: 'true',
  });
  const res = await fetch(`${BASE}/search/2/geocode/${encodeURIComponent(query + ', Australia')}.json?${params}`);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  if (!data.results?.length) throw new Error('Location not found');
  const r = data.results[0];
  return {
    latitude: r.position.lat,
    longitude: r.position.lon,
    displayName: r.address?.freeformAddress || query,
  };
}

export async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `${BASE}/search/2/reverseGeocode/${lat},${lng}.json?key=${TOMTOM_KEY}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const addr = data.addresses?.[0]?.address;
  if (!addr) return null;
  return {
    suburb: addr.municipalitySubdivision || addr.municipality || '',
    road: addr.streetName || '',
    houseNumber: addr.streetNumber || '',
    postcode: addr.postalCode || '',
    state: addr.countrySubdivision || '',
    full: addr.freeformAddress || '',
  };
}

// --- Autocomplete / Typeahead Search ---
export async function autocompleteSearch(query) {
  if (!query || query.length < 2) return [];
  const params = new URLSearchParams({
    key: TOMTOM_KEY,
    typeahead: 'true',
    limit: '5',
    countrySet: 'AU',
    language: 'en-AU',
  });
  try {
    const res = await fetch(`${BASE}/search/2/search/${encodeURIComponent(query)}.json?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((r) => ({
      label: r.address?.freeformAddress || r.poi?.name || query,
      latitude: r.position?.lat,
      longitude: r.position?.lon,
      type: r.type,
    }));
  } catch {
    return [];
  }
}

// --- Search along route (fuel stations / EV chargers near route points) ---
export async function searchAlongRoute(routePoints, category = '7311', maxResults = 20) {
  if (!routePoints || routePoints.length < 2) return [];

  // Sample points along the route at regular intervals
  const totalPoints = routePoints.length;
  const sampleCount = Math.min(8, Math.ceil(totalPoints / 30));
  const step = Math.max(1, Math.floor(totalPoints / (sampleCount + 1)));
  const sampleIndices = [];
  for (let i = step; i < totalPoints - 1; i += step) {
    sampleIndices.push(i);
    if (sampleIndices.length >= sampleCount) break;
  }

  const seen = new Set();
  const allResults = [];

  for (const idx of sampleIndices) {
    const [lat, lng] = routePoints[idx];
    const params = new URLSearchParams({
      key: TOMTOM_KEY,
      lat: lat.toString(),
      lon: lng.toString(),
      radius: '10000',
      categorySet: category,
      limit: '10',
    });
    try {
      const res = await fetch(`${BASE}/search/2/nearbySearch/.json?${params}`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const r of (data.results || [])) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        allResults.push({
          id: r.id,
          name: r.poi?.name || 'Station',
          brand: r.poi?.brands?.[0]?.name || '',
          address: r.address?.freeformAddress || '',
          latitude: r.position?.lat,
          longitude: r.position?.lon,
          phone: r.poi?.phone || '',
          categories: r.poi?.categories || [],
          distance: r.dist ? (r.dist / 1000).toFixed(1) : '—',
          chargingParkId: r.dataSources?.chargingAvailability?.id || null,
        });
      }
    } catch {
      // continue with next sample point
    }
  }

  return allResults.slice(0, maxResults);
}

// --- Search (fuel stations via TomTom POI search) ---
export async function searchFuelStations(lat, lng, radius = 10000) {
  const params = new URLSearchParams({
    key: TOMTOM_KEY,
    lat: lat.toString(),
    lon: lng.toString(),
    radius: radius.toString(),
    categorySet: '7311',
    limit: '50',
  });
  const res = await fetch(`${BASE}/search/2/nearbySearch/.json?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map((r) => ({
    id: r.id,
    name: r.poi?.name || 'Fuel Station',
    brand: r.poi?.brands?.[0]?.name || '',
    address: r.address?.freeformAddress || '',
    latitude: r.position?.lat,
    longitude: r.position?.lon,
    phone: r.poi?.phone || '',
    openingHours: r.poi?.openingHours?.timeRanges || null,
    categories: r.poi?.categories || [],
    distance: r.dist ? (r.dist / 1000).toFixed(1) : '—',
  }));
}

// --- EV Charging Availability ---
const EV_AVAIL_CACHE = {};
const EV_AVAIL_TTL = 2 * 60 * 1000; // 2 minutes

export async function fetchEVAvailability(chargingParkId) {
  const cached = EV_AVAIL_CACHE[chargingParkId];
  if (cached && Date.now() - cached.ts < EV_AVAIL_TTL) return cached.data;

  try {
    const res = await fetch(
      `${BASE}/search/2/chargingAvailability.json?key=${TOMTOM_KEY}&chargingAvailability=${chargingParkId}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const connectors = data.connectors || [];
    const result = {
      available: connectors.reduce((n, c) => n + (c.availability?.current?.available || 0), 0),
      occupied: connectors.reduce((n, c) => n + (c.availability?.current?.occupied || 0), 0),
      outOfService: connectors.reduce((n, c) => n + (c.availability?.current?.outOfService || 0), 0),
      total: connectors.reduce((n, c) => n + (c.availability?.current?.available || 0) + (c.availability?.current?.occupied || 0) + (c.availability?.current?.outOfService || 0), 0),
      connectors,
    };
    EV_AVAIL_CACHE[chargingParkId] = { ts: Date.now(), data: result };
    return result;
  } catch {
    return null;
  }
}

// --- Routing ---
export async function calculateRoute(startLat, startLng, endLat, endLng, options = {}) {
  const params = new URLSearchParams({
    key: TOMTOM_KEY,
    routeType: options.routeType || 'fastest',
    traffic: 'true',
    travelMode: options.travelMode || 'car',
    instructionsType: 'text',
  });

  const res = await fetch(
    `${BASE}/routing/1/calculateRoute/${startLat},${startLng}:${endLat},${endLng}/json?${params}`
  );
  if (!res.ok) throw new Error('Route calculation failed');
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route found');

  return {
    distanceKm: (route.summary.lengthInMeters / 1000).toFixed(1),
    travelTimeMin: Math.ceil(route.summary.travelTimeInSeconds / 60),
    trafficDelayMin: Math.ceil((route.summary.trafficDelayInSeconds || 0) / 60),
    departureTime: route.summary.departureTime,
    arrivalTime: route.summary.arrivalTime,
    points: route.legs?.[0]?.points?.map((p) => [p.latitude, p.longitude]) || [],
    instructions: route.guidance?.instructions || [],
  };
}

// --- EV Routing (Extended Routing API) ---
export async function calculateEVRoute(startLat, startLng, endLat, endLng, evOptions = {}) {
  const battery = evOptions.batteryCapacityKWh || 60;
  const currentCharge = evOptions.currentChargeKWh || battery * 0.8;
  const consumption = evOptions.consumptionKWhPer100km || 15;

  const body = {
    origins: [{ point: { latitude: startLat, longitude: startLng } }],
    destinations: [{ point: { latitude: endLat, longitude: endLng } }],
    options: {
      routeType: 'fastest',
      traffic: 'live',
      travelMode: 'car',
      vehicleEngineType: 'electric',
      constantSpeedConsumptionInkWhPerHundredkm: `${consumption}`,
      currentChargeInkWh: currentCharge.toString(),
      maxChargeInkWh: battery.toString(),
      minChargeAtDestinationInkWh: (battery * 0.1).toString(),
    },
  };

  try {
    const res = await fetch(
      `${BASE}/routing/1/calculateRoute/${startLat},${startLng}:${endLat},${endLng}/json?key=${TOMTOM_KEY}&vehicleEngineType=electric&constantSpeedConsumptionInkWhPerHundredkm=0,${consumption}:100,${consumption}&currentChargeInkWh=${currentCharge}&maxChargeInkWh=${battery}&traffic=true&routeType=fastest`
    );
    if (!res.ok) throw new Error('EV route calculation failed');
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) throw new Error('No EV route found');

    const distKm = route.summary.lengthInMeters / 1000;
    const energyUsed = distKm * consumption / 100;
    const chargeAtDest = Math.max(0, currentCharge - energyUsed);

    return {
      distanceKm: distKm.toFixed(1),
      travelTimeMin: Math.ceil(route.summary.travelTimeInSeconds / 60),
      batteryAtStart: Math.round((currentCharge / battery) * 100),
      batteryAtDest: Math.round((chargeAtDest / battery) * 100),
      energyUsedKWh: energyUsed.toFixed(1),
      chargingStopsNeeded: chargeAtDest < battery * 0.1 ? Math.ceil((energyUsed - currentCharge + battery * 0.1) / (battery * 0.7)) : 0,
      points: route.legs?.[0]?.points?.map((p) => [p.latitude, p.longitude]) || [],
    };
  } catch {
    return null;
  }
}

// --- Matrix Routing (drive time sorting) ---
export async function getDriveTimes(originLat, originLng, destinations) {
  if (!destinations.length) return [];

  // TomTom Matrix Routing v2 — batch up to 30 destinations
  const batch = destinations.slice(0, 30);
  const destPoints = batch.map((d) => ({
    point: { latitude: d.latitude, longitude: d.longitude },
  }));

  try {
    const res = await fetch(`${BASE}/routing/1/matrix/json?key=${TOMTOM_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origins: [{ point: { latitude: originLat, longitude: originLng } }],
        destinations: destPoints,
        options: {
          routeType: 'fastest',
          traffic: 'live',
          travelMode: 'car',
        },
      }),
    });
    if (!res.ok) return batch.map(() => null);
    const data = await res.json();
    const cells = data.matrix?.[0] || [];
    return cells.map((cell) =>
      cell?.response?.routeSummary
        ? {
            driveTimeMin: Math.ceil(cell.response.routeSummary.travelTimeInSeconds / 60),
            distanceKm: (cell.response.routeSummary.lengthInMeters / 1000).toFixed(1),
            trafficDelayMin: Math.ceil((cell.response.routeSummary.trafficDelayInSeconds || 0) / 60),
          }
        : null
    );
  } catch {
    return batch.map(() => null);
  }
}

// --- Traffic Incidents ---
export async function getTrafficIncidents(lat, lng, radius = 10) {
  const delta = radius / 111;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;

  try {
    const res = await fetch(
      `${BASE}/traffic/services/5/incidentDetails?key=${TOMTOM_KEY}&bbox=${bbox}&fields={incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description},startTime,endTime,from,to,length,delay,roadNumbers}}}&language=en-AU&timeValidityFilter=present`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.incidents || []).map((inc) => ({
      id: inc.properties?.id,
      type: inc.type,
      category: inc.properties?.iconCategory,
      description: inc.properties?.events?.[0]?.description || 'Traffic incident',
      from: inc.properties?.from || '',
      to: inc.properties?.to || '',
      delay: inc.properties?.delay ? Math.ceil(inc.properties.delay / 60) : 0,
      coordinates: inc.geometry?.coordinates || [],
    }));
  } catch {
    return [];
  }
}

// --- Geofencing ---
const GEOFENCE_KEY = 'fuevolt_geofences';

export function getSavedGeofences() {
  try {
    return JSON.parse(localStorage.getItem(GEOFENCE_KEY)) || [];
  } catch { return []; }
}

export function saveGeofence(station) {
  const fences = getSavedGeofences();
  if (fences.some((f) => f.id === station.id)) return;
  fences.push({
    id: station.id,
    name: station.name,
    latitude: station.latitude,
    longitude: station.longitude,
    radiusM: 2000,
    type: station.type || 'fuel',
  });
  localStorage.setItem(GEOFENCE_KEY, JSON.stringify(fences));
}

export function removeGeofence(stationId) {
  const fences = getSavedGeofences().filter((f) => f.id !== stationId);
  localStorage.setItem(GEOFENCE_KEY, JSON.stringify(fences));
}

export function checkGeofences(lat, lng) {
  const fences = getSavedGeofences();
  const R = 6371000;
  return fences.filter((f) => {
    const dLat = (f.latitude - lat) * Math.PI / 180;
    const dLng = (f.longitude - lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat * Math.PI / 180) * Math.cos(f.latitude * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return dist <= f.radiusM;
  });
}

// --- Notifications (localStorage-based alerts) ---
const NOTIF_KEY = 'fuevolt_notifications';
const NOTIF_PREFS_KEY = 'fuevolt_notif_prefs';

export function getNotifications() {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY)) || [];
  } catch { return []; }
}

export function addNotification(notif) {
  const notifs = getNotifications();
  notifs.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notif,
  });
  if (notifs.length > 50) notifs.length = 50;
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
  return notifs;
}

export function markNotificationRead(id) {
  const notifs = getNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
}

export function getNotifPrefs() {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY)) || {
      priceDrops: true,
      chargerAvailability: true,
      trafficIncidents: false,
    };
  } catch {
    return { priceDrops: true, chargerAvailability: true, trafficIncidents: false };
  }
}

export function setNotifPrefs(prefs) {
  localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
}

export { TOMTOM_KEY };
