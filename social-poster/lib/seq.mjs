import { getDistance } from './distance.mjs';
import { FUEL_CODES, isPlausible, loadQLD } from './fuelSources.mjs';
import { SEQ_AREAS } from './cities.mjs';

// The genuinely cheapest station within an area's radius. Comparison is on the
// raw feed price (tenths of a cent) throughout — ties go to the closer station.
function cheapestNear(data, fuelId, area) {
  let best = null;
  for (const p of data.prices.SitePrices) {
    if (p.FuelId !== fuelId || !(p.Price > 0 && p.Price < 9000)) continue;
    if (!isPlausible(p.Price / 1000)) continue;
    const site = data.siteMap[p.SiteId];
    if (!site || !site.Lat || !site.Lng) continue;
    const distance = getDistance(area.lat, area.lng, site.Lat, site.Lng);
    if (distance > area.radius) continue;
    if (!best || p.Price < best.raw || (p.Price === best.raw && distance < best.distance)) {
      best = { raw: p.Price, price: p.Price / 1000, name: site.N, siteId: p.SiteId, distance };
    }
  }
  return best;
}

// Ranks SE Queensland areas by their cheapest station for one fuel type.
// An area whose cheapest station is already listed higher up is skipped, so
// the same servo never appears twice under two suburb names.
export function rankAreas(data, fuelType, limit = 6) {
  const fuelId = FUEL_CODES[fuelType].qld;
  const rows = SEQ_AREAS
    .map((area) => {
      const best = cheapestNear(data, fuelId, area);
      return best && { area: area.label, ...best };
    })
    .filter(Boolean)
    .sort((a, b) => a.raw - b.raw || a.distance - b.distance);

  const seen = new Set();
  const ranked = [];
  for (const row of rows) {
    if (seen.has(row.siteId)) continue;
    seen.add(row.siteId);
    ranked.push(row);
    if (ranked.length === limit) break;
  }
  return ranked;
}

export async function rankSEQ(limit = 6) {
  const data = await loadQLD();
  if (!data) return null;
  return { U91: rankAreas(data, 'U91', limit), Diesel: rankAreas(data, 'Diesel', limit) };
}
