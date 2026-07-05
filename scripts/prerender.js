#!/usr/bin/env node
/**
 * Pre-render script for FueVolt.
 * Runs after `vite build` to generate unique HTML files for every route.
 * Each file has its own <title>, <meta description>, <link rel="canonical">,
 * <h1>, and full page content baked into the HTML so Google can index it
 * without executing JavaScript.
 */

import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const DIST = path.resolve('dist');
const CONTENT_DIR = path.resolve('public/content/articles');
const BASE_URL = 'https://www.fuevolt.com';
const ADSENSE_PUB_ID = 'ca-pub-7549230738737699';

// Read the base template (built index.html)
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8');

// ── Article data ────────────────────────────────────────────────────────
const articles = JSON.parse(
  fs.readFileSync(path.join(CONTENT_DIR, 'index.json'), 'utf-8')
);

function readArticleMarkdown(slug) {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  let md = fs.readFileSync(filePath, 'utf-8');
  // Strip frontmatter
  md = md.replace(/^---[\s\S]*?---\n*/, '');
  return md;
}

function markdownToHtml(md) {
  return marked.parse(md, { breaks: false, gfm: true });
}

// ── City data ───────────────────────────────────────────────────────────
const FUEL_CITIES = [
  { slug: 'sydney', name: 'Sydney' },
  { slug: 'melbourne', name: 'Melbourne' },
  { slug: 'brisbane', name: 'Brisbane' },
  { slug: 'perth', name: 'Perth' },
  { slug: 'adelaide', name: 'Adelaide' },
  { slug: 'gold-coast', name: 'Gold Coast' },
  { slug: 'canberra', name: 'Canberra' },
  { slug: 'newcastle', name: 'Newcastle' },
  { slug: 'wollongong', name: 'Wollongong' },
  { slug: 'hobart', name: 'Hobart' },
  { slug: 'geelong', name: 'Geelong' },
  { slug: 'townsville', name: 'Townsville' },
  { slug: 'cairns', name: 'Cairns' },
  { slug: 'darwin', name: 'Darwin' },
  { slug: 'toowoomba', name: 'Toowoomba' },
  { slug: 'ballarat', name: 'Ballarat' },
  { slug: 'bendigo', name: 'Bendigo' },
  { slug: 'launceston', name: 'Launceston' },
  { slug: 'sunshine-coast', name: 'Sunshine Coast' },
  { slug: 'parramatta', name: 'Parramatta' },
];

const EV_CITIES = [
  { slug: 'sydney', name: 'Sydney' },
  { slug: 'melbourne', name: 'Melbourne' },
  { slug: 'brisbane', name: 'Brisbane' },
  { slug: 'perth', name: 'Perth' },
  { slug: 'adelaide', name: 'Adelaide' },
  { slug: 'gold-coast', name: 'Gold Coast' },
  { slug: 'canberra', name: 'Canberra' },
  { slug: 'hobart', name: 'Hobart' },
  { slug: 'darwin', name: 'Darwin' },
  { slug: 'newcastle', name: 'Newcastle' },
];

const FUEL_CITY_INTROS = {
  sydney: 'Sydney drivers face some of the highest fuel prices in Australia due to high demand and limited competition in some suburbs. FueVolt compares prices across the Greater Sydney area including Parramatta, Penrith, Liverpool, Blacktown, and the Northern Beaches, helping you find the cheapest petrol and diesel wherever you are in the city.',
  melbourne: 'Melbourne follows a regular weekly fuel price cycle — prices typically peak mid-week and drop on Tuesdays. Understanding this cycle can save you cents per litre every fill-up. FueVolt tracks prices across Melbourne suburbs from Dandenong to Footscray, Werribee to Ringwood, so you always know the cheapest time and place to fill up.',
  brisbane: 'Brisbane and South East Queensland benefit from government-mandated fuel price transparency. FueVolt shows real-time pricing for every servo in the region, from the CBD to Ipswich, Logan, and Redlands. Brisbane fuel prices tend to follow a fortnightly cycle, and FueVolt helps you fill up at the bottom of the cycle.',
  perth: 'Perth has a unique fuel pricing system — stations must lock in their next-day price by 2pm, so you can see tomorrow\'s prices today on FueVolt. Perth fuel prices follow a regular weekly cycle, making it one of the most predictable cities for fuel savings. Compare prices from Joondalup to Rockingham and Midland to Fremantle.',
  adelaide: 'Adelaide fuel prices can vary significantly between suburbs. Coverage for South Australia is expanding — in the meantime, FueVolt shows nearby stations in border regions. Adelaide typically sees less dramatic price cycles than eastern capitals, but savings of 10-20 cents per litre between the cheapest and most expensive stations are common.',
  'gold-coast': 'The Gold Coast benefits from Queensland\'s fuel price transparency. Compare prices from Coolangatta to Helensvale, Surfers Paradise to Robina. Tourism areas can charge premiums, so checking FueVolt before filling up near the beach can save you significantly compared to the first servo you see.',
  canberra: 'Canberra fuel prices tend to be higher than surrounding NSW regional areas due to limited competition. ACT coverage is coming soon — nearby NSW stations with live pricing are already available on FueVolt. The Canberra market has fewer stations than comparable cities, making price comparison especially valuable.',
  newcastle: 'Newcastle and the Hunter Valley region have real-time government fuel pricing. Compare prices across Charlestown, Maitland, Lake Macquarie, and the wider Hunter region. Newcastle prices generally track below Sydney but follow similar cycles.',
  wollongong: 'Wollongong and the Illawarra region have real-time fuel pricing through government data. Find cheap petrol from Helensburgh to Kiama, including Shellharbour and the Shoalhaven. Being a regional city, Wollongong often has lower prices than nearby Sydney.',
  hobart: 'Hobart and Tasmanian fuel prices — coverage is expanding soon. Tasmania typically has higher fuel prices than mainland capitals due to additional shipping costs. Check back for real-time pricing data across the Apple Isle.',
  darwin: 'Darwin fuel prices are among the highest in Australia due to remote supply chains and limited competition. NT coverage is coming soon. Darwin drivers can expect to pay significantly more than capital city averages, making price comparison even more important for potential savings.',
  geelong: 'Geelong benefits from Victoria\'s real-time government fuel pricing. Compare prices across Geelong, Bellarine Peninsula, the Surf Coast, and Lara. As a regional city with growing population, Geelong has increasing competition among fuel retailers, creating opportunities to save.',
  toowoomba: 'Toowoomba benefits from Queensland\'s government fuel pricing transparency. Find the cheapest fuel in the Darling Downs region, including Highfields, Rangeville, and surrounding rural areas. Regional prices can vary more than metro areas, making FueVolt especially useful.',
  cairns: 'Cairns and Far North Queensland have real-time fuel pricing from official government sources. Compare prices from Smithfield to Edmonton, Palm Cove to Gordonvale. Cairns prices are typically higher than Brisbane due to transport costs, but significant variation exists between stations.',
  ballarat: 'Ballarat benefits from Victoria\'s real-time fuel pricing. Compare petrol and diesel across the Ballarat region, including Wendouree, Delacombe, and Buninyong. As a growing regional city, Ballarat has enough competition to make price comparison worthwhile.',
  bendigo: 'Bendigo benefits from Victoria\'s real-time fuel pricing. Find cheap fuel across Greater Bendigo and the Goldfields region, including Kangaroo Flat, Eaglehawk, and Strathfieldsaye.',
  launceston: 'Launceston fuel prices — Tasmanian coverage is expanding soon. Northern Tasmania typically sees slightly lower prices than Hobart but higher than mainland averages. Check back for real-time pricing across Launceston and surrounds.',
  'sunshine-coast': 'The Sunshine Coast benefits from Queensland\'s government fuel pricing transparency. Compare prices from Caloundra to Noosa, Maroochydore to Nambour. Like the Gold Coast, tourist areas can charge premiums — use FueVolt to find cheaper alternatives nearby.',
  parramatta: 'Parramatta and Western Sydney have real-time government fuel pricing. Find the cheapest petrol in one of Sydney\'s busiest commuter regions, including Blacktown, Penrith, and Liverpool. Western Sydney often has slightly lower prices than the eastern suburbs.',
  townsville: 'Townsville and North Queensland have real-time fuel pricing from government data. Compare prices across the city and surrounds. As a major regional centre, Townsville has enough competition for meaningful price differences between stations.',
};

const EV_CITY_INTROS = {
  sydney: 'Sydney has one of Australia\'s most extensive EV charging networks, with hundreds of chargers across the CBD, Eastern Suburbs, Northern Beaches, and Western Sydney. From ultra-rapid 350kW chargers at major shopping centres to destination chargers at hotels and restaurants, Sydney EV drivers have plenty of options.',
  melbourne: 'Melbourne\'s EV charging infrastructure is growing rapidly, with chargers throughout the CBD, inner suburbs, and along major arterials. Victoria\'s push for EV adoption means new charging stations are being installed across Melbourne regularly, including in shopping centres, car parks, and along the Great Ocean Road.',
  brisbane: 'Brisbane offers a strong EV charging network spanning the CBD to the outer suburbs. Queensland\'s Electric Super Highway connects Brisbane to Cairns with fast chargers every 150km, making long-distance EV travel increasingly practical from the Sunshine State\'s capital.',
  perth: 'Perth\'s EV charging network is expanding across the metro area, with chargers from Joondalup to Rockingham. Western Australia\'s vast distances make the growing network of fast chargers along major highways particularly important for EV drivers.',
  adelaide: 'Adelaide has a growing network of EV chargers across the city and South Australia. The state\'s high solar adoption makes EV charging particularly cost-effective, with many public chargers powered by renewable energy.',
  'gold-coast': 'The Gold Coast has EV chargers throughout the tourist and residential areas, from Coolangatta to the northern Gold Coast. Many hotels, shopping centres, and attractions now offer EV charging for visitors.',
  canberra: 'Canberra leads Australia in EV adoption rates, and its charging infrastructure reflects this. The ACT has chargers across the city including in government buildings, shopping centres, and residential areas, with plans for significant expansion.',
  hobart: 'Hobart and Tasmania have a growing EV charging network. Key routes around the island are being equipped with fast chargers, making EV travel around Tasmania increasingly practical.',
  darwin: 'Darwin\'s EV charging network is developing, with chargers available in the CBD and surrounding areas. The Northern Territory is working to extend charging along the Stuart Highway to support long-distance EV travel.',
  newcastle: 'Newcastle and the Hunter Valley have a solid EV charging network, with chargers at shopping centres, along the Pacific Highway, and throughout the city. The region\'s growing EV community is driving continued expansion.',
};

// ── FAQ data (17+ entries) ──────────────────────────────────────────────
const FAQ_ENTRIES = [
  { q: 'Where does FueVolt get its fuel prices?', a: 'FueVolt pulls real-time fuel prices directly from official Australian government sources. Prices are updated throughout the day as fuel stations report changes.' },
  { q: 'How often are fuel prices updated?', a: 'Fuel prices are updated in real-time as they change throughout the day. Each state has different update frequencies — some update multiple times daily as stations report changes, while others update daily.' },
  { q: 'Which states does FueVolt cover for fuel prices?', a: 'FueVolt currently covers fuel stations across New South Wales, Victoria, Queensland, and Western Australia. We are working to add South Australia, Tasmania, the Northern Territory, and the ACT.' },
  { q: 'What fuel types can I compare?', a: 'FueVolt lets you compare prices for E10 (ethanol blend), Unleaded 91, Premium 95, Premium 98, Diesel, and LPG. Not all fuel types are available at every station.' },
  { q: 'Why does a station show "Not currently available" for some fuel types?', a: 'This means a price has not been reported for that fuel type at that station. The station may not sell that fuel type, or the price has not been reported yet.' },
  { q: 'Are the fuel prices accurate?', a: 'FueVolt displays prices exactly as reported by official government sources. Stations are required by law to report their prices in most states. There can be occasional short delays between when a station changes its price and when the data updates.' },
  { q: 'What connector types can I filter by?', a: 'FueVolt supports filtering by Type 2 (most common for AC charging), CCS2 (Combined Charging System for DC fast charging), CHAdeMO (older DC fast charging standard), and Tesla connectors. You can also filter by charging speed.' },
  { q: 'Is the EV charging data available across all of Australia?', a: 'Yes. EV charging station data covers all of Australia, including regional and remote areas. Coverage is best in metropolitan areas and along major highways.' },
  { q: 'How does the trip planner work?', a: 'Enter your start and end destinations, and FueVolt calculates the best route. The planner shows total distance, estimated drive time, and finds fuel stations or EV chargers along your route. For EVs, it includes battery forecasting and recommended charging stops.' },
  { q: 'How does the EV battery forecast work?', a: 'The EV battery forecast uses your vehicle\'s battery capacity, current charge level, and energy consumption rate to estimate your battery level at the destination. It suggests optimal charging stops if your battery will not last the full trip.' },
  { q: 'Is FueVolt free to use?', a: 'Yes, FueVolt is completely free. There are no subscriptions, premium tiers, or hidden fees. The service is supported by advertising.' },
  { q: 'Does FueVolt work on mobile phones?', a: 'Yes. FueVolt is a Progressive Web App (PWA) designed to work on any device with a web browser — smartphones, tablets, and desktops. On mobile, you can add FueVolt to your home screen for quick access.' },
  { q: 'Does FueVolt track my location?', a: 'FueVolt only accesses your location if you grant permission, and it is used solely to find nearby fuel stations and EV chargers. Your location data is never stored, sold, or shared with third parties.' },
  { q: 'How can I contact FueVolt?', a: 'You can reach us by email at contact@fuevolt.com. We welcome feedback, feature suggestions, and bug reports.' },
  { q: 'What is the fuel price cycle?', a: 'In many Australian cities, fuel prices follow a predictable pattern — rising sharply over a day or two, then gradually falling over one to three weeks. Filling up at the bottom of the cycle can save you 10-30 cents per litre.' },
  { q: 'Can I save favourite fuel stations?', a: 'Yes. Tap the star icon on any fuel station card to save it as a favourite. Your favourites are stored locally on your device and appear at the top of search results for quick access.' },
  { q: 'How does the EV vs Fuel calculator work?', a: 'Enter your weekly fuel spend or driving distance, and the calculator estimates your potential savings by switching to an electric vehicle. It compares fuel costs against electricity costs based on current Australian energy prices.' },
];

// ── AdSense in-article ad unit ──────────────────────────────────────────
const AD_UNIT_HTML = `
<div style="margin:24px 0;text-align:center;min-height:90px">
<ins class="adsbygoogle" style="display:block;text-align:center" data-ad-layout="in-article" data-ad-format="fluid" data-ad-client="${ADSENSE_PUB_ID}" data-ad-slot="auto"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>`;

function insertAdsInArticle(html) {
  // Insert an ad after every 2nd <h2> section
  const sections = html.split(/<h2/i);
  if (sections.length <= 2) return html;
  const result = [sections[0]];
  for (let i = 1; i < sections.length; i++) {
    result.push('<h2' + sections[i]);
    if (i % 2 === 0 && i < sections.length - 1) {
      result.push(AD_UNIT_HTML);
    }
  }
  return result.join('');
}

// ── Helper: generate page HTML ──────────────────────────────────────────
function generatePage({ urlPath, title, description, h1, content }) {
  let html = template;

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`);

  // Replace or add canonical
  if (html.includes('<link rel="canonical"')) {
    html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${BASE_URL}${urlPath}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${BASE_URL}${urlPath}" />\n  </head>`);
  }

  // Replace meta description
  html = html.replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escAttr(description)}" />`
  );

  // Replace OG meta
  html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escAttr(title)}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escAttr(description)}" />`);
  html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${BASE_URL}${urlPath}" />`);

  // Replace the seo-fallback content
  const seoStart = html.indexOf('<div id="seo-fallback"');
  const seoEndMarker = '<!-- end seo-fallback -->';
  let seoEnd = html.indexOf(seoEndMarker);
  if (seoEnd === -1) {
    // Find the closing </div> before the script tags
    const scriptTag = html.indexOf('<script>document.getElementById');
    const rootClose = html.lastIndexOf('</div>', scriptTag);
    const rootClose2 = html.lastIndexOf('</div>', rootClose - 1);
    seoEnd = rootClose2;
  }

  if (seoStart !== -1) {
    // Replace everything from seo-fallback div to end marker with our content
    const beforeSeo = html.substring(0, seoStart);
    const afterSeoEnd = seoEnd !== -1 ? html.substring(seoEnd) : html.substring(html.indexOf('</div>\n    </div>\n    <script>'));
    
    const pageContent = `<div id="seo-fallback" style="max-width:900px;margin:0 auto;padding:40px 20px;font-family:Inter,system-ui,sans-serif;color:#0D2B5E">
        <h1 style="font-size:2rem;font-weight:900;margin-bottom:16px">${h1}</h1>
        ${content}
        <footer style="margin-top:32px;padding-top:16px;border-top:1px solid #E5E7EB;font-size:0.85rem;color:#9CA3AF">
          <p>&copy; 2026 FueVolt — Australian EV &amp; Fuel Price Finder</p>
          <p style="margin-top:8px"><a href="/about">About</a> · <a href="/faq">FAQ</a> · <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="/guides">Guides</a></p>
        </footer>
      </div>`;

    html = beforeSeo + pageContent + afterSeoEnd;
  }

  return html;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function writePage(urlPath, html) {
  const dir = path.join(DIST, urlPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
  console.log(`  ✓ ${urlPath}`);
}

// ── Collect all URLs for sitemap ────────────────────────────────────────
const sitemapUrls = ['/'];

// ── Generate guide pages ────────────────────────────────────────────────
console.log('Pre-rendering guide pages...');
for (const article of articles) {
  const md = readArticleMarkdown(article.slug);
  if (!md) {
    console.warn(`  ⚠ No markdown found for ${article.slug}`);
    continue;
  }
  let articleHtml = markdownToHtml(md);
  articleHtml = insertAdsInArticle(articleHtml);

  const urlPath = `/guides/${article.slug}`;
  const content = `
        <p style="font-size:0.85rem;color:#6B7280;margin-bottom:4px">${escHtml(article.category)} · ${escHtml(article.readTime)}</p>
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:24px">${escHtml(article.description)}</p>
        <article style="line-height:1.8;font-size:0.95rem">${articleHtml}</article>
        <p style="margin-top:24px"><a href="/guides">← Back to all guides</a></p>`;

  const html = generatePage({
    urlPath,
    title: `${article.title} | FueVolt`,
    description: article.description,
    h1: escHtml(article.title),
    content,
  });
  writePage(urlPath, html);
  sitemapUrls.push(urlPath);
}

// ── Generate guides index page ──────────────────────────────────────────
console.log('Pre-rendering guides index...');
{
  const guideList = articles
    .map(
      (a) =>
        `<div style="margin-bottom:16px;padding:16px;border:1px solid #E5E7EB;border-radius:12px">
          <h2 style="font-size:1.1rem;margin-bottom:4px"><a href="/guides/${a.slug}" style="color:#C8971F;text-decoration:none">${escHtml(a.title)}</a></h2>
          <p style="font-size:0.85rem;color:#6B7280">${escHtml(a.category)} · ${escHtml(a.readTime)}</p>
          <p style="font-size:0.9rem;color:#4B5563;margin-top:8px">${escHtml(a.description)}</p>
        </div>`
    )
    .join('\n');

  const html = generatePage({
    urlPath: '/guides',
    title: 'Guides & Articles — Fuel, EV Charging & Driving Tips | FueVolt',
    description:
      'Expert guides on fuel types, EV charging connectors, octane ratings, saving money on fuel, road trip planning, and electric vehicle tips for Australian drivers.',
    h1: 'Guides &amp; Articles',
    content: `<p style="font-size:0.95rem;color:#4B5563;margin-bottom:24px">Expert guides on fuel types, EV charging, saving money, and driving in Australia.</p>${guideList}`,
  });
  writePage('/guides', html);
  sitemapUrls.push('/guides');
}

// ── Generate fuel city pages ────────────────────────────────────────────
console.log('Pre-rendering fuel city pages...');
for (const city of FUEL_CITIES) {
  const intro = FUEL_CITY_INTROS[city.slug] || `Compare real-time fuel prices in ${city.name} and surrounding areas.`;
  const urlPath = `/fuel-prices/${city.slug}`;
  const content = `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">${escHtml(intro)}</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">Fuel Types Available in ${escHtml(city.name)}</h2>
        <ul style="margin-bottom:16px;padding-left:20px;line-height:2">
          <li>E10 (Ethanol Blend) — typically the cheapest option</li>
          <li>Unleaded 91 (U91) — standard unleaded petrol</li>
          <li>Premium 95 (U95) — recommended for many modern engines</li>
          <li>Premium 98 (U98) — highest octane for performance vehicles</li>
          <li>Diesel — for diesel engines, SUVs, utes and trucks</li>
          <li>LPG — liquefied petroleum gas, cheapest per litre</li>
        </ul>
        <h2 style="font-size:1.3rem;margin-bottom:12px">How to Save on Fuel in ${escHtml(city.name)}</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px">Use FueVolt to compare prices at hundreds of ${escHtml(city.name)} fuel stations in real-time. Sort by price, distance, or drive time to find the best deal near you. Track price cycles to fill up at the cheapest point.</p>
        <p style="margin-top:16px"><a href="/fuel-prices">← Compare fuel prices in all cities</a></p>`;

  const html = generatePage({
    urlPath,
    title: `Fuel Prices in ${city.name} — Compare Petrol & Diesel | FueVolt`,
    description: `Compare real-time fuel prices in ${city.name}. Find the cheapest E10, Unleaded 91, Premium 95, Premium 98, Diesel and LPG near you with FueVolt.`,
    h1: `Fuel Prices in ${escHtml(city.name)}`,
    content,
  });
  writePage(urlPath, html);
  sitemapUrls.push(urlPath);
}

// ── Generate EV city pages ──────────────────────────────────────────────
console.log('Pre-rendering EV charging city pages...');
for (const city of EV_CITIES) {
  const intro = EV_CITY_INTROS[city.slug] || `Find EV charging stations in ${city.name} and surrounding areas.`;
  const urlPath = `/ev-charging/${city.slug}`;
  const content = `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">${escHtml(intro)}</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">Connector Types in ${escHtml(city.name)}</h2>
        <ul style="margin-bottom:16px;padding-left:20px;line-height:2">
          <li>Type 2 — most common AC connector in Australia, used for destination and home charging (up to 22kW)</li>
          <li>CCS2 (Combined Charging System) — the standard for DC fast charging (50kW to 350kW)</li>
          <li>CHAdeMO — older DC fast charging standard, used by Nissan Leaf and some Mitsubishi models</li>
          <li>Tesla — Tesla\'s proprietary connector, available at Tesla Supercharger and Destination locations</li>
        </ul>
        <h2 style="font-size:1.3rem;margin-bottom:12px">Charging Speeds</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px">Filter ${escHtml(city.name)} chargers by speed: <strong>Slow</strong> (up to 7kW, ideal for overnight charging), <strong>Fast</strong> (7-50kW, adds range in 1-2 hours), or <strong>Ultra-Rapid</strong> (50kW+, 80% charge in 20-40 minutes).</p>
        <p style="margin-top:16px"><a href="/ev-charging">← Find EV chargers in all cities</a></p>`;

  const html = generatePage({
    urlPath,
    title: `EV Charging Stations in ${city.name} — Find Chargers | FueVolt`,
    description: `Find EV charging stations in ${city.name}. Filter by connector type (Type 2, CCS2, CHAdeMO, Tesla) and charging speed. Free charger finder for Australian EV drivers.`,
    h1: `EV Charging Stations in ${escHtml(city.name)}`,
    content,
  });
  writePage(urlPath, html);
  sitemapUrls.push(urlPath);
}

// ── Generate static pages ───────────────────────────────────────────────
console.log('Pre-rendering static pages...');

// About
writePage('/about', generatePage({
  urlPath: '/about',
  title: 'About FueVolt — Australian Fuel & EV Comparison Service',
  description: 'Learn about FueVolt, our mission to help Australian drivers save on fuel, and how we compare fuel prices and EV charging stations across Australia.',
  h1: 'About FueVolt',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">FueVolt is a free Australian service that helps drivers find the cheapest fuel and locate EV charging stations across the country. We compare real-time petrol, diesel, and LPG prices from official government sources across New South Wales, Victoria, Queensland, and Western Australia.</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">What We Do</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>Real-Time Fuel Prices:</strong> Live fuel prices updated throughout the day from official Australian government sources. Compare E10, Unleaded 91, Premium 95, Premium 98, Diesel, and LPG across thousands of stations.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>EV Charging Finder:</strong> Find thousands of EV charging stations across all of Australia. Filter by connector type (Type 2, CCS2, CHAdeMO, Tesla) and charging speed (slow, fast, ultra-rapid).</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>Trip Planner:</strong> Plan road trips with fuel stops and EV chargers along your route. For electric vehicles, get battery forecasts and recommended charging stops based on your vehicle\'s range.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>EV vs Fuel Calculator:</strong> Estimate how much you could save by switching to an electric vehicle based on your driving habits and electricity costs.</p>
        <h2 style="font-size:1.3rem;margin:20px 0 12px">Coverage</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px">Fuel price coverage: New South Wales, Victoria, Queensland, and Western Australia. EV charging data covers all of Australia. We are working to expand fuel price coverage to South Australia, Tasmania, the Northern Territory, and the ACT.</p>
        <h2 style="font-size:1.3rem;margin:20px 0 12px">Free and Independent</h2>
        <p style="font-size:0.9rem;color:#4B5563">FueVolt is completely free and not affiliated with any fuel company, petrol station chain, or EV charging network. We provide unbiased information to help Australians make informed decisions.</p>
        <p style="margin-top:16px"><strong>Contact:</strong> <a href="mailto:contact@fuevolt.com">contact@fuevolt.com</a></p>`,
}));
sitemapUrls.push('/about');

// FAQ (17 entries)
const faqHtml = FAQ_ENTRIES.map(
  (faq) =>
    `<div style="margin-bottom:12px;padding:12px 16px;border:1px solid #E5E7EB;border-radius:8px">
          <h3 style="font-size:0.95rem;font-weight:600;margin-bottom:6px">${escHtml(faq.q)}</h3>
          <p style="font-size:0.9rem;color:#4B5563">${escHtml(faq.a)}</p>
        </div>`
).join('\n');

writePage('/faq', generatePage({
  urlPath: '/faq',
  title: 'Frequently Asked Questions — FueVolt',
  description: 'Common questions about FueVolt — fuel prices, EV charging, trip planner, and how to save money on fuel in Australia.',
  h1: 'Frequently Asked Questions',
  content: `<p style="font-size:0.95rem;color:#4B5563;margin-bottom:24px">Everything you need to know about using FueVolt to find cheap fuel and EV chargers in Australia.</p>${faqHtml}<p style="margin-top:24px">Still have questions? Contact us at <a href="mailto:contact@fuevolt.com">contact@fuevolt.com</a>.</p>`,
}));
sitemapUrls.push('/faq');

// Privacy
writePage('/privacy', generatePage({
  urlPath: '/privacy',
  title: 'Privacy Policy | FueVolt',
  description: 'FueVolt Privacy Policy — how we handle your data, location information, and what third-party services we use.',
  h1: 'Privacy Policy',
  content: `
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>Last updated:</strong> June 2026</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px">FueVolt ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.</p>
        <h2 style="font-size:1.2rem;margin:20px 0 8px">Information We Collect</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px"><strong>Location Data:</strong> Only when you grant permission. Used solely to find nearby fuel stations and EV chargers. Never stored, sold, or shared.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px"><strong>Usage Data:</strong> Anonymous analytics to improve the service. No personal accounts or login required.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px"><strong>Local Storage:</strong> Favourites, preferences, and geofence alerts stored locally on your device only.</p>
        <h2 style="font-size:1.2rem;margin:20px 0 8px">Third-Party Services</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px">FueVolt uses third-party APIs and services to provide its functionality. For full details, please review the complete Privacy Policy within the application.</p>
        <h2 style="font-size:1.2rem;margin:20px 0 8px">Contact</h2>
        <p style="font-size:0.9rem;color:#4B5563">For privacy enquiries, email us at <a href="mailto:contact@fuevolt.com">contact@fuevolt.com</a>.</p>`,
}));
sitemapUrls.push('/privacy');

// Terms
writePage('/terms', generatePage({
  urlPath: '/terms',
  title: 'Terms of Service | FueVolt',
  description: 'Terms of Service for using FueVolt — Australian fuel price comparison and EV charging station finder.',
  h1: 'Terms of Service',
  content: `
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>Last updated:</strong> June 2026</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px">By using FueVolt ("the Service"), you agree to these Terms of Service. FueVolt is a free fuel price comparison and EV charging station finder for Australian drivers.</p>
        <h2 style="font-size:1.2rem;margin:20px 0 8px">Use of Service</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px">FueVolt provides fuel price data from official Australian government sources and EV charging station data. Prices and station information are provided as-is and may not reflect real-time conditions at every station.</p>
        <h2 style="font-size:1.2rem;margin:20px 0 8px">Accuracy Disclaimer</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px">While we strive for accuracy, fuel prices can change at any time. Always verify the price at the pump. FueVolt is not liable for discrepancies between displayed prices and actual prices.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:8px">For full Terms of Service, please review the complete terms within the application.</p>
        <h2 style="font-size:1.2rem;margin:20px 0 8px">Contact</h2>
        <p style="font-size:0.9rem;color:#4B5563">For enquiries, email <a href="mailto:contact@fuevolt.com">contact@fuevolt.com</a>.</p>`,
}));
sitemapUrls.push('/terms');

// Fuel prices index
writePage('/fuel-prices', generatePage({
  urlPath: '/fuel-prices',
  title: 'Fuel Prices Near Me — Compare Petrol, Diesel & LPG | FueVolt',
  description: 'Compare real-time petrol, diesel, E10, U95, U98 and LPG prices from official Australian government sources. Find the cheapest fuel station near you.',
  h1: 'Compare Fuel Prices Across Australia',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">Search by suburb, city or postcode to find fuel prices near you — or tap Use My Location. FueVolt compares real-time fuel prices from official government sources across NSW, VIC, QLD, and WA.</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">Fuel Prices by City</h2>
        <ul style="padding-left:20px;line-height:2.2">${FUEL_CITIES.map(c => `<li><a href="/fuel-prices/${c.slug}">${c.name} Fuel Prices</a></li>`).join('')}</ul>`,
}));
sitemapUrls.push('/fuel-prices');

// EV charging index
writePage('/ev-charging', generatePage({
  urlPath: '/ev-charging',
  title: 'EV Charging Stations Near Me — Find Fast Chargers | FueVolt',
  description: 'Locate EV charging stations across Australia. Filter by connector type (Type 2, CCS, CHAdeMO, Tesla) and charging speed.',
  h1: 'EV Charging Stations Across Australia',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">Find EV charging stations near you. Filter by connector type and charging speed. FueVolt shows thousands of verified charging stations across all of Australia.</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">EV Chargers by City</h2>
        <ul style="padding-left:20px;line-height:2.2">${EV_CITIES.map(c => `<li><a href="/ev-charging/${c.slug}">${c.name} EV Chargers</a></li>`).join('')}</ul>`,
}));
sitemapUrls.push('/ev-charging');

// EV vs Fuel calculator
writePage('/ev-vs-fuel', generatePage({
  urlPath: '/ev-vs-fuel',
  title: 'EV vs Fuel Calculator — Compare Running Costs | FueVolt',
  description: 'Calculate how much you could save by switching from petrol or diesel to an electric vehicle. Compare weekly and annual fuel vs EV charging costs.',
  h1: 'EV vs Fuel Cost Calculator',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">Compare the running costs of petrol/diesel vehicles against electric vehicles. Enter your weekly fuel spend or driving distance to see potential savings.</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">How It Works</h2>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>Basic Mode:</strong> Enter your weekly fuel spend and see an instant estimate of EV savings.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px"><strong>Advanced Mode:</strong> Enter your weekly driving distance, vehicle type (small car, sedan, SUV, ute), fuel type, electricity cost per kWh, and home vs public charging percentage for a more accurate estimate.</p>
        <p style="font-size:0.9rem;color:#4B5563;margin-bottom:12px">The calculator shows estimated weekly savings, annual savings, and CO2 reduction. Note: these are estimates based on average consumption figures and may vary based on your specific vehicle and driving conditions.</p>`,
}));
sitemapUrls.push('/ev-vs-fuel');

// Trip planner
writePage('/trip-planner', generatePage({
  urlPath: '/trip-planner',
  title: 'Trip Planner — Route with Fuel Stops & EV Chargers | FueVolt',
  description: 'Plan your Australian road trip with fuel stops and EV charging stations along the route. Get drive time estimates and EV battery forecasts.',
  h1: 'Trip Planner',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">Plan your road trip with fuel stations and EV chargers along your route. Enter your start and destination to calculate the best route with estimated drive time, distance, and recommended stops.</p>
        <h2 style="font-size:1.3rem;margin-bottom:12px">Features</h2>
        <ul style="padding-left:20px;line-height:2">
          <li><strong>Fuel Mode:</strong> Find petrol stations along your route with current prices</li>
          <li><strong>EV Mode:</strong> Find charging stations with battery forecast and recommended charging stops</li>
          <li><strong>Battery Forecast:</strong> See estimated battery level at each waypoint based on your EV\'s range</li>
          <li><strong>Drive Time:</strong> Real-time drive time estimates including traffic conditions</li>
        </ul>`,
}));
sitemapUrls.push('/trip-planner');

// Alerts / Notifications
writePage('/alerts', generatePage({
  urlPath: '/alerts',
  title: 'Fuel & EV Alerts — Price Drops & Nearby Stations | FueVolt',
  description: 'Set alerts for fuel stations and EV chargers. Get notified when you are near a saved station.',
  h1: 'Alerts &amp; Notifications',
  content: `
        <p style="font-size:0.95rem;color:#4B5563;margin-bottom:16px">Set up proximity alerts for your favourite fuel stations and EV chargers. FueVolt can notify you when you are near a saved station.</p>`,
}));
sitemapUrls.push('/alerts');

// ── Generate sitemap.xml ────────────────────────────────────────────────
console.log('Generating sitemap.xml...');
const today = new Date().toISOString().split('T')[0];
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (url) =>
      `  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url === '/' ? 'daily' : url.startsWith('/guides/') ? 'monthly' : 'weekly'}</changefreq>
    <priority>${url === '/' ? '1.0' : url.startsWith('/fuel-prices/') || url.startsWith('/ev-charging/') ? '0.8' : url.startsWith('/guides/') ? '0.7' : '0.6'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapXml, 'utf-8');
console.log(`  ✓ sitemap.xml (${sitemapUrls.length} URLs)`);

// ── Generate robots.txt ─────────────────────────────────────────────────
console.log('Generating robots.txt...');
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsTxt, 'utf-8');
console.log('  ✓ robots.txt');

console.log(`\nPre-rendering complete! ${sitemapUrls.length} pages generated.`);
