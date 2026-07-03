import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../contexts/ThemeContext';
import { fetchStationDetails, fetchAllFuelPricesForStation } from '../utils/stationDetails';
import AmenityRow from '../components/AmenityRow';
import TouchableMap from '../components/TouchableMap';

const goldPin = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="36" height="52" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#FFD700"/>
    <circle cx="14" cy="14" r="6" fill="#0D2B5E"/>
  </svg>`,
  iconSize: [36, 52],
  iconAnchor: [18, 52],
  popupAnchor: [0, -52],
});

const FUEL_LABELS = {
  E10: 'E10',
  U91: 'Unleaded 91',
  U95: 'Premium 95',
  U98: 'Premium 98',
  Diesel: 'Diesel',
  LPG: 'LPG',
};

export default function FuelStationDetailPage({ station, onBack }) {
  const { theme } = useTheme();
  const [details, setDetails] = useState(null);
  const [allPrices, setAllPrices] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(true);


  useEffect(() => {
    let cancelled = false;
    async function loadDetails() {
      setLoadingDetails(true);
      try {
        const d = await fetchStationDetails(station);
        if (!cancelled) setDetails(d);
      } catch { /* ignore */ }
      if (!cancelled) setLoadingDetails(false);
    }
    loadDetails();
    return () => { cancelled = true; };
  }, [station]);

  useEffect(() => {
    let cancelled = false;
    async function loadPrices() {
      setLoadingPrices(true);
      try {
        const prices = await fetchAllFuelPricesForStation(station);
        if (!cancelled) setAllPrices(prices);
      } catch { /* ignore */ }
      if (!cancelled) setLoadingPrices(false);
    }
    loadPrices();
    return () => { cancelled = true; };
  }, [station]);



  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`;



  const amenities = details?.amenities || {};

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6" style={{ animation: 'fadeSlideIn 0.35s ease' }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
        style={{
          background: theme.chipBg,
          color: theme.text,
          border: `1px solid ${theme.chipBorder}`,
          transition: 'all 0.25s ease',
        }}
      >
        <span>&#9664;</span> Back to results
      </button>

      {/* Station Header */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: theme.gold }}>
          {station.name}
        </h1>
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-bold mt-2"
          style={{
            background: theme.brandBadgeBg,
            color: theme.gold,
            border: `1px solid ${theme.brandBadgeBorder}`,
          }}
        >
          {station.brand}
        </span>
        {station.price && (
          <div className="mt-4 flex items-end gap-3">
            <p className="text-4xl font-bold" style={{ color: theme.green }}>
              {(station.price * 100).toFixed(1)}
              <span className="text-lg ml-1" style={{ color: theme.textSecondary }}>¢/L</span>
            </p>
            <p className="text-sm pb-1" style={{ color: theme.textMuted }}>
              {station.fuelType} &bull; Updated {new Date(station.lastUpdated).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>

      {/* Address & Directions */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: theme.gold }}>
          Location
        </h2>
        <p className="text-sm mb-3" style={{ color: theme.text }}>{station.address}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold no-underline"
            style={{
              background: `linear-gradient(135deg, #C8971F, #FFD700)`,
              color: '#0D2B5E',
              transition: 'all 0.25s ease',
            }}
          >
            &#128663; Get Directions
          </a>
          <a
            href={mapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold no-underline"
            style={{
              background: theme.chipBg,
              color: theme.text,
              border: `1px solid ${theme.chipBorder}`,
              transition: 'all 0.25s ease',
            }}
          >
            &#128506; View on Google Maps
          </a>
        </div>
      </div>

      {/* Map — moved up to sit below location */}
      <TouchableMap
        className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${theme.mapBorder}` }}
      >
        {(mapActive, interactionController) => (
          <MapContainer
            center={[station.latitude, station.longitude]}
            zoom={16}
            style={{ height: '300px', width: '100%' }}
            scrollWheelZoom={false}
            dragging={false}
          >
            {interactionController}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[station.latitude, station.longitude]} icon={goldPin}>
              <Popup>
                <div style={{ color: '#1a1a1a' }}>
                  <strong style={{ color: '#0D2B5E' }}>{station.name}</strong>
                  <br />
                  <span style={{ fontSize: '12px' }}>{station.address}</span>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        )}
      </TouchableMap>

      {/* Fuel Prices — All Types */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: theme.gold }}>
          Live Fuel Prices
        </h2>
        {loadingPrices ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: theme.shimmerBase }}>
                <ShimmerLine theme={theme} width="50%" />
                <ShimmerLine theme={theme} width="70%" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(FUEL_LABELS).map(([code, label]) => {
              const priceData = allPrices?.[code];
              return (
                <FuelPriceTile
                  key={code}
                  label={label}
                  priceData={priceData}
                  theme={theme}
                />
              );
            })}
          </div>
        )}
  
      </div>

      {/* Amenities */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: theme.gold }}>
          Amenities
        </h2>
        {loadingDetails ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerLine key={i} theme={theme} width="70%" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <AmenityRow label="Toilets" value={amenities.toilets} theme={theme} />
            <AmenityRow label="Car Wash" value={amenities.car_wash} theme={theme} />
            <AmenityRow label="Tyre Pressure / Air Pump" value={amenities.air_pump} theme={theme} />
            <AmenityRow label="Convenience Store" value={amenities.shop} theme={theme} />
            <AmenityRow label="ATM" value={amenities.atm} theme={theme} />
            <AmenityRow label="EV Charging" value={amenities.ev_charging} theme={theme} />
            <AmenityRow label="Disability Access" value={amenities.wheelchair} theme={theme} />
          </div>
        )}
      </div>





      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function FuelPriceTile({ label, priceData, theme }) {
  const displayPrice = priceData?.price;

  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{
        background: theme.mode === 'dark' ? 'rgba(13,43,94,0.6)' : 'rgba(240,244,248,0.8)',
        border: `1px solid ${priceData ? theme.cardBorder : theme.divider}`,
      }}
    >
      <p className="text-xs font-semibold mb-1" style={{ color: theme.textSecondary }}>{label}</p>
      {displayPrice ? (
        <>
          <p className="text-xl font-bold" style={{ color: theme.gold }}>
            {(displayPrice * 100).toFixed(1)}
            <span className="text-xs ml-0.5" style={{ color: theme.textSecondary }}>¢/L</span>
          </p>
          {priceData?.lastUpdated && (
            <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>
              {new Date(priceData.lastUpdated).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}

        </>
      ) : (
        <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Not currently available</p>
      )}
    </div>
  );
}



function ShimmerLine({ theme, width = '100%' }) {
  return (
    <div
      className="h-4 rounded animate-pulse"
      style={{ background: theme.shimmerBase, width }}
    />
  );
}
