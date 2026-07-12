const FUEL_PREFERENCE_KEY = 'fuevolt_fuel_preference';
const RECENT_SEARCHES_KEY = 'fuevolt_recent_searches';

export const FUEL_PREFERENCES = ['U91', 'U95', 'U98', 'Diesel', 'E10', 'EV'];

export function getFuelPreference() {
  try {
    const preference = sessionStorage.getItem(FUEL_PREFERENCE_KEY);
    return FUEL_PREFERENCES.includes(preference) ? preference : null;
  } catch {
    return null;
  }
}

export function saveFuelPreference(preference) {
  if (!FUEL_PREFERENCES.includes(preference)) return;
  try {
    sessionStorage.setItem(FUEL_PREFERENCE_KEY, preference);
  } catch {
    // sessionStorage may be unavailable in restricted browser modes.
  }
}

export function getRecentSearches() {
  try {
    const searches = JSON.parse(sessionStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    return Array.isArray(searches) ? searches.filter((search) => typeof search === 'string').slice(0, 3) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query) {
  const normalized = query.trim().replace(/\s+/g, ' ');
  if (!normalized) return getRecentSearches();

  const searches = getRecentSearches().filter(
    (search) => search.toLocaleLowerCase('en-AU') !== normalized.toLocaleLowerCase('en-AU')
  );
  const updated = [normalized, ...searches].slice(0, 3);

  try {
    sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // sessionStorage may be unavailable in restricted browser modes.
  }

  return updated;
}
