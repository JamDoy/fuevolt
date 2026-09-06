import { CAPITAL_CITIES, SEARCH_RADIUS_KM } from './lib/cities.mjs';
import { fetchCheapestForCity } from './lib/fuelSources.mjs';
import { postToFacebook } from './lib/facebook.mjs';

const CENT = '¢';

function formatLine(city, result) {
  if (!result) return `${city.label}: no data available this week`;
  const price = (result.price * 100).toFixed(1);
  const place = result.name || result.brand || 'a local station';
  return `${city.label}: ${price}${CENT}/L — ${place}`;
}

async function buildPost() {
  const results = await Promise.all(
    CAPITAL_CITIES.map((city) => fetchCheapestForCity(city, SEARCH_RADIUS_KM))
  );

  const lines = CAPITAL_CITIES.map((city, i) => formatLine(city, results[i]));
  const foundAny = results.some(Boolean);
  if (!foundAny) return null;

  const dateLabel = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  return [
    `⛽ This week's cheapest Unleaded 91 across Australia's capital cities (as of ${dateLabel}):`,
    '',
    ...lines,
    '',
    'Prices sourced from official state government fuel-price data where available. Compare live prices near you at fuevolt.com',
  ].join('\n');
}

async function main() {
  const message = await buildPost();
  if (!message) {
    console.error('No fuel price data could be fetched for any capital city — skipping post.');
    process.exitCode = 1;
    return;
  }

  console.log('--- Post content ---');
  console.log(message);
  console.log('--------------------');

  if (process.env.DRY_RUN === 'true') {
    console.log('DRY_RUN set — not posting to Facebook.');
    return;
  }

  const result = await postToFacebook(message);
  console.log('Posted to Facebook:', result.id);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
