// Builds a link that re-runs the same nearby search live when opened, then
// jumps straight to the shared station — rather than sharing the current
// page's URL, which carries no information about which station or search
// the sharer was actually looking at.
export function buildFuelStationShareUrl(station) {
  const params = new URLSearchParams({
    lat: String(station.latitude),
    lng: String(station.longitude),
    fuel: station.fuelType || '',
    station: String(station.id),
  });
  return `${window.location.origin}/fuel-prices?${params.toString()}`;
}

// Shares the current search area (no specific station) — a recipient sees
// the same live nearby results, not a snapshot from share-time.
export function buildFuelSearchShareUrl({ lat, lng, fuelType, label }) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), fuel: fuelType || '' });
  if (label) params.set('label', label);
  return `${window.location.origin}/fuel-prices?${params.toString()}`;
}

export function buildEVSearchShareUrl({ lat, lng, label }) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  if (label) params.set('label', label);
  return `${window.location.origin}/ev-charging?${params.toString()}`;
}

export function buildTrendsShareUrl({ lat, lng, fuelType, label }) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), fuel: fuelType || '' });
  if (label) params.set('label', label);
  return `${window.location.origin}/trends?${params.toString()}`;
}

export function buildTripShareUrl({ start, end, mode }) {
  const params = new URLSearchParams({ start, end, mode: mode || 'car' });
  return `${window.location.origin}/trip-planner?${params.toString()}`;
}
