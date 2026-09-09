// Canonical brand-name matching used to clean up and unify the raw "brand"
// strings each state's fuel data source returns. Different sources spell or
// format the same real chain differently (VIC has no dedicated brand field
// at all — only a free-text station name — and even where a brand field
// exists, WA/QLD/NT sometimes use different variants of the same chain:
// "OTR" vs "On The Run", "U-Go" vs "UGO", "Puma" vs "Puma Energy"). Routing
// every source through one shared list keeps the Advanced Search brand
// filter from showing near-duplicate entries for what is really one chain.
//
// Longest alias wins so a specific sub-brand ("Metro Fuel") is picked over a
// shorter generic one, and a compound label like "Ampol Foodary" or "Shell
// Reddy Express" still resolves to a single real brand.
const BRAND_ALIASES = [
  ['7-Eleven', '7-Eleven'],
  ['Metro Petroleum', 'Metro Petroleum'],
  ['Metro Fuel', 'Metro Fuel'],
  ['Coles Express', 'Coles Express'],
  ['Woolworths Petrol', 'Woolworths'],
  ['Viva Energy', 'Viva Energy'],
  ['Woolworths', 'Woolworths'],
  ['Freedom Fuels', 'Freedom Fuels'],
  ['Freedom', 'Freedom Fuels'],
  ['Pacific Petroleum', 'Pacific Petroleum'],
  ['Prime Petroleum', 'Prime Petroleum'],
  ['Pearl Energy', 'Pearl Energy'],
  ['Better Choice', 'Better Choice'],
  ['Indigo Fuels', 'Indigo Fuels'],
  ['Reddy Express', 'Reddy Express'],
  ['X Convenience', 'X Convenience'],
  ['FuelXpress', 'FuelXpress'],
  ['EG Ampol', 'EG Ampol'],
  ['Ampol', 'Ampol'],
  ['Caltex', 'Caltex'],
  ['Shell', 'Shell'],
  ['BP', 'BP'],
  ['United', 'United'],
  ['Mobil', 'Mobil'],
  ['Costco', 'Costco'],
  ['Liberty', 'Liberty'],
  ['Puma Energy', 'Puma'],
  ['Puma', 'Puma'],
  ['On The Run', 'OTR'],
  ['On the Run', 'OTR'],
  ['OTR', 'OTR'],
  ['Budget', 'Budget'],
  ['Speedway', 'Speedway'],
  ['Astron', 'Astron'],
  ['Endeavour', 'Endeavour'],
  ['U-Go', 'U-Go'],
  ['UGO', 'U-Go'],
  ['Vibe', 'Vibe'],
  ['Gull', 'Gull'],
  ['Apco', 'Apco'],
  ['Westside', 'Westside'],
  ['Lowes', 'Lowes'],
  ['Choice', 'Choice'],
  ['Mogas', 'Mogas'],
  ['IOR', 'IOR'],
  ['AM/PM', 'AM/PM'],
  ['Petrogas', 'Petrogas'],
  ['Atlas', 'Atlas'],
  ['SOLO', 'Solo'],
  ['Solo', 'Solo'],
  ['Unbranded', 'Independent'],
  ['Unknown', 'Independent'],
  ['Independent', 'Independent'],
].sort((a, b) => b[0].length - a[0].length);

function matchAlias(text) {
  const lower = text.toLowerCase();
  for (const [alias, canonical] of BRAND_ALIASES) {
    if (lower.includes(alias.toLowerCase())) return canonical;
  }
  return null;
}

// Cleans up a brand string already provided by a data source (NSW, QLD, WA,
// NT, OSM) — folds spelling/format variants and sub-brand qualifiers (e.g.
// "Ampol Foodary") into one canonical name.
export function normalizeBrandName(raw) {
  if (!raw || !raw.trim()) return 'Independent';
  return matchAlias(raw) || raw.trim();
}

// VIC's government feed has no brand field at all — only a free-text station
// name like "BP Bittern" or "7-Eleven Cranbourne East (Hunt Club)". Matching
// against the same canonical list picks out the real chain name; a station
// that matches nothing (an independent roadhouse, general store, or small
// regional chain) keeps its own name rather than being mislabelled with
// whatever word happens to come last — the previous behaviour, which turned
// "Skipton General Store" into the brand "Store".
export function extractBrandFromStationName(name) {
  if (!name || !name.trim()) return 'Independent';
  return matchAlias(name) || name.trim();
}

// OpenStreetMap's fuel-station tags are crowd-sourced — `brand` and
// `operator` are free text and occasionally contain typos ("freedon" for a
// station literally named "Freedom" in its own `name` tag). Checking `brand`,
// then `name`, then `operator` in that order means a clean, matching tag
// wins over a typo'd one instead of just taking whichever field happens to
// be non-empty first.
export function resolveOsmFuelBrand({ brand, name, operator }) {
  for (const candidate of [brand, name, operator]) {
    const match = candidate && matchAlias(candidate);
    if (match) return match;
  }
  const fallback = brand || operator || '';
  return fallback.trim() || 'Independent';
}

// Real-world popularity from a live combined survey of the NSW, VIC, QLD, WA
// and NT government fuel-price feeds (Sydney, Newcastle, Canberra, all of
// VIC, all of QLD, all of WA, Darwin — several thousand stations), most
// common first. Used only to order the Advanced Search brand dropdowns;
// brands outside this list (regional independents, one-off chains) are
// appended afterwards in alphabetical order.
export const BRAND_POPULARITY_ORDER = [
  'BP', 'Ampol', '7-Eleven', 'Reddy Express', 'Independent', 'EG Ampol',
  'Caltex', 'United', 'Liberty', 'Shell', 'IOR', 'Mobil', 'Astron', 'Vibe',
  'Metro Petroleum', 'Metro Fuel', 'Freedom Fuels', 'U-Go', 'Apco', 'OTR',
  'Endeavour', 'Solo', 'Atlas', 'Mogas', 'Pearl Energy', 'Better Choice',
  'Pacific Petroleum', 'Costco', 'Gull', 'Puma', 'Speedway', 'Indigo Fuels',
  'Westside', 'Lowes', 'X Convenience', 'Budget', 'Choice', 'Petrogas',
  'Woolworths', 'Coles Express', 'Viva Energy', 'FuelXpress', 'Prime Petroleum', 'AM/PM',
];

// Sorts a list of brand names most-popular-first using the survey above,
// falling back to alphabetical order for anything not in it (small regional
// chains and independents specific to whatever area was searched).
export function sortBrandsByPopularity(brands) {
  const rank = new Map(BRAND_POPULARITY_ORDER.map((b, i) => [b, i]));
  return [...brands].sort((a, b) => {
    const ra = rank.has(a) ? rank.get(a) : Infinity;
    const rb = rank.has(b) ? rank.get(b) : Infinity;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}
