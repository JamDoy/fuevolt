import { CAPITAL_CITIES, SEARCH_RADIUS_KM } from './lib/cities.mjs';
import { fetchCheapestForCity } from './lib/fuelSources.mjs';
import { rankSEQ } from './lib/seq.mjs';
import { postToFacebook } from './lib/facebook.mjs';

const CENT = '¢';
const money = (dollars) => `${(dollars * 100).toFixed(1)}${CENT}`;

// Post types: 'capitals' (Mondays) and 'seq' (Thursdays, for the weekend).
// Pick one with `node index.mjs seq` or the POST_TYPE env var.
const POST_TYPE = process.argv[2] || process.env.POST_TYPE || 'capitals';

const FOOTER = 'Prices come from official state government fuel-price data, not crowdsourced guesses, and change through the day, so double-check before you drive.';

async function buildCapitalsPost() {
  const fuels = ['U91', 'Diesel'];
  const sections = [];
  let citiesWithData = 0;

  for (const fuel of fuels) {
    const results = await Promise.all(
      CAPITAL_CITIES.map((city) => fetchCheapestForCity(city, SEARCH_RADIUS_KM, fuel)),
    );
    const lines = [];
    results.forEach((r, i) => {
      if (!r) return;
      lines.push(`${CAPITAL_CITIES[i].label}: ${money(r.price)}/L — ${r.name || r.brand || 'a local station'}`);
    });
    if (fuel === 'U91') citiesWithData = lines.length;
    if (lines.length) sections.push(`${fuel === 'U91' ? 'Unleaded 91' : 'Diesel'}\n${lines.join('\n')}`);
  }

  // A post with most capitals missing would look broken — better to skip it.
  if (citiesWithData < 4) return null;

  const dateLabel = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney' });
  return [
    `⛽ This week's cheapest fuel across Australia's capital cities (as of ${dateLabel}):`,
    '',
    sections.join('\n\n'),
    '',
    `${FOOTER} Search your own suburb free at fuevolt.com`,
  ].join('\n');
}

async function buildSEQPost() {
  const ranked = await rankSEQ(6);
  if (!ranked || ranked.U91.length < 3 || ranked.Diesel.length < 3) return null;

  const list = (rows) => rows.map((r, i) => `${i + 1}. ${r.area}: ${money(r.price)} (${r.name})`).join('\n');
  const dateLabel = new Date().toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'Australia/Brisbane' });

  return [
    `⛽ Cheapest fuel across Brisbane & SE Queensland this weekend (prices as of ${dateLabel}):`,
    '',
    'Cheapest Unleaded 91:',
    list(ranked.U91),
    '',
    'Cheapest Diesel:',
    list(ranked.Diesel),
    '',
    `${FOOTER} Search your own suburb free at fuevolt.com`,
  ].join('\n');
}

const BUILDERS = { capitals: buildCapitalsPost, seq: buildSEQPost };

async function main() {
  const build = BUILDERS[POST_TYPE];
  if (!build) throw new Error(`Unknown post type "${POST_TYPE}" — use one of: ${Object.keys(BUILDERS).join(', ')}`);

  const message = await build();
  if (!message) {
    throw new Error(`Not enough live price data to build the "${POST_TYPE}" post — skipping rather than posting a half-empty update.`);
  }

  console.log(`--- Post content (${POST_TYPE}) ---`);
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
  // In GitHub Actions this shows as a red annotation on the run's summary page,
  // so a problem (bad token, missing secrets, no data) is visible without
  // digging through the raw log.
  if (process.env.GITHUB_ACTIONS) console.error(`::error title=Facebook poster failed::${err.message}`);
  else console.error(err);
  process.exitCode = 1;
});
