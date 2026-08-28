import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../contexts/ThemeContext';
import { fetchStationDetails, fetchAllFuelPricesForStation } from '../utils/stationDetails';
import { recordPriceSnapshot, getPriceTrend } from '../utils/priceHistory';
import { getBrandStyle } from '../utils/brandLogos';
import TouchableMap from '../components/TouchableMap';
import FuelReminderCard from '../components/FuelReminderCard';
import DigitalPrice from '../components/DigitalPrice';
import ShareMenu from '../components/ShareMenu';
import { buildFuelStationShareUrl } from '../utils/shareLinks';
import { getPriceContext, getPriceFreshness } from '../utils/priceFreshness';

const goldPin = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="36" height="52" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#F59E0B"/>
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

const FUEL_BADGE = {
  U91: { bg: '#0D2B5E', text: '#FFFFFF' },
  E10: { bg: '#22C55E', text: '#FFFFFF' },
  U95: { bg: '#F59E0B', text: '#0D2B5E' },
  U98: { bg: '#B45309', text: '#FFFFFF' },
  Diesel: { bg: '#374151', text: '#FFFFFF' },
  LPG: { bg: '#6B7280', text: '#FFFFFF' },
};

const AMENITY_TILES = [
  { key: 'shop', icon: '\u{1F6D2}', label: 'Shop' },
  { key: 'atm', icon: '\u{1F3E7}', label: 'ATM' },
  { key: 'air_pump', icon: '\u{1F4A8}', label: 'Air Pump' },
  { key: 'car_wash', icon: '\u{1F697}', label: 'Car Wash' },
  { key: 'toilets', icon: '\u{1F6BD}', label: 'Toilets' },
  { key: 'wheelchair', icon: '♿', label: 'Accessible' },
  { key: 'coffee', icon: '☕', label: 'Coffee' },
  { key: 'food', icon: '\u{1F354}', label: 'Food' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FILL_UP_ADVICE = {
  QLD: {
    text: 'Prices in Brisbane typically cycle weekly. Cheapest days are usually Wednesday and Thursday. Avoid Mondays when prices often peak after the weekend reset.',
    bestDays: ['Wed', 'Thu'],
  },
  NSW: {
    text: 'Sydney fuel prices follow a 7-10 day cycle. Tuesday and Wednesday mornings typically offer the lowest prices. Prices usually peak on Thursdays and Fridays.',
    bestDays: ['Tue', 'Wed'],
  },
  VIC: {
    text: 'Melbourne prices follow a 7-day cycle. Wednesday is typically the cheapest day. Thursday to Sunday prices trend higher.',
    bestDays: ['Wed'],
  },
  WA: {
    text: 'Perth has a regulated price cycle. Prices drop every Tuesday and rise through the week. Tuesday is by far the best day to fill up in Perth.',
    bestDays: ['Tue'],
  },
  SA: {
    text: 'Adelaide prices cycle weekly. Cheapest days are typically Tuesday and Wednesday morning.',
    bestDays: ['Tue', 'Wed'],
  },
  OTHER: {
    text: 'Regional fuel prices tend to be more stable than major cities. Check FueVolt regularly for the best time to fill up.',
    bestDays: [],
  },
};

const ID_PREFIX_REGION = { qld: 'QLD', nsw: 'NSW', vic: 'VIC', wa: 'WA' };

function detectRegion(station) {
  const prefix = String(station?.id || '').split('-')[0];
  if (ID_PREFIX_REGION[prefix]) return ID_PREFIX_REGION[prefix];

  // Fallback (e.g. OSM-sourced stations) — the source id doesn't encode a
  // state, but their address string does, so parse it as a last resort.
  const a = (station?.address || '').toUpperCase();
  if (/\bQLD\b/.test(a)) return 'QLD';
  if (/\bNSW\b/.test(a)) return 'NSW';
  if (/\bVIC\b/.test(a)) return 'VIC';
  if (/\bWA\b/.test(a)) return 'WA';
  if (/\bSA\b/.test(a)) return 'SA';
  return 'OTHER';
}

function useCountUp(target, duration = 800, startWhenReady = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!startWhenReady || !Number.isFinite(target)) return undefined;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, startWhenReady]);
  return value;
}

export default function FuelStationDetailPage({ station, onBack, onStationDetail }) {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [details, setDetails] = useState(null);
  const [allPrices, setAllPrices] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [heroVisible, setHeroVisible] = useState(true);
  const heroRef = useRef(null);
  const freshness = getPriceFreshness(station.lastUpdated, station.priceDate, station.dataCheckedAt);

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

  // Log a real snapshot for this station+fuel — this is the only source
  // the price-history sparkline ever draws from, no synthetic data.
  useEffect(() => {
    if (station.price != null && station.fuelType) {
      recordPriceSnapshot(station.id, station.fuelType, station.price);
    }
  }, [station.id, station.fuelType, station.price]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const trend = station.fuelType ? getPriceTrend(station.id, station.fuelType) : null;

  const avg = station.resultAveragePrice;
  const savingsPerLitre = avg != null && station.price != null ? avg - station.price : null;
  const totalSavings = savingsPerLitre != null ? savingsPerLitre * 50 : null;
  const isCheaperThanAvg = totalSavings != null && totalSavings > 0.005;
  const animatedSavings = useCountUp(isCheaperThanAvg ? totalSavings : 0, 800, isCheaperThanAvg);

  const fuelCostEstimate = station.price != null ? (station.price) * 50 : null;

  const rank = station.resultRank;
  const total = station.resultTotal;
  const suburbName = station.resultSuburb || '';
  const fuelTypeLabel = FUEL_LABELS[station.resultFuelType || station.fuelType] || station.fuelType || 'fuel';

  const region = detectRegion(station);
  const advice = FILL_UP_ADVICE[region];
  const todayIdx = (new Date().getDay() + 6) % 7;

  const hasAlternativesContext = station.resultAlternatives != null;
  const alternatives = station.resultAlternatives || [];
  const isLocalCheapest = alternatives.length === 0 || alternatives[0].price >= station.price;

  const amenities = details?.amenities || {};
  const brandStyle = getBrandStyle(station.brand);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const platformNavUrl = isIOS
    ? `maps://maps.apple.com/?daddr=${station.latitude},${station.longitude}`
    : isAndroid
      ? `google.navigation:q=${station.latitude},${station.longitude}`
      : directionsUrl;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${station.latitude},${station.longitude}`;

  const handleNavigate = () => {
    window.location.href = platformNavUrl;
  };

  const handleCopyAddress = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(station.address || '');
      }
      setShareStatus('Address copied ✓');
    } catch {
      setShareStatus('Unable to copy');
    }
    window.setTimeout(() => setShareStatus(''), 2000);
  };

  const shareText = (() => {
    const price = station.price != null ? `${(station.price * 100).toFixed(1)}¢/L` : 'current price';
    const savingsPart = isCheaperThanAvg ? ` — saving $${totalSavings.toFixed(2)} on a fill-up!` : '';
    return `Found fuel at ${price} at ${station.name} via fuevolt.com${savingsPart}`;
  })();

  const cardStyle = {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '16px',
  };

  return (
    <div className="max-w-4xl mx-auto pb-36 sm:pb-6" style={{ animation: 'fadeSlideIn 0.35s ease' }}>
      {/* [1] Hero Header */}
      <Section index={0}>
        <div
          ref={heroRef}
          className="px-4 pt-5 pb-6 sm:px-6 sm:rounded-2xl sm:mt-4"
          style={{
            background: 'linear-gradient(145deg, #0a1628 0%, #0D2B5E 100%)',
            boxShadow: '0 0 48px rgba(34,197,94,0.15), 0 0 80px rgba(245,158,11,0.08)',
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[13px] cursor-pointer"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              Back to results
            </button>
            <ShareMenu
              title={station.name}
              text={shareText}
              url={buildFuelStationShareUrl(station)}
              buttonClassName="cursor-pointer flex-shrink-0"
              buttonStyle={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)' }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full"
                style={{ width: '48px', height: '48px', background: brandStyle.bg }}
              >
                <span className="font-extrabold text-lg" style={{ color: brandStyle.text }}>{brandStyle.short}</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-[28px] sm:text-4xl font-extrabold text-white truncate" style={{ letterSpacing: '-0.02em' }}>
                  {station.name}
                </h1>
              </div>
            </div>
            {station.price != null && (
              <p className="text-2xl sm:text-3xl flex-shrink-0">
                <DigitalPrice context={getPriceContext(station.price, avg)} color={avg == null ? '#F59E0B' : undefined}>
                  {(station.price * 100).toFixed(1)}
                </DigitalPrice>
              </p>
            )}
          </div>

          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {station.brand}{station.brand ? ' · ' : ''}{station.distance ? `${station.distance} km away` : ''}
          </p>
          {station.address && (
            <p className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{station.address}</p>
          )}

          {isCheaperThanAvg ? (
            <div
              className="mt-5 text-center"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '16px', padding: '16px 20px' }}
            >
              <p className="text-[13px] font-medium uppercase" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>
                You could save
              </p>
              <p className="font-black leading-none text-[52px] sm:text-[64px]" style={{ color: '#F59E0B', letterSpacing: '-0.03em' }}>
                ${animatedSavings.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                on a 50L fill-up vs suburb average
              </p>
            </div>
          ) : avg != null && totalSavings != null && totalSavings < -0.005 ? (
            <div className="mt-5 flex justify-center">
              <span
                className="inline-block px-3 py-1.5 rounded-full text-xs"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}
              >
                Prices nearby may be cheaper
              </span>
            </div>
          ) : null}
        </div>
      </Section>

      <div className="px-4 sm:px-0">
        {/* [2] Navigate There */}
        <Section index={2}>
          <div className="mt-3" style={{ ...cardStyle, padding: '20px', boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-2xl" aria-hidden="true">&#128337;</p>
                <p className="font-extrabold text-[22px]" style={{ color: theme.text }}>{station.driveTime != null ? `${station.driveTime} min` : '—'}</p>
                <p className="text-[11px] uppercase" style={{ color: theme.textMuted }}>Drive time</p>
              </div>
              <div>
                <p className="text-2xl" aria-hidden="true">&#128205;</p>
                <p className="font-extrabold text-[22px]" style={{ color: theme.text }}>{station.distance != null ? `${station.distance} km` : '—'}</p>
                <p className="text-[11px] uppercase" style={{ color: theme.textMuted }}>Distance</p>
              </div>
              <div>
                <p className="text-2xl" aria-hidden="true">&#9981;</p>
                <p className="font-extrabold text-[22px]" style={{ color: '#F59E0B' }}>{fuelCostEstimate != null ? `$${fuelCostEstimate.toFixed(2)}` : '—'}</p>
                <p className="text-[11px] uppercase" style={{ color: theme.textMuted }}>Est. fuel cost</p>
                <p className="text-[10px]" style={{ color: theme.textMuted }}>(50L fill-up)</p>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${theme.divider}`, margin: '16px 0' }} />

            <button
              type="button"
              onClick={handleNavigate}
              className="navigate-cta w-full cursor-pointer"
              style={{
                height: '56px',
                background: '#22C55E',
                borderRadius: '14px',
                boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              &#9654; Navigate to {station.name}
            </button>

            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-3 text-xs" style={{ color: theme.textMuted }}>
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.textMuted }}>Open in Google Maps</a>
              <span>&middot;</span>
              <a href={appleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.textMuted }}>Open in Apple Maps</a>
              <span>&middot;</span>
              <button type="button" onClick={handleCopyAddress} className="cursor-pointer" style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '12px' }}>Copy address</button>
            </div>
          </div>
        </Section>

        {/* [4] Station Ranking Badge */}
        {rank != null && total != null && (
          <Section index={3}>
            <RankingBadge rank={rank} total={total} suburb={suburbName} fuelTypeLabel={fuelTypeLabel} />
          </Section>
        )}

        {/* [5] All Fuel Types */}
        <Section index={4}>
          <div className="mt-3" style={cardStyle}>
            <div style={{ padding: '20px' }}>
              <h2 className="text-[15px] font-bold mb-4" style={{ color: theme.heading }}>All prices at this station</h2>
              {loadingPrices ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <ShimmerLine key={i} theme={theme} width="100%" />)}
                </div>
              ) : (
                <div>
                  {Object.entries(FUEL_LABELS).map(([code, label], i, arr) => {
                    const priceData = allPrices?.[code];
                    const badge = FUEL_BADGE[code];
                    const isSearched = code === (station.resultFuelType || station.fuelType);
                    return (
                      <div
                        key={code}
                        className="flex items-center justify-between"
                        style={{ height: '48px', borderBottom: i < arr.length - 1 ? `1px solid ${theme.divider}` : 'none', opacity: priceData ? 1 : 0.35 }}
                      >
                        <span
                          className="inline-flex items-center rounded-full text-xs font-bold"
                          style={{ height: '26px', padding: '0 10px', background: badge.bg, color: badge.text }}
                        >
                          {label}
                        </span>
                        {priceData ? (
                          <span className="flex items-center gap-1.5">
                            <span className="text-lg font-semibold" style={{ color: isSearched ? '#F59E0B' : theme.text }}>
                              <DigitalPrice color={isSearched ? '#F59E0B' : theme.text}>
                                {(priceData.price * 100).toFixed(1)}
                              </DigitalPrice>&cent;/L
                            </span>
                            {isSearched && <span className="text-[10px] font-semibold" style={{ color: '#22C55E' }}>(selected)</span>}
                          </span>
                        ) : (
                          <span className="font-extrabold text-lg" style={{ color: theme.textMuted }}>&mdash;</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {freshness.checkedLabel && (
                <p className="text-[11px] text-center mt-3" style={{ color: theme.textMuted }}>
                  Prices from official government data — {freshness.checkedLabel.replace('Government data ', '')}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* [8] Amenities */}
        <Section index={7}>
          <div className="mt-3" style={{ ...cardStyle, padding: '20px' }}>
            <h2 className="text-[15px] font-bold mb-4" style={{ color: theme.heading }}>At this station</h2>
            {loadingDetails ? (
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="rounded-xl animate-pulse" style={{ width: '44px', height: '44px', background: theme.shimmerBase }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {AMENITY_TILES.map((tile) => {
                  const available = amenities[tile.key] === 'yes';
                  return (
                    <div key={tile.key} className="flex flex-col items-center gap-1.5">
                      <div
                        className="flex items-center justify-center rounded-xl"
                        style={{
                          width: '44px',
                          height: '44px',
                          background: available ? 'rgba(34,197,94,0.1)' : (theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                          fontSize: '20px',
                          filter: available ? 'none' : 'grayscale(1) opacity(0.5)',
                        }}
                      >
                        {tile.icon}
                      </div>
                      <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: available ? theme.text : theme.textMuted }}>
                        {tile.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-center mt-3" style={{ color: theme.textMuted }}>
              Data from OpenStreetMap — may not be fully accurate
            </p>
          </div>
        </Section>

        {/* Map */}
        <Section index={8}>
          <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.mapBorder}` }}>
            <TouchableMap>
              {(mapActive, interactionController) => (
                <MapContainer
                  center={[station.latitude, station.longitude]}
                  zoom={16}
                  style={{ height: '260px', width: '100%' }}
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
          </div>
        </Section>

        {/* [10] Nearby Alternatives — only when we actually have search-context data for this station */}
        {hasAlternativesContext && (
          <Section index={9}>
            <div className="mt-3" style={{ ...cardStyle, padding: '20px' }}>
              {isLocalCheapest ? (
                <>
                  <h2 className="text-[15px] font-bold" style={{ color: '#22C55E' }}>&#10003; You found the best price nearby</h2>
                  <p className="text-xs mt-1" style={{ color: theme.textMuted }}>No cheaper stations within 5km</p>
                </>
              ) : (
                <>
                  <h2 className="text-[15px] font-bold mb-3" style={{ color: theme.heading }}>Other options nearby</h2>
                  {alternatives.map((alt) => {
                    const diff = (alt.price - station.price) * 100;
                    const cheaper = diff < -0.05;
                    return (
                      <div
                        key={alt.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onStationDetail?.(alt)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onStationDetail?.(alt); }}
                        className="flex items-center justify-between mb-2 cursor-pointer alt-station-row"
                        style={{ background: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F9FAFB', borderRadius: '12px', padding: '12px 14px' }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: theme.heading }}>{alt.name}</p>
                          <p className="text-xs" style={{ color: theme.textMuted }}>{alt.distance} km away</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base">
                            <DigitalPrice color={cheaper ? '#22C55E' : '#EF4444'}>{(alt.price * 100).toFixed(1)}</DigitalPrice>&cent;/L
                          </p>
                          <p className="text-[11px] font-semibold" style={{ color: cheaper ? '#22C55E' : '#EF4444' }}>
                            {cheaper ? `${Math.abs(diff).toFixed(1)}¢ less` : `+${diff.toFixed(1)}¢ more`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </Section>
        )}

        {/* [11] Fuel Reminder */}
        <Section index={10}>
          <div className="mt-3">
            <FuelReminderCard />
          </div>
        </Section>

        {/* [12] Price Timing — trend + best day to fill up, merged into one card */}
        <Section index={11}>
          <div
            className="mt-3"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(13,43,94,0.5) 0%, rgba(34,197,94,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(13,43,94,0.04) 0%, rgba(34,197,94,0.04) 100%)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <PriceStatusStrip trend={trend} freshness={freshness} theme={theme} noMargin />

            <h2 className="text-[15px] font-bold mt-4 mb-2" style={{ color: theme.heading }}>
              &#128337; Best time to fill up here
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>{advice.text}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {DAYS.map((day, i) => {
                const isToday = i === todayIdx;
                const isBest = advice.bestDays.includes(day);
                return (
                  <span
                    key={day}
                    className="inline-flex items-center justify-center rounded-full text-xs font-semibold"
                    style={{
                      height: '32px',
                      minWidth: '36px',
                      padding: '0 8px',
                      background: isToday ? '#22C55E' : isBest ? '#0D2B5E' : theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
                      color: isToday || isBest ? '#FFFFFF' : theme.textMuted,
                    }}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
            {advice.bestDays.length > 0 && (
              <p className="text-[11px] mt-1.5" style={{ color: theme.textMuted }}>Navy = best days &middot; Green = today</p>
            )}
            <p className="text-[11px] mt-3" style={{ color: theme.textMuted }}>
              Based on historical Australian fuel price cycles. Actual prices vary.
            </p>
          </div>
        </Section>
      </div>

      {/* Sticky mobile Navigate bar once hero has scrolled out of view */}
      {!heroVisible && (
        <div
          className="sm:hidden fixed left-0 right-0 z-40"
          style={{
            bottom: '68px',
            height: '64px',
            background: theme.cardBg,
            borderTop: `1px solid ${theme.cardBorder}`,
            padding: '10px 16px',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.25)',
          }}
        >
          <button
            type="button"
            onClick={handleNavigate}
            className="navigate-cta w-full h-full cursor-pointer"
            style={{ background: '#22C55E', borderRadius: '12px', border: 'none', color: '#FFFFFF', fontSize: '15px', fontWeight: 700 }}
          >
            &#9654; Navigate to {station.name}
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sectionFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .navigate-cta { transition: transform 150ms ease; }
        .navigate-cta:active { transform: scale(0.97); }
        .alt-station-row { transition: transform 150ms ease, box-shadow 150ms ease; }
        @media (hover: hover) {
          .alt-station-row:hover { transform: translateX(4px); box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        }
      `}</style>
    </div>
  );
}

function Section({ index, children }) {
  return (
    <div style={{ animation: `sectionFadeIn 250ms ease-out both`, animationDelay: `${index * 60}ms` }}>
      {children}
    </div>
  );
}

function PriceStatusStrip({ trend, freshness, theme, noMargin = false }) {
  const state = trend === 'down' ? 'down' : trend === 'up' ? 'up' : 'stable';
  const styles = {
    down: { color: '#22C55E', bg: 'rgba(34,197,94,0.06)', arrow: '↓', text: 'Price falling this week — great time to fill up' },
    up: { color: '#EF4444', bg: 'rgba(239,68,68,0.05)', arrow: '↑', text: 'Price rising — consider filling up today' },
    stable: { color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', arrow: '→', text: 'Price stable this week' },
  };
  const s = styles[state];
  return (
    <div
      className={`${noMargin ? '' : 'mt-3'} flex items-center gap-3`}
      style={{ background: s.bg, borderLeft: `3px solid ${s.color}`, padding: '14px 16px', borderRadius: '10px' }}
    >
      <span className={`price-trend-arrow text-lg font-bold`} style={{ color: s.color }} aria-hidden="true">{s.arrow}</span>
      <p className="text-sm font-medium flex-1" style={{ color: s.color }}>{s.text}</p>
      {freshness?.checkedLabel && (
        <span className="text-[11px] flex-shrink-0" style={{ color: theme.textMuted }}>
          {freshness.checkedLabel.replace('Government data checked ', 'Updated ')}
        </span>
      )}
    </div>
  );
}

function RankingBadge({ rank, total, suburb, fuelTypeLabel }) {
  const isFirst = rank === 1;
  const isTop3 = rank <= 3;
  const gradient = isFirst
    ? 'linear-gradient(135deg, #F59E0B, #FDE68A)'
    : isTop3
      ? 'linear-gradient(135deg, #22C55E, #4ADE80)'
      : '#0D2B5E';
  const percentile = Math.round((rank / total) * 100);

  let mainText;
  let subText;
  if (isFirst) {
    mainText = `\u{1F3C6} Cheapest ${fuelTypeLabel} in ${suburb} today`;
    subText = `The best price out of ${total} station${total === 1 ? '' : 's'} checked`;
  } else if (isTop3) {
    mainText = `#${rank} cheapest ${fuelTypeLabel} in ${suburb} today`;
    subText = `Out of ${total} stations checked`;
  } else {
    mainText = `In the top ${percentile}% cheapest in ${suburb}`;
    subText = `Out of ${total} stations checked`;
  }

  return (
    <div className="mt-3 flex items-center gap-4" style={{ background: '#0D2B5E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 20px' }}>
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{ width: '52px', height: '52px', background: gradient }}
      >
        <span className="font-black" style={{ fontSize: rank > 99 ? '13px' : '20px', color: '#FFFFFF' }}>
          {rank > 99 ? `Top ${percentile}%` : `#${rank}`}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-bold text-white">{mainText}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{subText}</p>
      </div>
    </div>
  );
}

function ShimmerLine({ theme, width = '100%' }) {
  return <div className="h-4 rounded animate-pulse" style={{ background: theme.shimmerBase, width }} />;
}
