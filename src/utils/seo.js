const BASE_URL = 'https://fuevolt.com';

const PAGE_META = {
  landing: {
    title: 'FueVolt — Compare Fuel Prices & EV Charging Stations in Australia',
    description: 'Find the cheapest petrol, diesel and LPG near you across NSW, VIC, QLD and WA. Plus EV charging stations, trip planner and fuel guides. Live government data.',
    path: '/',
  },
  fuel: {
    title: 'Fuel Prices Near Me — Compare Petrol, Diesel & LPG | FueVolt',
    description: 'Compare real-time E10, U91, U95, U98, diesel and LPG prices from official NSW, VIC, QLD and WA government APIs. Sorted by price, drive time, or distance.',
    path: '/fuel-prices',
  },
  ev: {
    title: 'EV Charging Stations Near Me — Find Fast Chargers | FueVolt',
    description: 'Locate EV charging stations across Australia. Filter by connector type (Type 2, CCS, CHAdeMO, Tesla) and charging speed.',
    path: '/ev-charging',
  },
  trip: {
    title: 'Trip Planner — Route with Fuel Stops & EV Chargers | FueVolt',
    description: 'Plan your road trip with live traffic, fuel stops, and EV charging stations along the way. Get drive time estimates and EV battery forecasts powered by TomTom.',
    path: '/trip-planner',
  },
  notifications: {
    title: 'Fuel & EV Alerts — Price Drops & Nearby Stations | FueVolt',
    description: 'Set alerts for fuel price drops near your saved stations. Get notified when you are near cheap fuel or EV chargers.',
    path: '/alerts',
  },
  privacy: {
    title: 'Privacy Policy | FueVolt',
    description: 'How FueVolt handles your data. We use government fuel APIs, TomTom routing services, OpenStreetMap, and Open Charge Map. No personal account required.',
    path: '/privacy',
  },
  terms: {
    title: 'Terms of Service | FueVolt',
    description: 'Terms of Service for using FueVolt — Australian fuel price comparison and EV charging station finder.',
    path: '/terms',
  },
  articles: {
    title: 'Guides & Articles — Fuel, EV Charging & Driving Tips | FueVolt',
    description: 'Expert guides on fuel types, EV charging connectors, octane ratings, saving money on fuel, and road trip planning in Australia.',
    path: '/guides',
  },
  calculator: {
    title: 'EV vs Fuel Calculator — Compare Running Costs | FueVolt',
    description: 'Calculate how much you could save by switching from petrol or diesel to an electric vehicle. Compare weekly and annual fuel vs EV charging costs.',
    path: '/ev-vs-fuel',
  },
  'article-detail': {
    title: 'Guide | FueVolt',
    description: 'In-depth guide from FueVolt on fuel, EV charging, and driving in Australia.',
    path: '/guides',
  },
  about: {
    title: 'About FueVolt — Australian Fuel & EV Comparison Service',
    description: 'Learn about FueVolt, our mission to help Australian drivers save on fuel, our data sources, and how we compare fuel prices and EV charging stations.',
    path: '/about',
  },
  faq: {
    title: 'Frequently Asked Questions — FueVolt',
    description: 'Common questions about FueVolt fuel price comparison, EV charging station finder, data sources, coverage, and how the service works.',
    path: '/faq',
  },
  contact: {
    title: 'Contact & Feedback — FueVolt',
    description: 'Get in touch with FueVolt. Send feedback, feature requests, or report an issue using our contact form.',
    path: '/contact',
  },
};

export function updatePageMeta(view, extra) {
  const meta = PAGE_META[view] || PAGE_META.landing;
  const title = extra?.title || meta.title;
  const description = extra?.description || meta.description;
  const url = extra?.url || `${BASE_URL}${meta.path}`;

  document.title = title;

  setMeta('description', description);
  setMeta('og:title', title, 'property');
  setMeta('og:description', description, 'property');
  setMeta('og:url', url, 'property');
  setMeta('og:type', 'website', 'property');
  setMeta('og:site_name', 'FueVolt', 'property');
  setMeta('og:image', `${BASE_URL}/og-image.svg`, 'property');
  setMeta('twitter:card', 'summary_large_image', 'name');
  setMeta('twitter:title', title, 'name');
  setMeta('twitter:description', description, 'name');

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function injectFuelStationSchema(stations, location) {
  removeSchema('fuel-stations');
  if (!stations || stations.length === 0) return;

  const items = stations.slice(0, 10).map((s) => ({
    '@type': 'GasStation',
    name: s.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.address,
      addressCountry: 'AU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: s.latitude,
      longitude: s.longitude,
    },
    brand: s.brand ? { '@type': 'Brand', name: s.brand } : undefined,
    ...(s.price && {
      priceRange: `${(s.price * 100).toFixed(1)} cents/litre`,
    }),
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Fuel Stations${location ? ` near ${location}` : ''}`,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item,
    })),
  };

  injectSchema('fuel-stations', schema);
}

export function injectEVStationSchema(stations, location) {
  removeSchema('ev-stations');
  if (!stations || stations.length === 0) return;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `EV Charging Stations${location ? ` near ${location}` : ''}`,
    itemListElement: stations.slice(0, 10).map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Place',
        name: s.AddressInfo?.Title || 'EV Charging Station',
        address: {
          '@type': 'PostalAddress',
          streetAddress: s.AddressInfo?.AddressLine1,
          addressLocality: s.AddressInfo?.Town,
          addressRegion: s.AddressInfo?.StateOrProvince,
          postalCode: s.AddressInfo?.Postcode,
          addressCountry: 'AU',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: s.AddressInfo?.Latitude,
          longitude: s.AddressInfo?.Longitude,
        },
      },
    })),
  };

  injectSchema('ev-stations', schema);
}

function injectSchema(id, data) {
  let el = document.getElementById(`schema-${id}`);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = `schema-${id}`;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeSchema(id) {
  const el = document.getElementById(`schema-${id}`);
  if (el) el.remove();
}

// Suburb-specific URL path helpers
export const POPULAR_SUBURBS = {
  fuel: [
    { slug: 'sydney', name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { slug: 'melbourne', name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
    { slug: 'brisbane', name: 'Brisbane', lat: -27.4698, lng: 153.0251 },
    { slug: 'perth', name: 'Perth', lat: -31.9505, lng: 115.8605 },
    { slug: 'adelaide', name: 'Adelaide', lat: -34.9285, lng: 138.6007 },
    { slug: 'gold-coast', name: 'Gold Coast', lat: -28.0167, lng: 153.4000 },
    { slug: 'canberra', name: 'Canberra', lat: -35.2809, lng: 149.1300 },
    { slug: 'newcastle', name: 'Newcastle', lat: -32.9283, lng: 151.7817 },
    { slug: 'wollongong', name: 'Wollongong', lat: -34.4278, lng: 150.8931 },
    { slug: 'hobart', name: 'Hobart', lat: -42.8821, lng: 147.3272 },
    { slug: 'geelong', name: 'Geelong', lat: -38.1499, lng: 144.3617 },
    { slug: 'townsville', name: 'Townsville', lat: -19.2590, lng: 146.8169 },
    { slug: 'cairns', name: 'Cairns', lat: -16.9186, lng: 145.7781 },
    { slug: 'darwin', name: 'Darwin', lat: -12.4634, lng: 130.8456 },
    { slug: 'toowoomba', name: 'Toowoomba', lat: -27.5598, lng: 151.9507 },
    { slug: 'ballarat', name: 'Ballarat', lat: -37.5622, lng: 143.8503 },
    { slug: 'bendigo', name: 'Bendigo', lat: -36.7570, lng: 144.2794 },
    { slug: 'launceston', name: 'Launceston', lat: -41.4332, lng: 147.1441 },
    { slug: 'sunshine-coast', name: 'Sunshine Coast', lat: -26.6500, lng: 153.0667 },
    { slug: 'parramatta', name: 'Parramatta', lat: -33.8151, lng: 151.0011 },
  ],
  ev: [
    { slug: 'sydney', name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { slug: 'melbourne', name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
    { slug: 'brisbane', name: 'Brisbane', lat: -27.4698, lng: 153.0251 },
    { slug: 'perth', name: 'Perth', lat: -31.9505, lng: 115.8605 },
    { slug: 'adelaide', name: 'Adelaide', lat: -34.9285, lng: 138.6007 },
    { slug: 'gold-coast', name: 'Gold Coast', lat: -28.0167, lng: 153.4000 },
    { slug: 'canberra', name: 'Canberra', lat: -35.2809, lng: 149.1300 },
    { slug: 'hobart', name: 'Hobart', lat: -42.8821, lng: 147.3272 },
    { slug: 'darwin', name: 'Darwin', lat: -12.4634, lng: 130.8456 },
    { slug: 'newcastle', name: 'Newcastle', lat: -32.9283, lng: 151.7817 },
  ],
};
