// Shared route-corridor geometry — used to decide whether a station is
// genuinely "along the route" (close to the actual path) rather than just
// close to one of the sample points used to search for it.

export function distanceKm(p1, p2) {
  const R = 6371;
  const dLat = (p2[0] - p1[0]) * Math.PI / 180;
  const dLng = (p2[1] - p1[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Shortest distance from `point` to the line segment [a, b], via a local
// equirectangular projection (accurate enough at the few-km scale this is
// used at) rather than true great-circle segment geometry.
function distanceToSegmentKm(point, a, b) {
  const kx = 111.32 * Math.cos((a[0] * Math.PI) / 180);
  const ky = 110.57;
  const toXY = (p) => [(p[1] - a[1]) * kx, (p[0] - a[0]) * ky];
  const p = toXY(point);
  const pa = [0, 0];
  const pb = toXY(b);
  const dx = pb[0] - pa[0];
  const dy = pb[1] - pa[1];
  const lenSq = dx * dx + dy * dy;
  let t = lenSq > 0 ? ((p[0] - pa[0]) * dx + (p[1] - pa[1]) * dy) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const qx = pa[0] + t * dx;
  const qy = pa[1] + t * dy;
  return Math.hypot(p[0] - qx, p[1] - qy);
}

// Shortest distance from `point` to the whole route polyline.
export function distanceToPolylineKm(point, routePoints) {
  let min = Infinity;
  for (let i = 1; i < routePoints.length; i++) {
    const d = distanceToSegmentKm(point, routePoints[i - 1], routePoints[i]);
    if (d < min) min = d;
  }
  return min;
}

// Picks up to `maxSamples` points evenly spaced along the route by actual
// distance travelled (not just array index, which clumps on winding roads),
// always including the first and last point.
export function sampleRouteByDistance(routePoints, maxSamples) {
  if (routePoints.length <= maxSamples) return routePoints.map((_, i) => i);

  let total = 0;
  const cumulative = [0];
  for (let i = 1; i < routePoints.length; i++) {
    total += distanceKm(routePoints[i - 1], routePoints[i]);
    cumulative.push(total);
  }

  const indices = [];
  const step = total / (maxSamples - 1);
  let cursor = 0;
  let target = 0;
  for (let s = 0; s < maxSamples; s++) {
    while (cursor < cumulative.length - 1 && cumulative[cursor] < target) cursor++;
    indices.push(cursor);
    target += step;
  }
  indices[indices.length - 1] = routePoints.length - 1;
  return [...new Set(indices)];
}
