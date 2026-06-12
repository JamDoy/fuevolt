# FueVolt ⚡⛽

Australian EV Charging Stations & Fuel Price Finder

## Features

- **EV Charging Stations** — Search and browse EV chargers across Australia via Open Charge Map API
- **Fuel Price Comparison** — Compare petrol and diesel prices at nearby stations
- **Interactive Map** — Dark-themed Leaflet map with gold/green pins
- **Geolocation** — "Use My Location" for instant nearby results
- **Filters** — Filter by connector type, status, fuel type
- **Mobile-first** — Responsive design with glassmorphism overlays

## Tech Stack

- React 19 + Vite
- Tailwind CSS v4
- Leaflet / React-Leaflet for maps
- Open Charge Map API for EV data
- No proprietary SDKs — fully self-hostable

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
```

Upload the `dist/` folder to your Hostinger shared hosting `public_html` directory. The included `.htaccess` handles SPA routing and caching.

## Environment

No environment variables required for basic operation. The Open Charge Map API key is embedded in the client code.
