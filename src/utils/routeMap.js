import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { calculateRoute } from './tomtom';

export const ROUTE_COLOR = '#2979FF';

// Live-position style marker (not a dropped pin) for the user's starting
// point, so it reads distinctly from the destination pin.
export const carStartIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="width:30px;height:30px;border-radius:50%;background:${ROUTE_COLOR};border:3px solid #FFFFFF;box-shadow:0 1px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0v6a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-6m-14 0h14m-14 0a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1m13-4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1" stroke="#FFFFFF" stroke-width="1.4" stroke-linejoin="round"/>
      <circle cx="7.5" cy="15.5" r="1.2" fill="${ROUTE_COLOR}" stroke="#FFFFFF" stroke-width="0.6"/>
      <circle cx="16.5" cy="15.5" r="1.2" fill="${ROUTE_COLOR}" stroke="#FFFFFF" stroke-width="0.6"/>
    </svg>
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Fetches a driving route between the user's location and a station/charger
// once both ends are known. Returns null points (never an error state visible
// to the user) if either coordinate is missing or the route lookup fails —
// the map just falls back to showing the destination alone.
export function useRouteToDestination(startLat, startLng, endLat, endLng) {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadRoute() {
      setPoints(null);
      if (startLat == null || startLng == null || endLat == null || endLng == null) return;
      setLoading(true);
      try {
        const route = await calculateRoute(startLat, startLng, endLat, endLng);
        if (!cancelled && route?.points?.length > 1) setPoints(route.points);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [startLat, startLng, endLat, endLng]);

  return { points, loading };
}

// Fits the map view to the full route (or both points, if the route hasn't
// loaded yet) instead of just centering on the destination.
export function FitRouteBounds({ start, end, points }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(points?.length > 1 ? points : [start, end]);
    map.fitBounds(bounds, { padding: [36, 36] });
  }, [map, start, end, points]);

  return null;
}
