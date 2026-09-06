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
// Live availability is keyed to TomTom's own charging-park ID, which only
// exists for stations TomTom knows about via its own Search API — Open
// Charge Map (the station list's source) has no such ID. findChargingParkId
// bridges the two: a tight-radius nearby search for the EV category (7309,
// same one used for Trip Planner's along-route charger search) at the OCM
// station's own coordinates, returning TomTom's ID for that same physical
// station when one exists. The mapping is stable (locations don't move), so
// callers should cache the result per station rather than re-searching.
const CHARGING_PARK_ID_CACHE = {};

// A tight match radius matters here — TomTom often returns other, genuinely
// different charging stations a few hundred metres away, and most of those
// don't carry availability data anyway (e.g. Tesla Superchargers never do,
// since Tesla doesn't share live status with TomTom). Only trust a match
// close enough to be confident it's the same physical station as the one
// being looked up, rather than surfacing a different nearby station's
// availability under the wrong charger.
const MATCH_DISTANCE_M = 75;

export async function findChargingParkId(lat, lng, searchRadius = 150) {
  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (cacheKey in CHARGING_PARK_ID_CACHE) return CHARGING_PARK_ID_CACHE[cacheKey];

  const params = new URLSearchParams({
    key: TOMTOM_KEY,
    lat: lat.toString(),
    lon: lng.toString(),
    radius: searchRadius.toString(),
    categorySet: '7309',
    limit: '5',
  });
  try {
    const res = await fetch(`${BASE}/search/2/nearbySearch/.json?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const match = (data.results || [])
      .filter((r) => r.dist <= MATCH_DISTANCE_M && r.dataSources?.chargingAvailability?.id)
      .sort((a, b) => a.dist - b.dist)[0];
    const id = match?.dataSources.chargingAvailability.id || null;
    CHARGING_PARK_ID_CACHE[cacheKey] = id;
    return id;
  } catch {
    return null;
  }
}

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

// Route via one or more intermediate stops (e.g. cheap-fuel detour stations),
// rather than a direct start-to-end line. TomTom's calculateRoute endpoint
// accepts any number of colon-separated waypoints.
export async function calculateRouteWithStops(startLat, startLng, stops, endLat, endLng) {
  const waypoints = [
    `${startLat},${startLng}`,
    ...stops.map((s) => `${s.latitude},${s.longitude}`),
    `${endLat},${endLng}`,
  ].join(':');

  const params = new URLSearchParams({
    key: TOMTOM_KEY,
    routeType: 'fastest',
    traffic: 'true',
    travelMode: 'car',
    instructionsType: 'text',
  });

  const res = await fetch(`${BASE}/routing/1/calculateRoute/${waypoints}/json?${params}`);
  if (!res.ok) throw new Error('Route calculation failed');
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route found');

  const points = (route.legs || []).flatMap((leg) => leg.points?.map((p) => [p.latitude, p.longitude]) || []);

  return {
    distanceKm: (route.summary.lengthInMeters / 1000).toFixed(1),
    travelTimeMin: Math.ceil(route.summary.travelTimeInSeconds / 60),
    trafficDelayMin: Math.ceil((route.summary.trafficDelayInSeconds || 0) / 60),
    points,
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
// Was pointed at the old v1 endpoint (/routing/1/matrix/json) with an
// options shape that endpoint doesn't accept — every call has always come
// back 400 and silently returned nulls (caught below), so every "Drive
// Time" sort in the app has quietly done nothing since it was added.
// Confirmed the correct v2 request/response shape live before fixing this.
export async function getDriveTimes(originLat, originLng, destinations) {
  if (!destinations.length) return [];

  // Matrix Routing v2 — batch up to 30 destinations
  const batch = destinations.slice(0, 30);
  const destPoints = batch.map((d) => ({
    point: { latitude: d.latitude, longitude: d.longitude },
  }));

  try {
    const res = await fetch(`${BASE}/routing/matrix/2?key=${TOMTOM_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origins: [{ point: { latitude: originLat, longitude: originLng } }],
        destinations: destPoints,
        options: {
          routeType: 'fastest',
          traffic: 'live',
          departAt: 'now',
        },
      }),
    });
    if (!res.ok) return batch.map(() => null);
    const data = await res.json();
    const results = batch.map(() => null);
    for (const cell of data.data || []) {
      if (!cell.routeSummary) continue;
      results[cell.destinationIndex] = {
        driveTimeMin: Math.ceil(cell.routeSummary.travelTimeInSeconds / 60),
        distanceKm: (cell.routeSummary.lengthInMeters / 1000).toFixed(1),
        trafficDelayMin: Math.ceil((cell.routeSummary.trafficDelayInSeconds || 0) / 60),
      };
    }
    return results;
  } catch {
    return batch.map(() => null);
  }
}

// --- Traffic Incidents ---
export async function getTrafficIncidents(lat, lng, radius = 10) {
  const delta = radius / 111;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;

  try {
    // "en-AU" is rejected by this endpoint ("Unsupported language parameter
    // value") — en-GB is the closest supported variant.
    const res = await fetch(
      `${BASE}/traffic/services/5/incidentDetails?key=${TOMTOM_KEY}&bbox=${bbox}&fields={incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description},startTime,endTime,from,to,length,delay,roadNumbers}}}&language=en-GB&timeValidityFilter=present`
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

// Samples several points along a route (same pattern as searchAlongRoute)
// and merges each point's nearby incidents, de-duplicated by incident id —
// a route's own trafficDelayInSeconds tells you HOW long the delay is, this
// tells you WHY (accident, roadworks, closure).
export async function getTrafficIncidentsAlongRoute(routePoints, maxResults = 10) {
  if (!routePoints || routePoints.length < 2) return [];

  const totalPoints = routePoints.length;
  const sampleCount = Math.min(6, Math.ceil(totalPoints / 40));
  const step = Math.max(1, Math.floor(totalPoints / (sampleCount + 1)));
  const sampleIndices = [0];
  for (let i = step; i < totalPoints - 1; i += step) {
    sampleIndices.push(i);
    if (sampleIndices.length >= sampleCount + 1) break;
  }
  sampleIndices.push(totalPoints - 1);

  const seen = new Set();
  const allIncidents = [];

  for (const idx of sampleIndices) {
    const [lat, lng] = routePoints[idx];
    const incidents = await getTrafficIncidents(lat, lng, 15);
    for (const inc of incidents) {
      if (!inc.id || seen.has(inc.id)) continue;
      seen.add(inc.id);
      allIncidents.push(inc);
    }
  }

  return allIncidents.sort((a, b) => b.delay - a.delay).slice(0, maxResults);
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
