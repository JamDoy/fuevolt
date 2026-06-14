const FAVOURITES_KEY = 'fuevolt_favourites';

export function getFavourites() {
  try {
    return JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || [];
  } catch {
    return [];
  }
}

export function addFavourite(station) {
  const favourites = getFavourites();
  if (favourites.some(f => f.id === station.id)) return favourites;
  const saved = {
    id: station.id,
    name: station.name,
    brand: station.brand,
    address: station.address,
    latitude: station.latitude,
    longitude: station.longitude,
    addedAt: Date.now(),
  };
  const updated = [...favourites, saved];
  localStorage.setItem(FAVOURITES_KEY, JSON.stringify(updated));
  return updated;
}

export function removeFavourite(stationId) {
  const favourites = getFavourites();
  const updated = favourites.filter(f => f.id !== stationId);
  localStorage.setItem(FAVOURITES_KEY, JSON.stringify(updated));
  return updated;
}

export function isFavourite(stationId) {
  return getFavourites().some(f => f.id === stationId);
}
