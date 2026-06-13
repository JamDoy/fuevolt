import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../contexts/ThemeContext';
import { fetchStationDetails, fetchAllFuelPricesForStation } from '../utils/stationDetails';
import CorrectionForm from '../components/CorrectionForm';
import AmenityRow from '../components/AmenityRow';

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
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [corrections, setCorrections] = useState([]);
  const [loadingCorrections, setLoadingCorrections] = useState(true);

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

  useEffect(() => {
    let cancelled = false;
    async function loadCorrections() {
      setLoadingCorrections(true);
      try {
        const res = await fetch(`/api/corrections.php?station_id=${encodeURIComponent(station.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setCorrections(data.corrections || []);
        }
      } catch { /* API not available yet */ }
      if (!cancelled) setLoadingCorrections(false);
    }
    loadCorrections();
    return () => { cancelled = true; };
  }, [station.id]);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`;

  const getVerifiedValue = (fieldName) => {
    const verified = corrections.find(c => c.field_name === fieldName && c.confirmed_count >= 3);
    if (verified) return { value: verified.corrected_value, verified: true };
    return null;
  };

  const getPendingCorrection = (fieldName) => {
    const pending = corrections.find(c => c.field_name === fieldName && c.confirmed_count < 3);
    if (pending) return pending;
    return null;
  };

  const isGovSource = station.source && (station.source.includes('NSW Government') || station.source.includes('WA FuelWatch'));

  const openingHours = details?.opening_hours || null;
  const phone = details?.phone || null;
  const amenities = details?.amenities || {};

  const todayDay = new Date().toLocaleDateString('en-AU', { weekday: 'long' });

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
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.gold }}>
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
            {station.source && (
              <p className="text-xs mt-2" style={{ color: theme.textMuted }}>
                Data source: {station.source}
              </p>
            )}
          </div>
          {station.price && (
            <div className="text-right">
              <p className="text-3xl font-bold" style={{ color: theme.green }}>
                {(station.price * 100).toFixed(1)}
                <span className="text-sm ml-1" style={{ color: theme.textSecondary }}>¢/L</span>
              </p>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                {station.fuelType} • Updated {new Date(station.lastUpdated).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>
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
        <CorrectionIndicator field="address" corrections={corrections} theme={theme} />
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

      {/* Contact Info */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: theme.gold }}>
          Contact & Hours
        </h2>
        {loadingDetails ? (
          <div className="space-y-2">
            <ShimmerLine theme={theme} width="60%" />
            <ShimmerLine theme={theme} width="80%" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">&#128222;</span>
              <span className="text-sm" style={{ color: theme.text }}>
                {phone || 'Not available from free sources'}
              </span>
            </div>
            <CorrectionIndicator field="phone" corrections={corrections} theme={theme} />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">&#128339;</span>
                <span className="text-sm font-semibold" style={{ color: theme.text }}>Opening Hours</span>
              </div>
              {openingHours ? (
                <OpeningHoursDisplay hours={openingHours} todayDay={todayDay} theme={theme} />
              ) : (
                <p className="text-sm ml-8" style={{ color: theme.textMuted }}>
                  Not available from free sources
                </p>
              )}
              <CorrectionIndicator field="opening_hours" corrections={corrections} theme={theme} />
            </div>
          </div>
        )}
      </div>

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
                  code={code}
                  label={label}
                  priceData={priceData}
                  isGovSource={isGovSource}
                  theme={theme}
                  corrections={corrections}
                />
              );
            })}
          </div>
        )}
        {!isGovSource && !loadingPrices && (
          <p className="text-xs mt-3 italic" style={{ color: theme.textMuted }}>
            ⚠️ Price not currently available from official sources. Government fuel API not registered for this state.
          </p>
        )}
      </div>

      {/* Map */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: `1px solid ${theme.mapBorder}`,
        }}
      >
        <MapContainer
          center={[station.latitude, station.longitude]}
          zoom={16}
          style={{ height: '300px', width: '100%' }}
          scrollWheelZoom={true}
        >
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
            <AmenityRow label="Toilets" value={amenities.toilets} theme={theme} correction={getVerifiedValue('amenity_toilets')} />
            <AmenityRow label="Car Wash" value={amenities.car_wash} theme={theme} correction={getVerifiedValue('amenity_car_wash')} />
            <AmenityRow label="Tyre Pressure / Air Pump" value={amenities.air_pump} theme={theme} correction={getVerifiedValue('amenity_air_pump')} />
            <AmenityRow label="Convenience Store" value={amenities.shop} theme={theme} correction={getVerifiedValue('amenity_shop')} />
            <AmenityRow label="ATM" value={amenities.atm} theme={theme} correction={getVerifiedValue('amenity_atm')} />
            <AmenityRow label="EV Charging" value={amenities.ev_charging} theme={theme} correction={getVerifiedValue('amenity_ev_charging')} />
            <AmenityRow label="Disability Access" value={amenities.wheelchair} theme={theme} correction={getVerifiedValue('amenity_wheelchair')} />
          </div>
        )}
        <CorrectionIndicator field="amenities" corrections={corrections} theme={theme} />
      </div>

      {/* Reviews placeholder */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <h2 className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: theme.gold }}>
          Ratings & Reviews
        </h2>
        <p className="text-sm" style={{ color: theme.textMuted }}>
          Reviews are not available from free API sources.
        </p>
        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 text-sm font-semibold no-underline"
          style={{ color: theme.gold }}
        >
          &#11088; View ratings on Google Maps &rarr;
        </a>
      </div>

      {/* Suggest a Correction */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {!showCorrectionForm ? (
          <button
            onClick={() => setShowCorrectionForm(true)}
            className="w-full px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${theme.green}, ${theme.greenDark})`,
              color: '#FFFFFF',
              border: 'none',
              transition: 'all 0.25s ease',
            }}
          >
            &#9998; Suggest a Correction
          </button>
        ) : (
          <CorrectionForm
            station={station}
            onClose={() => setShowCorrectionForm(false)}
            onSubmitted={(newCorrection) => {
              setCorrections(prev => [...prev, newCorrection]);
              setShowCorrectionForm(false);
            }}
          />
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

function FuelPriceTile({ code, label, priceData, isGovSource, theme, corrections }) {
  const verified = corrections.find(c => c.field_name === `price_${code}` && c.confirmed_count >= 3);
  const pending = corrections.find(c => c.field_name === `price_${code}` && c.confirmed_count < 3);
  const displayPrice = verified ? parseFloat(verified.corrected_value) : priceData?.price;

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
          {verified && <VerifiedBadge theme={theme} />}
          {!isGovSource && !verified && (
            <p className="text-[9px] mt-1 italic" style={{ color: theme.textMuted }}>estimate</p>
          )}
        </>
      ) : (
        <p className="text-xs mt-1" style={{ color: theme.textMuted }}>Not currently available</p>
      )}
      {pending && <PendingBadge count={pending.confirmed_count} theme={theme} />}
    </div>
  );
}

function CorrectionIndicator({ field, corrections, theme }) {
  const pending = corrections.find(c => c.field_name === field && c.confirmed_count < 3);
  const verified = corrections.find(c => c.field_name === field && c.confirmed_count >= 3);
  if (verified) return <VerifiedBadge theme={theme} />;
  if (pending) return <PendingBadge count={pending.confirmed_count} theme={theme} />;
  return null;
}

function VerifiedBadge({ theme }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1"
      style={{
        background: `rgba(46,204,113,0.15)`,
        color: theme.green,
        border: `1px solid rgba(46,204,113,0.3)`,
      }}
    >
      &#10003; Community verified
    </span>
  );
}

function PendingBadge({ count, theme }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] mt-1"
      style={{
        background: theme.chipBg,
        color: theme.textMuted,
        border: `1px solid ${theme.chipBorder}`,
      }}
    >
      Correction pending ({count}/3 confirmed)
    </span>
  );
}

function OpeningHoursDisplay({ hours, todayDay, theme }) {
  if (typeof hours === 'string') {
    if (hours === '24/7') {
      return <p className="text-sm ml-8 font-semibold" style={{ color: theme.green }}>Open 24/7</p>;
    }
    return <p className="text-sm ml-8" style={{ color: theme.text }}>{hours}</p>;
  }
  if (Array.isArray(hours)) {
    return (
      <div className="ml-8 space-y-1">
        {hours.map((h, i) => (
          <div
            key={i}
            className="flex justify-between text-sm px-2 py-1 rounded"
            style={{
              background: h.day === todayDay ? `rgba(255,215,0,0.08)` : 'transparent',
              color: h.day === todayDay ? theme.gold : theme.text,
              fontWeight: h.day === todayDay ? '600' : '400',
            }}
          >
            <span>{h.day}</span>
            <span>{h.hours}</span>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-sm ml-8" style={{ color: theme.textMuted }}>Not available from free sources</p>;
}

function ShimmerLine({ theme, width = '100%' }) {
  return (
    <div
      className="h-4 rounded animate-pulse"
      style={{ background: theme.shimmerBase, width }}
    />
  );
}
