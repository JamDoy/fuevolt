// Capital cities to check each run. South Australia is intentionally
// excluded — fuevolt.com has no live government price feed for SA (Adelaide
// falls back to location-only OpenStreetMap data with no pricing), so there
// is no real price to report there. See PROJECT_STATUS.md in the main repo.
export const CAPITAL_CITIES = [
  { label: 'Sydney', state: 'NSW', lat: -33.8688, lng: 151.2093 },
  { label: 'Melbourne', state: 'VIC', lat: -37.8136, lng: 144.9631 },
  { label: 'Brisbane', state: 'QLD', lat: -27.4698, lng: 153.0251 },
  { label: 'Perth', state: 'WA', lat: -31.9505, lng: 115.8605 },
  { label: 'Hobart', state: 'TAS', lat: -42.8821, lng: 147.3272 },
  { label: 'Darwin', state: 'NT', lat: -12.4634, lng: 130.8456 },
  { label: 'Canberra', state: 'ACT', lat: -35.2809, lng: 149.1300 },
];

export const SEARCH_RADIUS_KM = 20;
