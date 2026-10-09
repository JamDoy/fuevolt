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

// Areas ranked for the weekly Brisbane / SE Queensland post. Each area's
// cheapest station within `radius` km of its centre is found, then the
// cheapest areas overall are listed. The Ipswich centre uses a wider radius
// because its cheapest stations (Yamanto, Bellbird Park) sit 5-12 km out.
export const SEQ_AREAS = [
  { label: 'Brisbane CBD', lat: -27.4698, lng: 153.0251, radius: 5 },
  { label: 'Chermside', lat: -27.3860, lng: 153.0340, radius: 5 },
  { label: 'Indooroopilly', lat: -27.4980, lng: 152.9730, radius: 5 },
  { label: 'Carindale', lat: -27.5040, lng: 153.1010, radius: 5 },
  { label: 'Sunnybank', lat: -27.5760, lng: 153.0560, radius: 5 },
  { label: 'Wynnum', lat: -27.4430, lng: 153.1700, radius: 5 },
  { label: 'Redcliffe', lat: -27.2300, lng: 153.1000, radius: 5 },
  { label: 'Strathpine', lat: -27.3050, lng: 152.9930, radius: 5 },
  { label: 'Caboolture', lat: -27.0850, lng: 152.9510, radius: 5 },
  { label: 'Ipswich area', lat: -27.6171, lng: 152.7594, radius: 15 },
  { label: 'Springfield', lat: -27.6700, lng: 152.9100, radius: 5 },
  { label: 'Logan Central', lat: -27.6390, lng: 153.1090, radius: 5 },
  { label: 'Beenleigh', lat: -27.7140, lng: 153.2010, radius: 5 },
  { label: 'Cleveland', lat: -27.5280, lng: 153.2630, radius: 5 },
  { label: 'Capalaba', lat: -27.5240, lng: 153.1960, radius: 5 },
];
