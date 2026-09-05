const RECENT_SEARCHES_KEY = 'fuevolt_recent_searches';

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
