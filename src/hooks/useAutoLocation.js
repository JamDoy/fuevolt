import { useState, useEffect, useRef } from 'react';

/**
 * Checks if geolocation permission is already granted and tracks the user's
 * live position without prompting — used both to auto-search near the user
 * on load and to drive the "your location" marker shown on every map across
 * the site. Uses watchPosition (not a one-shot getCurrentPosition) so that
 * marker actually moves while driving, rather than freezing at wherever the
 * page first loaded. Returns null if permission is not yet granted or
 * geolocation is unavailable.
 */
export default function useAutoLocation() {
  const [location, setLocation] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation || !navigator.permissions) return undefined;
    let cancelled = false;

    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (cancelled || result.state !== 'granted') return;

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }).catch(() => {});

    return () => {
      cancelled = true;
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return location;
}
