import { useState, useEffect } from 'react';

/**
 * Checks if geolocation permission is already granted and returns the user's
 * position without prompting. Returns null if permission is not yet granted
 * or geolocation is unavailable.
 */
export default function useAutoLocation() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation || !navigator.permissions) return;

    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }).catch(() => {});
  }, []);

  return location;
}
