import { fetchFuelPrices } from './api';

// One representative city per state/territory fuel-price feed this app
// covers (see detectState/fetchFuelPrices in api.js) — used only to sample a
// "national average" snapshot, not as a full census of every station in the
// country. Every one of these calls already goes through the existing
// client + server-side caching in fetchFuelPrices, so repeat visits within
// the same hour don't re-hit the underlying government APIs.
export const NATIONAL_SAMPLE_CITIES = [
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
  { name: 'Brisbane', lat: -27.4698, lng: 153.0251 },
  { name: 'Perth', lat: -31.9505, lng: 115.8605 },
  { name: 'Adelaide', lat: -34.9285, lng: 138.6007 },
  { name: 'Darwin', lat: -12.4634, lng: 130.8456 },
  { name: 'Hobart', lat: -42.8821, lng: 147.3272 },
  { name: 'Canberra', lat: -35.2809, lng: 149.1300 },
];

// Averages real, currently-live prices across those sample cities for one
// fuel type. Returns null rather than a fabricated number if nothing came
// back priced (e.g. every sampled feed is briefly down).
export async function fetchNationalAveragePrice(fuelType) {
  const results = await Promise.all(
    NATIONAL_SAMPLE_CITIES.map((city) =>
      fetchFuelPrices({ latitude: city.lat, longitude: city.lng, fuelType, radius: 15 }).catch(() => [])
    )
  );
  const priced = results.flat().filter((s) => s.price != null);
  if (priced.length === 0) return null;
  const average = priced.reduce((sum, s) => sum + s.price, 0) / priced.length;
  return { average, sampleSize: priced.length };
}
