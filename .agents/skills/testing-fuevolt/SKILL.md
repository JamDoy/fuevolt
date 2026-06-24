---
name: testing-fuevolt
description: Test the FueVolt app end-to-end — landing page flow, fuel price search, EV charging search, guides/articles, RSS news, and navigation. Use when verifying UI or API changes.
---

# Testing FueVolt App

## Prerequisites

- Node.js and npm installed
- Project dependencies installed (`npm install` in the fuevolt-app directory)

## Dev Server

```bash
cd /home/ubuntu/fuevolt/fuevolt-app
npm run dev
# Typically runs on localhost:5173-5179 (Vite picks the next free port)
```

## Key Test Flows

### 1. Landing Page
- Navigate to the root URL
- Verify 50/50 split: Fuel Prices (gold) and EV Charging (green) panels
- Verify Trip Planner card below the panels
- Verify Fuel vs Electric cost comparison widget ($65 vs $25)
- Verify "Guides & Articles" section with 4 featured article cards
- Verify "Latest Auto & EV News" section with RSS headlines
- Header shows FueVolt logo and dark/light mode toggle

### 2. Fuel Price Search
- Click "Find Cheap Fuel" or "Fuel Prices" tab
- Type a location (e.g., "Sydney") and click Search
- Verify: stations list appears, sorted by price (ascending)
- Verify: price summary cards (Cheapest, Average, You Could Save, Stations Found)
- Verify: rank badges (#1 green, #2, #3...)
- Verify: source attribution at bottom of each card
- Government APIs: NSW (Motor API), VIC (Fair Fuel/Servo Saver), QLD (Fuel Pricing Direct)

### 3. EV Charging Search
- Click "Find EV Chargers" or "EV Charging" tab
- Search "Melbourne" → should return real stations from Open Charge Map + TomTom
- Verify: real business names, connector types, power ratings
- Verify: filter chips for Connector (Type 2, CCS, CHAdeMO, Tesla) and Speed
- Verify: availability badges (green/red/grey) from TomTom EV Availability API
- Verify: favourite (star) button on station cards

### 4. Guides & Articles
- Click "Guides" tab in header navigation
- Verify: URL changes to `#/guides`
- Verify: 12 article cards displayed in a grid
- Verify: 5 filter buttons: All, Fuel Guide, EV Guide, Comparison, Tips
- Click "EV Guide" filter → should show exactly 4 EV articles
- Click "All" → should show all 12 articles
- Click an article card → URL changes to `#/guides/{slug}`
- Verify: article title, category badge, read time, full markdown body
- Verify: "Back to articles" link returns to `#/guides`

### 5. RSS News Feed
- On landing page, scroll to "Latest Auto & EV News" section
- Verify: headlines from The Driven, CarExpert, and/or Drive.com.au
- Verify: source attribution on each item (emoji icon + source name)
- Verify: "Read more on [Source]" link on each item
- Note: RSS may fail due to CORS proxy issues — this is expected in dev. Check localStorage for `fuevolt_rss_cache` to see cached results.

### 6. SEO Static HTML (Shell Test)
- Use curl to fetch the raw HTML without JS execution:
  ```bash
  curl -s http://localhost:5174/ | grep -o '<h[12][^>]*>' | wc -l  # Should be 7+
  curl -s http://localhost:5174/ | grep "Fuel Types Explained"     # Article link
  curl -s http://localhost:5174/ | grep "Fuel Prices Sydney"       # City link
  curl -s http://localhost:5174/ | grep "noscript"                 # noscript block
  ```
- This verifies Google crawler will see real content, not empty `<div id="root"></div>`

### 7. Navigation
- Back arrow in header returns to previous view
- Tabs (Fuel Prices, EV Charging, Trip Planner, Guides, Alerts) switch views
- FueVolt logo click returns to landing page
- Dark/light mode toggle persists across navigation

### 8. Trip Planner
- Click "Trip Planner" tab or "Plan Trip" on landing page
- Enter start and end locations
- Verify: route displayed on TomTom map with fuel/EV stops

## Known Issues & Workarounds

### Service Worker Stale Cache
The app registers a service worker (`sw.js`) with cache-first strategy. If you're testing new features (e.g., articles, new pages), the SW might serve stale cached content and fetches may hang.

**Workaround:** Unregister the service worker and hard-refresh:
1. Open DevTools Console
2. Run: `navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister()))`
3. Hard refresh: Ctrl+Shift+R

Or bump `CACHE_NAME` in `public/sw.js` to force cache invalidation.

### RSS CORS Proxy Failures
RSS feeds use CORS proxies (allorigins.win, corsproxy.io) which may return 403 or fail. The app falls back gracefully — if all proxies fail, the news section simply won't render. Cached results in localStorage (`fuevolt_rss_cache`) persist for 6 hours.

### Fuel API CORS in Dev
Some government fuel APIs may have CORS restrictions when called from `localhost`. In production (served from fuevolt.com), these work correctly. In dev, you may see fallback/sample data for some states.

## API Notes

- **Maps & Routing**: TomTom Map Display API, Routing API, Traffic API (key embedded)
- **EV Charging**: Open Charge Map API + TomTom EV Availability API
- **NSW Fuel**: Motor API (api.nsw.gov.au)
- **VIC Fuel**: Fair Fuel Open Data API / Servo Saver (service.vic.gov.au)
- **QLD Fuel**: Fuel Pricing Direct Outbound API (fuelpricesqld.com.au)
- **WA Fuel**: FuelWatch (fuelwatch.wa.gov.au)
- **Geocoding**: TomTom Geocoding with Nominatim/OpenStreetMap fallback

## Lint & Build

```bash
npm run lint    # ESLint check
npm run build   # Vite production build
```

## Devin Secrets Needed

None required for basic testing. All API keys are embedded in the source code:
- TomTom API key
- QLD Fuel API token
- VIC Fuel API key
- Open Charge Map API key

For production deployment:
- Hostinger FTP credentials (for GitHub Actions deploy workflow)
- Google AdSense pub ID (already in index.html)
